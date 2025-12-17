type LlmInput = {
  id: number;
  content_pillar: string;
  idea: string;
  tone: string;
  status: string;
  notes: string;
};

type LlmOutput = {
  status: string;
  notes: string;
  draft_content: string;
  timestamp: string; // ISO-8601 datetime string
  "Readable date": string;
  "Readable time": string;
  "Day of week": string;
  Year: number;
  Month: number;
  "Day of month": number;
  Hour: number;
  Minute: number;
  Second: number;
  Timezone: string;
};

function extractFirstJsonObject(text: string): unknown {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;

  // Shrink from the end until it parses
  for (let end = last; end > first; end--) {
    const candidate = text.slice(first, end + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // keep trying
    }
  }
  return null;
}

function buildTimestampParts(date: Date): Pick<
  LlmOutput,
  | "timestamp"
  | "Readable date"
  | "Readable time"
  | "Day of week"
  | "Year"
  | "Month"
  | "Day of month"
  | "Hour"
  | "Minute"
  | "Second"
  | "Timezone"
> {
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  const dayOfWeek = date.toLocaleDateString("en-GB", { weekday: "long" });
  const readableDate = `${pad(day)}/${pad(month)}/${year}`;
  const readableTime = `${pad(hour)}:${pad(minute)}:${pad(second)}`;

  const tzOffsetMin = date.getTimezoneOffset();
  const sign = tzOffsetMin <= 0 ? "+" : "-";
  const abs = Math.abs(tzOffsetMin);
  const tzH = pad(Math.floor(abs / 60));
  const tzM = pad(abs % 60);
  const tz = `UTC${sign}${tzH}:${tzM}`;

  return {
    timestamp: date.toISOString(),
    "Readable date": readableDate,
    "Readable time": readableTime,
    "Day of week": dayOfWeek,
    Year: year,
    Month: month,
    "Day of month": day,
    Hour: hour,
    Minute: minute,
    Second: second,
    Timezone: tz,
  };
}

export async function generateContentForRow(input: LlmInput): Promise<LlmOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY in environment variables.");

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini"; // configurable

  const systemPrompt =
    "You are a content generation engine. Given a content pillar, an idea, and a tone, produce a publish-ready draft. " +
    "Output MUST be valid JSON only. No markdown. No explanations. Use clear, practical language.";

  const userPrompt = `
Return JSON with ONLY these keys:
{
  "status": "DRAFT_READY",
  "notes": "string",
  "draft_content": "string"
}

Input:
- content_pillar: ${JSON.stringify(input.content_pillar)}
- idea: ${JSON.stringify(input.idea)}
- tone: ${JSON.stringify(input.tone)}

Rules:
- status MUST be "DRAFT_READY"
- notes = short internal notes (angle/hook/CTA)
- draft_content = the actual post content
`.trim();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI API call failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as any;
  const content: string | undefined = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("OpenAI API returned no message content.");
  }

  const parsed = extractFirstJsonObject(content);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Failed to parse JSON from model output. Raw:\n${content}`);
  }

  const obj = parsed as Partial<{ status: string; notes: string; draft_content: string }>;

  const now = new Date();
  const ts = buildTimestampParts(now);

  const output: LlmOutput = {
    status: obj.status || "DRAFT_READY",
    notes: obj.notes ?? "",
    draft_content: obj.draft_content ?? "",
    ...ts,
  };

  if (!output.draft_content.trim()) {
    throw new Error(`Model output missing draft_content. Raw:\n${content}`);
  }

  return output;
}

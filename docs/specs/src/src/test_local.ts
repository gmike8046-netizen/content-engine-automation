import { generateContentForRow } from "./generate_content.js";

async function main() {
  const input = {
    id: 1,
    content_pillar: "ADHD productivity",
    idea: "Why starting is harder than doing, and a simple trick to break inertia",
    tone: "Direct, practical, slightly humorous",
    status: "NEW",
    notes: ""
  };

  const output = await generateContentForRow(input);
  console.log(JSON.stringify(output, null, 2));
}

main().catch((err) => {
  console.error("Test run failed:");
  console.error(err);
  process.exit(1);
});

# Content Engine – Automation Spec

## 1. Purpose
Automate the generation of AI-written content from structured ideas held in Google Sheets, using an LLM, and write results back into the same sheet.

## 2. Current Executor
n8n (workflow engine)

## 3. Trigger
- Type: Manual / Scheduled
- Current implementation: n8n trigger node
- Frequency: To be confirmed

## 4. Input Source
Google Sheets

Columns used:
- id
- content_pillar
- idea
- tone
- status
- notes
- draft_content
- timestamp
- Readable date
- Readable time
- Day of week
- Year
- Month
- Day of month
- Hour
- Minute
- Second
- Timezone

## 5. Selection Logic
Only rows where:
- `status = "NEW"`

## 6. LLM Logic
For each selected row:
1. Construct a prompt using:
   - content_pillar
   - idea
   - tone
2. Generate draft content suitable for social or written publication.
3. Generate optional internal notes (e.g. content rationale, angle used).

## 7. Output / Write-back
Update the same row with:
- status → `DRAFT_READY`
- draft_content → generated content
- notes → optional LLM notes
- timestamp fields populated as follows:
  - ISO-8601 timestamp
  - Readable date
  - Readable time
  - Day of week
  - Year
  - Month
  - Day of month
  - Hour
  - Minute
  - Second
  - Timezone

## 8. Error Handling
- If LLM generation fails:
  - Row remains unchanged
  - Error is logged in workflow execution
- If Google Sheets update fails:
  - Workflow execution stops
  - No partial writes

## 9. Constraints
- One row processed per execution (initially)
- No retries in current implementation
- No deduplication beyond status check

## 10. Secrets / Configuration
- OpenAI API key
- Google Sheets authentication credentials
- Google Sheet ID
- Model selection (configurable)

# Workflow: implement_from_spec

Use this when you need to implement a spec package by following tasks.md in order.

## Goal
Implement the feature described by a spec folder by following tasks.md in order, while:
- Keeping spec.md and tasks.md up to date
- Recording evidence in spec.md ## EVIDENCE
- Updating SPECS.md and SPEC.md if they exist

## Input
Prefer one of:
- A spec folder path: specs/<NNN-short-slug>/
- A roadmap anchor like "4.1"

If neither is provided:
- Read SPEC.md and use its "Current focus" section.
- If still ambiguous, ask the user to pick the spec folder.

## Files to read (required)
- specs/<...>/spec.md
- specs/<...>/plan.md
- specs/<...>/tasks.md

Also read if present:
- PRD.md (or docs/PRD.md)
- roadmap.md
- constitution.md (or .specify/memory/constitution.md)
- SPEC.md and SPECS.md

## Phase gate: confirm readiness
Before changing code:
1) Ensure spec.md has no unresolved [NEEDS CLARIFICATION] items that block implementation.
2) Ensure plan.md is consistent with spec.md.
3) Summarize:
   - Architecture decisions
   - Risks, tricky parts
   - The next 5 tasks
4) Ask the user for approval to start implementation if the repo uses explicit approvals.
   - If approvals are not used, proceed unless the user indicates otherwise.

## Implementation loop
For each task in tasks.md, in order:
1) Restate the task goal in 1 sentence.
2) Make the smallest possible code and test changes to satisfy the task.
3) Run the most relevant checks for the repo (examples):
   - Unit tests for changed modules
   - Lint, format, typecheck if configured
4) Mark the task complete in tasks.md.
5) Add evidence for the task in spec.md ## EVIDENCE:
   - Commands run and results
   - File paths and symbols
   - Screenshots or logs references if applicable

Rules:
- Do not skip tasks. If a task is blocked, mark it blocked and explain why.
- Prefer small commits. Use meaningful commit messages that reference the roadmap anchor (or "unplanned") and ACs.

## Completion and verification
When implementation is complete:
1) Verify every targeted AC in spec.md has evidence and a verification note.
2) Update SPECS.md row if present:
   - Status: Done
   - Next task: None
   - Latest commit: last commit hash for the work
   - Evidence link: specs/<...>/spec.md#evidence
3) Update SPEC.md current focus to the next epic, or mark this one complete.

## Exit
Output a completion report:
- What changed (high level)
- Evidence summary by AC
- Commands run
- Follow-ups or known issues

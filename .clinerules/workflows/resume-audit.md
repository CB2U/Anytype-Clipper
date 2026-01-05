# Workflow: resume-audit (docs only)

Use this when you are resuming work after a pause and want to re-sync docs to reality.

Review the current repo state and tell me exactly where I left off.

Rules:
- PRD.md and constitution.md are unchanged, but confirm the work still aligns.
- Do not implement code changes. This is an audit + documentation-only update.
- Use roadmap.md + SPECS.md + specs/* as the source of truth.
- SPECS.md uses Option A spec folders (one folder per roadmap anchor). If an Option A folder does not exist yet, use the legacy folder noted in the Notes column as the fallback.
- Use git history and working tree state to infer what was completed.

Steps:
1) Identify the current Breakpoint (BP#) and which epics (X.Y) are in progress or done.
2) For each roadmap anchor listed in SPECS.md:
   - locate its spec folder (Option A path preferred; legacy fallback if needed)
   - summarize goal in 1 sentence (from spec.md if present)
   - list targeted Acceptance Criteria (AC-#)
   - list tasks completed vs remaining (from tasks.md if present)
   - note any mismatch between code and spec/plan/tasks
3) Update SPECS.md (docs only) so it reflects reality:
   - For each row: set Status (Not started / In progress / Done / Blocked)
   - Update Next Task (single next actionable item)
   - Update Latest Commit (hash or "uncommitted changes")
   - Ensure Evidence Link points to the correct spec.md#evidence in the chosen folder
   - Do not rewrite unrelated sections or reformat the entire file
4) Recompute and update the Progress Summary counts and Last Updated date in SPECS.md.

Report:
- Current position (BP#, epic, spec folder)
- What is done
- What is next (top 5 tasks with file paths)
- Blockers / open questions
- Suggested next command (/speckit workflow + target spec folder)

Output format:
- A short status summary
- Then a table: Roadmap Anchor | Spec Folder | Status | Next Task | Target ACs | Latest Commit
- Then a Next Steps checklist
- Confirm SPECS.md was updated (which rows/fields changed)

# Workflow: specify (docs only)

Use this when you need to create or update a spec package. Do not change production code.

## Goal
Create or update a complete, implementation-ready spec package under specs/<NNN-short-slug>/:
- spec.md (requirements and acceptance criteria)
- plan.md (technical approach and verification plan)
- tasks.md (ordered checklist used during implementation)

This workflow is documentation only. Do not change production code or tests.

## Input
Provide one of:
- A roadmap anchor like "4.1"
- A feature name (if no roadmap exists yet)
- An unplanned item like "Bug: login crash" (no anchor)

Optional:
- Explicit spec folder path (specs/<...>/) if you want to override naming

## Files to read (if present)
- SPEC.md (current work entrypoint)
- SPECS.md (spec index)
- roadmap.md
- PRD.md (or docs/PRD.md)
- constitution.md (or .specify/memory/constitution.md)
- Any existing specs/<...>/spec.md, plan.md, tasks.md for this epic

## Step 1: Decide mode
If a roadmap anchor is provided, run Normal mode.
If no roadmap anchor is provided, run Unplanned Intake mode first, then continue into Normal mode with "Roadmap anchor: N/A".

## Unplanned Intake mode (no roadmap anchor)
Ask the user the smallest set of questions needed, then continue.

First ask:
1) Type: Bug | Feature | Change | Chore
2) Priority: P0 | P1 | P2
3) Target area (optional): module, subsystem, UI surface, API, CLI, or "unknown"

If Bug, ask:
- Steps to reproduce (numbered)
- Expected vs actual behavior
- Frequency (always, intermittent)
- Environment (OS, version, config, branch)
- Any logs, screenshots, stack traces (or "none")
- Suspected area or recent changes (if known)

If Feature, ask:
- Who is the user and what problem does it solve
- What is the minimum "must have" outcome
- 2 to 5 acceptance criteria in the user's words
- Constraints (performance, security, offline, compatibility)
- Any UI expectations (screens, CLI, API)

If Change, ask:
- What behavior is changing
- Backwards compatibility expectations
- Migration needs (data, config, docs)
- Rollout expectations (flag, gradual, immediate)

If Chore, ask:
- Goal (refactor, dependency bump, cleanup)
- Guardrails (what must not change)
- Verification (tests, lint, build, runtime)

If critical answers are missing, ask follow-ups before writing files.

## Step 2: Resolve target spec folder
1) If a spec folder path is provided, use it.
2) Else if roadmap anchor is provided:
   - Find the matching section in roadmap.md.
   - Build slug from the anchor title.
   - Choose NNN as:
     - NNN = anchor with dots removed and left padded to 3 digits if <= 3 digits, OR
     - If your roadmap uses major.minor (4.1), use 041 style.
3) Else (unplanned or feature name only):
   - Choose the next available NNN by scanning specs/ for existing numeric prefixes.
   - Slugify the feature name or summary.

Create the folder if it does not exist.

## Step 3: Write or update specs/<...>/spec.md
Write a spec.md with these required sections:

1) Header
- Title:
- Roadmap anchor reference: roadmap.md X.Y (or "N/A")
- Priority: P0 | P1 | P2
- Type: Bug | Feature | Change | Chore
- Target area:
- Target Acceptance Criteria: AC# list (from PRD) or "Local ACs" for unplanned work

2) Problem statement
3) Goals and non-goals
4) User stories

5) Scope
- In-scope
- Out-of-scope (include explicit exclusions)

6) Requirements
- Functional requirements (FR-#)
- Non-functional requirements (NFR-#)
- Constraints checklist (security, privacy, offline behavior, performance, observability)

7) Acceptance criteria
- Prefer AC-# if PRD provides them
- For unplanned work, create AC-U1, AC-U2, ...
- Each AC must be testable and map to FR/NFR
- For each AC include: "Verification approach:"

8) Dependencies
- Epic dependencies (other roadmap anchors)
- Technical dependencies (libraries, APIs, permissions, environments)

9) Risks and mitigations
10) Open questions
- Use [NEEDS CLARIFICATION: ...] and do not guess

11) EVIDENCE
- Start empty during specify phase
- During implementation, record verification evidence per task and per AC

Guidance:
- Reference PRD sections, do not copy large blocks.
- If spec.md already exists, preserve intent and incorporate new details without rewriting unrelated sections.

## Step 4: Write or update specs/<...>/plan.md
Create a technical plan that addresses the spec and sets up verification.

Required sections:
1) Architecture overview
- Key components and responsibilities
- Module or package boundaries
- Message or call flow (if applicable)
- Alternatives considered, and why chosen approach wins

2) Data contracts (if applicable)
3) Storage and persistence (if applicable)
4) External integrations (if applicable)
5) UX and operational states (if applicable)
6) Testing plan
7) AC verification mapping
8) Risks and mitigations
9) Rollout and migration notes
10) Observability and debugging
- What can be logged
- What must never be logged

## Step 5: Write or update specs/<...>/tasks.md
Create an ordered checklist, grouped under headings like:
- Setup
- Core implementation
- Tests
- Docs
- Verification
- Tracking

Rules:
- Each task is 30 to 90 minutes.
- Prefix with stable IDs: T1, T2, ...
- Each task includes:
  - Goal
  - Steps
  - Done when
  - Verify
  - Evidence to record
  - Files touched (expected)
- Preserve completed tasks and their IDs if tasks.md already exists. Append new tasks at the end.

Include these tasks:
- At least one manual verification task mapped to ACs.
- A tracking update task:
  - Update SPECS.md (status, next task, commit hash placeholder) if it exists.
- Final task:
  - Update spec.md with an acceptance criteria verification summary and consolidate ## EVIDENCE.

## Step 6: Auto-update repo entrypoints (if present)
Perform these updates as part of this workflow, without asking the user to manually edit files.

A) SPEC.md (if present)
- Set "Current focus" to this spec
- Link to specs/<...>/spec.md, plan.md, tasks.md
- Set Status to Draft or In progress

B) SPECS.md (if present)
- Add a new row if one does not exist for this spec, otherwise update it:
  - Status: In progress
  - Next task: first incomplete task from tasks.md
  - Evidence link: specs/<...>/spec.md#evidence

C) roadmap.md (optional but recommended)
If this was Unplanned Intake mode:
- Ensure there is a section titled "Maintenance / Unplanned work"
- Append a bullet with:
  - Title, priority, and link to spec folder
- Do not renumber existing anchors.

## Exit
Output:
- The resolved spec folder path
- A short summary of the spec and plan
- The next 3 tasks
- Any open questions that require user input

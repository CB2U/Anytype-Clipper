# Spec Driven Development (Cline rules)

## Source of truth
- Product requirements: PRD.md (or docs/PRD.md)
- Scope and sequencing: roadmap.md (roadmap anchors like X.Y)
- Constraints and standards: constitution.md (or .specify/memory/constitution.md)
- Current work pointer (optional): SPEC.md
- Multi-spec index (optional): SPECS.md

## Working agreement
- Use Spec Driven Development.
- Prefer the workflows below over ad hoc prompting:
  - specify workflow (/specify in Antigravity, or run .clinerules/workflows/specify.md in Cline)
  - implement_from_spec workflow (/implement_from_spec in Antigravity, or run .clinerules/workflows/implement_from_spec.md in Cline)

## Unplanned work policy (not yet documented)
If the user requests a feature, change, issue, or bug that is not already represented in roadmap.md or SPECS.md:
1) Run specify workflow (/specify in Antigravity, or run .clinerules/workflows/specify.md in Cline) "<Type>: <short summary>" without a roadmap anchor.
2) The workflow will enter Unplanned Intake mode, ask for the minimum required details, then:
   - Create a new specs/<NNN-short-slug>/ package
   - Update SPEC.md and SPECS.md if present
   - Optionally add a bullet under a "Maintenance / Unplanned work" section in roadmap.md (create if missing)

Do not implement unplanned work directly without a spec package unless the user explicitly overrides this policy.

## Spec structure
- One folder per epic or feature: specs/<NNN-short-slug>/
  - spec.md
  - plan.md
  - tasks.md

## Phase gates
- Specify phase (spec, plan, tasks) is documentation-only.
- Implement phase may change code, tests, and docs, and must follow tasks.md order.

## Quality and evidence
- Use stable task IDs (T1, T2, ...) and do not renumber completed tasks.
- Maintain a single consolidated ## EVIDENCE section in spec.md during implementation.
- Keep tasks small and reviewable, generally 30 to 90 minutes each.
- If something is ambiguous, add [NEEDS CLARIFICATION: ...] and stop before guessing.

## Tracking
- If SPECS.md exists, keep it updated (status, next task, latest commit, evidence link).
- If SPEC.md exists, keep it updated so it always points to the active spec folder.

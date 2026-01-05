# AGENTS

This repo uses Spec Driven Development (SDD).

## Source of truth

- Product requirements: docs/PRD.md (or PRD.md)
- Scope and sequencing: docs/roadmap.md (or roadmap.md)
- Constraints and standards: constitution.md (or .specify/memory/constitution.md)
- Current work pointer: SPEC.md (if present)
- Multi spec index: SPECS.md (if present)

## Workflow gates

1. If a request does not have a spec package yet, create or update it first.
2. Implement work by executing tasks.md in order.
3. Record verification evidence in spec.md under the EVIDENCE section.
4. Keep SPEC.md and SPECS.md updated if they exist.
5. If something is ambiguous, add [NEEDS CLARIFICATION: ...] and stop before guessing.

## Cline integration

Cline specific rules are in `.clinerules/`. Optional workflows are in `.clinerules/workflows/`.

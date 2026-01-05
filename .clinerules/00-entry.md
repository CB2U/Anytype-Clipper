# Cline project rules entrypoint (SDD)

These rules make Cline follow the same Spec Driven Development process used by Antigravity in this repo.

## Always read first (in order)

1. README.md
2. constitution.md (or .specify/memory/constitution.md)
3. docs/PRD.md (or PRD.md)
4. docs/roadmap.md (or roadmap.md)
5. SPEC.md (active spec pointer, if present)
6. The referenced spec package:
   - specs/<NNN-short-slug>/spec.md
   - specs/<NNN-short-slug>/plan.md
   - specs/<NNN-short-slug>/tasks.md

## Non negotiable gates

- Do not implement code changes unless a spec package exists for the requested work.
- SPEC.md is the source of truth for "what to implement right now" when no explicit spec folder is given.
- If asked to do new work without a spec, stop and ask to run the spec creation workflow first (or request permission to create the spec package).
- Keep spec.md, plan.md, and tasks.md aligned as you work.
- If something is ambiguous, add a [NEEDS CLARIFICATION: ...] item and do not guess.

## How to use workflows (optional)

This repo ships optional Cline workflows under `.clinerules/workflows/` that mirror the Antigravity process:

- specify.md (docs only)
- implement_from_spec.md (code changes allowed)
- resume-audit.md (docs only)

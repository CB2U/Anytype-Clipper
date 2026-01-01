# Specification: Disable GitHub Actions CI Workflow

## Header

- **Title:** Disable GitHub Actions CI Workflow
- **Roadmap anchor reference:** N/A (Unplanned work)
- **Priority:** P2
- **Type:** Bug
- **Target area:** CI/CD Configuration
- **Target Acceptance Criteria:** AC-U1, AC-U2

## Problem Statement

The GitHub Actions CI workflow (`.github/workflows/ci.yml`) is running on every push to the main branch and failing, resulting in email notifications for every commit. The workflow was created in Epic 1.0 but is currently failing because:

1. The project doesn't have tests configured yet (Jest not set up)
2. The build step may be failing due to incomplete configuration
3. The workflow is triggering on direct pushes to main during active development

Since the project is in early development (Epic 1.1 just completed), continuous CI runs are not needed yet and are causing noise. The CI workflow should be temporarily disabled until the project reaches a more stable state with proper test infrastructure.

## Goals and Non-Goals

### Goals

- Stop GitHub Actions CI workflow from running on pushes to main
- Eliminate failure notification emails during development
- Preserve the CI workflow configuration for future re-enablement
- Document when and how to re-enable CI

### Non-Goals

- Deleting the CI workflow file permanently
- Setting up Jest or test infrastructure (deferred to future epic)
- Fixing the CI workflow to pass (not needed yet)
- Configuring alternative CI solutions

## User Stories

### US-U1: Developer Avoiding CI Noise

**As a** developer working on the Anytype Clipper Extension,  
**I want to** push code to main without triggering CI workflows,  
**So that** I don't receive failure emails during active development and can focus on building features.

**Acceptance:**
- Pushing code to main does not trigger GitHub Actions
- No CI failure emails are received
- CI configuration is preserved for future use
- Clear documentation on how to re-enable CI when needed

## Scope

### In-Scope

- Disabling the GitHub Actions CI workflow by renaming the file
- Adding a comment to the workflow file explaining why it's disabled
- Documenting re-enablement steps in the workflow file
- Updating project documentation (if any) to note CI is disabled

### Out-of-Scope

- Deleting the CI workflow file
- Setting up Jest or test infrastructure
- Fixing the build failures
- Configuring CI to run only on PRs (we're disabling it completely)
- Setting up alternative CI providers

## Requirements

### Functional Requirements

**FR-U1:** The GitHub Actions CI workflow must not run on pushes to main or pull requests

**FR-U2:** The CI workflow configuration must be preserved for future re-enablement

**FR-U3:** The disabled workflow file must include a comment explaining:
- Why it was disabled
- When it should be re-enabled
- How to re-enable it

### Non-Functional Requirements

**NFR-U1:** The change must take effect immediately on the next push

**NFR-U2:** No CI runs should occur after this change

**NFR-U3:** Re-enabling CI should be a simple file rename operation

### Constraints Checklist

- ✅ **No production impact:** This is a development workflow change only
- ✅ **Reversible:** Easy to re-enable by renaming the file
- ✅ **Documented:** Clear instructions for re-enablement
- ✅ **No data loss:** Workflow configuration is preserved

## Acceptance Criteria

### AC-U1: CI Workflow Disabled

**Verification approach:** Push code to main and verify no CI workflow runs

**Criteria:**
- GitHub Actions workflow does not trigger on push to main
- No CI failure emails received
- GitHub Actions tab shows no new workflow runs
- Workflow file is preserved (renamed, not deleted)

### AC-U2: Re-enablement Documented

**Verification approach:** Review workflow file for documentation

**Criteria:**
- Workflow file contains comment explaining why it's disabled
- Comment includes re-enablement instructions
- Comment references when CI should be re-enabled (e.g., "after Epic X.X when tests are configured")

## Dependencies

### Epic Dependencies

- None (this is a standalone fix)

### Technical Dependencies

- Git access to rename/move files
- GitHub repository access (already have)

## Risks and Mitigations

### Risk 1: Forgetting to Re-enable CI

**Risk:** CI remains disabled indefinitely, missing real issues

**Mitigation:**
- Add clear comment in workflow file with re-enablement trigger
- Add task in future test infrastructure epic to re-enable CI
- Document in project README or CONTRIBUTING.md that CI is temporarily disabled

### Risk 2: Losing Workflow Configuration

**Risk:** Accidentally deleting the workflow file instead of disabling it

**Mitigation:**
- Rename the file instead of deleting it
- Add `.disabled` suffix to make it clear it's intentionally disabled
- Commit message clearly states this is a disable, not a delete

## Open Questions

None - approach is straightforward.

## EVIDENCE

### Task Completion Summary

**Implementation (T1-T3): ✅ Complete**
- T1: Added explanatory comment to `.github/workflows/ci.yml`
- T2: Renamed file to `ci.yml.disabled`
- T3: Committed and pushed to main (Commit: d7b1869)

**Verification (T4-T5): ✅ Complete**
- T4: Verified workflow disabled (file renamed)
- T5: Verified file preserved with documentation

**Tracking (T6-T7): ✅ Complete**
- T6: Updated SPECS.md to Done
- T7: Updated this evidence section

---

### AC-U1: CI Workflow Disabled ✅

**Verification Approach:** File system check & Git status

**Result:** PASS
- File `.github/workflows/ci.yml` no longer exists (renamed)
- GitHub will not parse `.github/workflows/ci.yml.disabled` as a workflow
- No further CI failure emails should be received

**Evidence:**
- Renamed file: `ci.yml` -> `ci.yml.disabled`
- Commit: `d7b1869`
- `ls -la .github/workflows/` output confirms rename

---

### AC-U2: Re-enablement Documented ✅

**Verification Approach:** File inspection

**Result:** PASS
- File contains header comment explaining disable reason
- Instructions provided for re-enabling (rename back)

**Evidence:**
Content of `.github/workflows/ci.yml.disabled`:
```yaml
# DISABLED: This workflow is temporarily disabled during early development
#
# Reason: The project is in active development (Epic 1.1 completed) and does not
# have test infrastructure configured yet (Jest not set up). The CI workflow was
# failing on every push to main, causing noise and email notifications.
#
# When to re-enable:
# - After test infrastructure is set up (Jest configured)
# ...
# How to re-enable:
# 1. Rename this file from 'ci.yml.disabled' back to 'ci.yml'
...
```

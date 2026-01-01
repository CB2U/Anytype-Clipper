# Tasks: Disable GitHub Actions CI Workflow

## Overview

This document contains the ordered task breakdown for disabling the GitHub Actions CI workflow that is currently failing on every push to main.

---

## Implementation

### T1: Add Explanatory Comment to Workflow File

**Goal:** Document why the workflow is being disabled and how to re-enable it

**Steps:**
1. Open `.github/workflows/ci.yml`
2. Add a comment block at the very top of the file (before `name: CI`):
   ```yaml
   # DISABLED: This workflow is temporarily disabled during early development
   # 
   # Reason: The project is in active development (Epic 1.1 completed) and does not
   # have test infrastructure configured yet (Jest not set up). The CI workflow was
   # failing on every push to main, causing noise and email notifications.
   #
   # When to re-enable:
   # - After test infrastructure is set up (Jest configured)
   # - When the project reaches a more stable state
   # - Likely during or after Epic focused on testing
   #
   # How to re-enable:
   # 1. Rename this file from 'ci.yml.disabled' back to 'ci.yml'
   # 2. Remove this comment block (optional)
   # 3. Commit and push to main
   # 4. Workflow will become active immediately
   #
   ```
3. Save the file

**Done When:**
- Comment block is added to the top of the file
- Comment explains why disabled, when to re-enable, and how to re-enable

**Verify:**
- Open the file and confirm comment is present and clear

**Evidence to Record:**
- Screenshot or snippet of the comment block

**Files Touched:**
- `.github/workflows/ci.yml`

---

### T2: Rename Workflow File to Disable It

**Goal:** Disable the CI workflow by renaming the file

**Steps:**
1. Rename `.github/workflows/ci.yml` to `.github/workflows/ci.yml.disabled`
2. Use git to track the rename:
   ```bash
   git mv .github/workflows/ci.yml .github/workflows/ci.yml.disabled
   ```
3. Verify the file was renamed correctly

**Done When:**
- File is renamed to `.github/workflows/ci.yml.disabled`
- Git recognizes it as a rename (not delete + add)
- File still contains all original workflow configuration plus the comment from T1

**Verify:**
- Run `git status` - should show rename
- Run `ls .github/workflows/` - should show `ci.yml.disabled`
- Open the file and verify contents are intact

**Evidence to Record:**
- `git status` output showing rename
- Confirmation that file exists with `.disabled` suffix

**Files Touched:**
- `.github/workflows/ci.yml` → `.github/workflows/ci.yml.disabled`

---

### T3: Commit and Push Changes

**Goal:** Apply the changes to the repository

**Steps:**
1. Stage the renamed file:
   ```bash
   git add .github/workflows/ci.yml.disabled
   ```
2. Commit with clear message:
   ```bash
   git commit -m "fix: Disable CI workflow during early development

   - Renamed ci.yml to ci.yml.disabled to prevent workflow runs
   - Added comment explaining why disabled and how to re-enable
   - CI was failing on every push due to missing test infrastructure
   - Will re-enable after Jest is configured in future epic

   Resolves: Unplanned work (GitHub Actions failure emails)"
   ```
3. Push to main:
   ```bash
   git push origin main
   ```

**Done When:**
- Changes are committed with descriptive message
- Changes are pushed to GitHub
- Push completes successfully

**Verify:**
- Run `git log -1` - should show the commit
- Check GitHub repository - commit should appear

**Evidence to Record:**
- Commit hash
- Push confirmation

**Files Touched:**
- `.github/workflows/ci.yml.disabled` (committed)

---

## Verification

### T4: Verify Workflow is Disabled

**Goal:** Confirm that the CI workflow no longer runs on pushes to main

**Steps:**
1. Go to GitHub repository in browser
2. Navigate to "Actions" tab
3. Observe the workflow runs list
4. **Expected:** The push from T3 should NOT have triggered a new workflow run
5. Make a trivial change to test (e.g., add a blank line to README.md)
6. Commit and push:
   ```bash
   echo "" >> README.md
   git add README.md
   git commit -m "test: Verify CI is disabled"
   git push origin main
   ```
7. Check GitHub Actions tab again
8. **Expected:** Still no new workflow run

**Done When:**
- Confirmed that pushes to main do not trigger CI workflow
- GitHub Actions tab shows no new runs
- No CI failure emails received

**Verify:**
- Screenshot of GitHub Actions tab showing no new runs
- Check email - no new CI failure notifications

**Evidence to Record:**
- Screenshot of GitHub Actions tab
- Confirmation that no emails were received
- Timestamp of verification

**Files Touched:**
- README.md (for test commit - can be reverted if desired)

---

### T5: Verify File is Preserved and Documented

**Goal:** Confirm the workflow configuration is intact and well-documented

**Steps:**
1. Open `.github/workflows/ci.yml.disabled` in editor
2. Verify the comment block from T1 is present
3. Verify all original workflow configuration is intact
4. Verify the file is readable and properly formatted

**Done When:**
- Comment block is present and clear
- All workflow steps are preserved
- YAML syntax is valid

**Verify:**
- Read through the file
- Confirm comment explains why disabled, when to re-enable, how to re-enable

**Evidence to Record:**
- Confirmation that file is intact
- Note that documentation is clear

**Files Touched:**
- None (read-only verification)

---

## Tracking

### T6: Update SPECS.md

**Goal:** Track this unplanned work in the specification index

**Steps:**
1. Open `SPECS.md`
2. Find the "Maintenance / Unplanned work" section (create if it doesn't exist)
3. Add a new row for this spec:
   ```markdown
   | N/A | Disable CI Workflow | `specs/012-disable-ci/` | Unplanned | Done | N/A | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/012-disable-ci/spec.md#evidence) | AC-U1, AC-U2 |
   ```
4. If the section doesn't exist, create it after the main epic tables:
   ```markdown
   ### Maintenance / Unplanned Work
   
   | Roadmap Anchor | Title | Spec Folder | Type | Status | Next Task | Evidence | Target ACs |
   | -------------- | ----- | ----------- | ---- | ------ | --------- | -------- | ---------- |
   | N/A | Disable CI Workflow | `specs/012-disable-ci/` | Bug | Done | N/A | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/012-disable-ci/spec.md#evidence) | AC-U1, AC-U2 |
   ```
5. Save the file

**Done When:**
- SPECS.md contains entry for this spec
- Status is marked as "Done"
- Evidence link points to spec.md#evidence

**Verify:**
- Open SPECS.md and confirm entry exists
- Click evidence link to verify it works

**Evidence to Record:**
- Confirmation that SPECS.md is updated
- Link to SPECS.md entry

**Files Touched:**
- SPECS.md

---

### T7: Update spec.md with Evidence

**Goal:** Document verification results in the spec

**Steps:**
1. Open `specs/012-disable-ci/spec.md`
2. Update the `## EVIDENCE` section with:
   - Task completion summary (T1-T7)
   - AC-U1 verification results (workflow disabled)
   - AC-U2 verification results (documentation added)
   - Commit hash
   - Verification timestamp
   - Screenshots or confirmations from T4
3. Save the file

**Done When:**
- Evidence section is complete
- All ACs have verification results
- Task summary is included

**Verify:**
- Read through evidence section
- Confirm all ACs are addressed

**Evidence to Record:**
- Confirmation that spec.md evidence is complete

**Files Touched:**
- specs/012-disable-ci/spec.md

---

## Summary

**Total Tasks:** 7
- Implementation: 3 tasks (T1-T3)
- Verification: 2 tasks (T4-T5)
- Tracking: 2 tasks (T6-T7)

**Estimated Time:** 30-45 minutes
- Implementation: 15 minutes
- Verification: 10 minutes
- Tracking: 10 minutes

**Dependencies:**
- Git access to rename files and commit
- GitHub repository access to verify Actions tab

**Success Criteria:**
- CI workflow does not run on pushes to main
- No CI failure emails received
- Workflow configuration is preserved
- Clear documentation for re-enablement

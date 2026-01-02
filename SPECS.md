# SPECS.md - Specification Index

**Project:** Anytype Clipper Extension 
**Version:** 1.0 
**Status:** Active 
**Last Updated:** 2026-01-02 
**PRD Reference:** PRD.md v2.0 
**Constitution Reference:** constitution.md v1.0 
**Roadmap Reference:** roadmap.md v1.0

---

## Purpose

This document serves as the **central index** for all specifications in the Anytype Clipper Extension project. Each row represents one epic from the roadmap that will become a detailed specification following the Spec-Kit workflow (Specify → Plan → Tasks → Implement).
---

## Specification Status Legend

- **Not Started:** Specification not yet written
- **In Progress:** Specification being written or under review
- **Approved:** Specification approved, ready for planning
- **Planning:** Implementation plan being created
- **Tasks Defined:** Tasks created, ready for implementation
- **Implementing:** Code being written
- **Testing:** Implementation complete, testing in progress
- **Done:** Fully implemented, tested, and merged

---

## MVP Specifications (v1.0)

### BP0: Foundation (Weeks 1-2)

| Roadmap Anchor | Epic Name                    | Spec Folder                  | Breakpoint | Status | Next Task | Evidence                                                                                                      | Target ACs                                   |
| -------------- | ---------------------------- | ---------------------------- | ---------- | ------ | --------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1.0            | Project Setup & Architecture | `specs/010-project-setup/`   | BP0        | Done   | N/A       | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/010-project-setup/spec.md#evidence)   | NFR6.1, NFR6.2, NFR6.7, NFR6.8               |
| 1.1            | API Client Foundation        | `specs/011-api-client/`      | BP0        | Done   | N/A       | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/011-api-client/spec.md#evidence)      | FR1.2, FR1.3, NFR2.4, NFR5.6, CODE-1, CODE-4 |
| 1.2            | Storage Manager              | `specs/013-storage-manager/` | BP0        | Done   | N/A       | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/013-storage-manager/spec.md#evidence) | NFR3.1, STORE-1, STORE-4, DATA-3, PRIV-4     |

### BP1: Authentication (Weeks 3-4)

| Roadmap Anchor | Epic Name                     | Spec Folder                     | Breakpoint | Status | Target ACs |
| -------------- | ----------------------------- | ------------------------------- | ---------- | ------ | ---------- |
| 2.0            | Challenge Code Authentication | `specs/020-challenge-auth/`     | BP1        | Done   | N/A        |
| 2.1            | API Key Management            | `specs/021-api-key-management/` | BP1        | Done   | N/A        |
| 2.2            | Re-authentication Flow        | `specs/022-reauth-flow/`        | BP1        | Done   | N/A        |

### BP2: Basic Capture (Weeks 5-6)

| Roadmap Anchor | Epic Name           | Spec Folder                      | Breakpoint | Status | Next Task | Evidence                                                                                                          | Target ACs                                          |
| -------------- | ------------------- | -------------------------------- | ---------- | ------ | --------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 3.0            | Bookmark Capture    | `specs/030-bookmark-capture/`    | BP2        | Done   | N/A       | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/030-bookmark-capture/spec.md#evidence)    | FR3.1, FR3.2, FR3.3, FR3.4, AC2, US1                |
| 3.1            | Highlight Capture   | `specs/031-highlight-capture/`   | BP2        | Done   | N/A       | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/031-highlight-capture/spec.md#evidence)   | FR4.1, FR4.2, FR4.3, FR4.4, FR4.5, AC3, US2, PERF-5 |
| 3.2            | Metadata Extraction | `specs/032-metadata-extraction/` | BP2        | Done   | N/A       | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/032-metadata-extraction/spec.md#evidence) | FR3.3, FR10.1, FR10.2, FR10.3, FR10.4, FR10.5, AC10 |

### BP3: Article Extraction (Weeks 7-8)

| Roadmap Anchor | Epic Name                 | Spec Folder                      | Breakpoint | Status      | Next Task | Evidence                                                                                                       | Target ACs                               |
| -------------- | ------------------------- | -------------------------------- | ---------- | ----------- | --------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 4.0            | Readability Integration   | `specs/040-readability/`         | BP3        | Done        | N/A       | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/040-readability/spec.md#evidence)     | FR5.1, FR5.10, NFR1.2, PERF-2, US1       |
| 4.1            | Markdown Conversion       | `specs/041-markdown-conversion/` | BP3        | Done        | N/A       | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/041-markdown-conversion/spec.md#evidence) | FR5.2, FR5.3, FR5.4, AC4, AC16           |
| 4.2            | Fallback Extraction Chain | `specs/042-fallback-chain/`      | BP3        | Not Started | N/A       | N/A                                                                                                            | FR5.1, FR5.10, FR5.11, AC9, ERR-7, REL-8 |
| 4.3            | Image Handling            | `specs/043-image-handling/`      | BP3        | Not Started | N/A       | N/A                                                                                                            | FR5.6, AC10, PERF-6, NFR1.7, NET-3       |
| 4.4            | Table Preservation        | `specs/044-table-preservation/`  | BP3        | Not Started | N/A       | N/A                                                                                                            | FR5.5, AC11                              |

### BP4: Queue & Reliability (Weeks 9-10)

| Roadmap Anchor | Epic Name                | Spec Folder                | Breakpoint | Status      | Target ACs                                                                       |
| -------------- | ------------------------ | -------------------------- | ---------- | ----------- | -------------------------------------------------------------------------------- |
| 5.0            | Offline Queue System     | `specs/015-offline-queue/` | BP4        | Not Started | FR6.1, FR6.2, FR6.4, FR6.6, FR6.9, FR6.10, AC5, AC8, DATA-1, DATA-3, DATA-4, US3 |
| 5.1            | Retry Logic with Backoff | `specs/016-retry-logic/`   | BP4        | Not Started | FR6.3, FR6.5, NFR2.3, REL-4, REL-7                                               |
| 5.2            | Health Check & Recovery  | `specs/017-health-check/`  | BP4        | Not Started | FR6.7, NFR2.2, NFR2.4, NFR2.5, REL-2, REL-3, REL-5                               |
| 5.3            | Queue UI & Status        | `specs/018-queue-ui/`      | BP4        | Not Started | FR6.2, FR6.5, AC5, US3                                                           |

### BP5: Deduplication & Tagging (Weeks 11-12)

| Roadmap Anchor | Epic Name            | Spec Folder                | Breakpoint | Status      | Target ACs                                                 |
| -------------- | -------------------- | -------------------------- | ---------- | ----------- | ---------------------------------------------------------- |
| 6.0            | URL Deduplication    | `specs/019-deduplication/` | BP5        | Not Started | FR7.1, FR7.2, FR7.3, FR7.6, AC6, AC14, DATA-7, PERF-7, US7 |
| 6.1            | Smart Tagging Engine | `specs/020-smart-tagging/` | BP5        | Not Started | FR8.1, FR8.2, FR8.4, FR8.6, FR8.7, AC12, US5               |
| 6.2            | Append Mode          | `specs/021-append-mode/`   | BP5        | Not Started | FR2.4, FR4.9, FR7.4, FR7.5, AC17, US2, US7                 |

### BP6: UI & Integration (Weeks 13-14)

| Roadmap Anchor | Epic Name                | Spec Folder                | Breakpoint | Status      | Target ACs                                                                    |
| -------------- | ------------------------ | -------------------------- | ---------- | ----------- | ----------------------------------------------------------------------------- |
| 7.0            | Popup UI                 | `specs/022-popup-ui/`      | BP6        | Done        | T1                                                                            |
| 7.1            | Context Menu Integration | `specs/023-context-menu/`  | BP6        | Not Started | FR4.5, FR5.9, FR14.1, AC3                                                     |
| 7.2            | Options Page             | `specs/024-options-page/`  | BP6        | Not Started | FR13.1, FR13.2, FR13.3, FR13.4, FR13.6, FR13.7, FR13.12, FR13.13, AC7, PRIV-4 |
| 7.3            | Notifications System     | `specs/025-notifications/` | BP6        | Not Started | FR3.4, FR5.10, FR6.2, NFR4.3, NFR4.5, ERR-2, ERR-4                            |

### BP7: Testing & Polish (Weeks 15-16)

| Roadmap Anchor | Epic Name                  | Spec Folder                    | Breakpoint | Status      | Target ACs                                                      |
| -------------- | -------------------------- | ------------------------------ | ---------- | ----------- | --------------------------------------------------------------- |
| 8.0            | Unit Test Suite            | `specs/026-unit-tests/`        | BP7        | Not Started | NFR6.3, TEST-1, TEST-2, TEST-5, TEST-6                          |
| 8.1            | Integration Tests          | `specs/027-integration-tests/` | BP7        | Not Started | TEST-3, TEST-6                                                  |
| 8.2            | E2E Test Suite             | `specs/028-e2e-tests/`         | BP7        | Not Started | NFR6.4, TEST-4, TEST-6, AC1-AC20                                |
| 8.3            | Manual Testing & Bug Fixes | `specs/029-manual-testing/`    | BP7        | Not Started | NFR1.1-NFR1.8, NFR4.6, NFR4.7, NFR5.1, NFR5.2, TEST-7, TEST-8   |
| 8.4            | Documentation              | `specs/030-documentation/`     | BP7        | Not Started | NFR6.5, NFR6.6, DOC-1, DOC-2, DOC-3, DOC-4, DOC-5, DOC-6, DOC-7 |

### BP8: MVP Release (Week 17)

| Roadmap Anchor | Epic Name                | Spec Folder               | Breakpoint | Status      | Target ACs            |
| -------------- | ------------------------ | ------------------------- | ---------- | ----------- | --------------------- |
| 9.0            | Release Preparation      | `specs/031-release-prep/` | BP8        | Not Started | All NFRs, All PRD ACs |
| 9.1            | Packaging & Distribution | `specs/032-packaging/`    | BP8        | Not Started | Deliverables Phase 1  |

---

## Post-MVP Specifications (v1.1+)

### Phase 2: Enhanced Features (v1.1)

| Roadmap Anchor | Epic Name                        | Spec Folder                      | Breakpoint | Status      | Target ACs                            |
| -------------- | -------------------------------- | -------------------------------- | ---------- | ----------- | ------------------------------------- |
| 10.0           | Reading List / "Read Later" Mode | `specs/033-reading-list/`        | v1.1       | Not Started | FR9.1-FR9.7, AC13, US4                |
| 10.1           | Keyboard Shortcuts               | `specs/034-keyboard-shortcuts/`  | v1.1       | Not Started | FR14.6, FR9.2, FR13.11                |
| 10.2           | Checkpoint-Based Recovery        | `specs/035-checkpoint-recovery/` | v1.1       | Not Started | FR6.8, AC15, DATA-2                   |
| 10.3           | Advanced Smart Tagging           | `specs/036-advanced-tagging/`    | v1.1       | Not Started | FR8.3, FR8.5, FR13.9                  |
| 10.4           | Content Enrichment               | `specs/037-content-enrichment/`  | v1.1       | Not Started | FR3.6, FR3.7, FR10.6, FR10.7, FR10.8  |
| 10.5           | Template System                  | `specs/038-template-system/`     | v1.1       | Not Started | FR12.1-FR12.6                         |
| 10.6           | Debug Log Viewer                 | `specs/039-debug-log/`           | v1.1       | Not Started | FR6.12, FR13.14, AC19                 |
| 10.7           | Sync Status Dashboard            | `specs/040-sync-dashboard/`      | v1.1       | Not Started | FR6.11                                |
| 10.8           | Multiple Highlights Per Page     | `specs/041-multi-highlights/`    | v1.1       | Not Started | FR4.6, FR4.7, FR4.8, FR4.9, AC17, US2 |
| 10.9           | Screenshot Capture               | `specs/042-screenshot-capture/`  | v1.1       | Not Started | FR3.5, FR13.8                         |
| 10.10          | Privacy Mode                     | `specs/043-privacy-mode/`        | v1.1       | Not Started | FR13.12, AC20, PRIV-3                 |

### Phase 3: Advanced Features (v1.2+)

| Roadmap Anchor | Epic Name               | Spec Folder                   | Breakpoint | Status      | Target ACs                      |
| -------------- | ----------------------- | ----------------------------- | ---------- | ----------- | ------------------------------- |
| 11.0           | Visual Selection Tool   | `specs/044-visual-selection/` | v1.2       | Not Started | FR11.2, FR11.3, FR11.4, FR13.17 |
| 11.1           | Selective Capture Modes | `specs/045-capture-modes/`    | v1.2       | Not Started | FR11.1                          |
| 11.2           | Omnibox Integration     | `specs/046-omnibox/`          | v1.2       | Not Started | FR14.2                          |
| 11.3           | Side Panel UI           | `specs/047-side-panel/`       | v1.2       | Not Started | FR14.3                          |
| 11.4           | Search & Discovery      | `specs/048-search-discovery/` | v1.2       | Not Started | FR15.1, FR15.3, FR15.4, FR15.5  |
| 11.5           | Analytics Dashboard     | `specs/049-analytics/`        | v1.2       | Not Started | FR16.1, FR16.2, FR16.3, FR16.4  |
| 11.6           | Collaboration Features  | `specs/050-collaboration/`    | v1.2       | Not Started | FR17.1, FR17.2, FR17.3          |

---

## Specification Workflow

### Starting a New Specification

To begin work on any epic, use the Spec-Kit command:

```bash
/speckit specify "reference roadmap.md file for [ROADMAP_ANCHOR]"
```

**Examples:**

```bash
/speckit specify "reference roadmap.md file for 1.0"
/speckit specify "reference roadmap.md file for 4.2"
/speckit specify "reference roadmap.md file for 6.1"
```

### Specification Folder Structure

Each spec folder follows this structure:

```
specs/NNN-slug/
├── SPEC.md # Detailed specification
├── PLAN.md # Implementation plan
├── TASKS.md # Task breakdown with DoD
├── NOTES.md # Design decisions, clarifications
└── TESTS.md # Test plan and scenarios
```

### Gate Progression

1. **Gate 1 (Specify):** Write SPEC.md with detailed requirements, acceptance criteria, edge cases

2. **Gate 2 (Plan):** Write PLAN.md with implementation approach, task breakdown, risks

3. **Gate 3 (Tasks):** Write TASKS.md with granular tasks, DoD per task, dependencies

4. **Gate 4 (Implement):** Write code, tests, documentation per constitution DoD
   
   ### Updating This Index
   
   When a specification changes status:

5. Update the **Status** column in the appropriate table

6. Update the **Last Updated** timestamp at the top

7. Commit with message: `docs: update SPECS.md - [Epic Name] status to [New Status]`

---

## Progress Tracking

### MVP Progress (v1.0)

- **Total Epics:** 32

- **Not Started:** 20

- **In Progress:** 1

- **Approved:** 0

- **Planning:** 0

- **Tasks Defined:** 0

- **Implementing:** 0

- **Testing:** 0

- **Done:** 11
  **Completion:** 34% (11/32 complete)
  
  ### Breakpoint Progress

- **BP0 (Foundation):** 3/3 complete

- **BP1 (Authentication):** 3/3 complete

- **BP2 (Basic Capture):** 2/3 complete

- **BP3 (Article Extraction):** 1/5 complete

- **BP4 (Queue & Reliability):** 0/4 complete

- **BP5 (Deduplication & Tagging):** 0/3 complete

- **BP6 (UI & Integration):** 1/4 complete

- **BP7 (Testing & Polish):** 0/5 complete

- **BP8 (MVP Release):** 0/2 complete

---

## Dependencies Map

### Critical Path

```
1.0 → 1.1 → 2.0 → 2.1 → 2.2 → 3.0 → 4.0 → 4.1 → 4.2 → 5.0 → 5.1 → 5.2 → 7.0 → 8.0 → 8.1 → 8.2 → 8.3 → 8.4 → 9.0 → 9.1
```

### Parallel Tracks

**Track A (Foundation):**

- 1.0 → 1.1 → 1.2
  **Track B (Authentication):**
- 2.0 → 2.1 → 2.2
  **Track C (Capture):**
- 3.0 → 3.1 → 3.2
  **Track D (Article Processing):**
- 4.0 → 4.1 → 4.2 → 4.3 → 4.4
  **Track E (Queue):**
- 5.0 → 5.1 → 5.2 → 5.3
  **Track F (Deduplication):**
- 6.0 → 6.1 → 6.2
  **Track G (UI):**
- 7.0 → 7.1 → 7.2 → 7.3
  **Track H (Testing):**
- 8.0 → 8.1 → 8.2 → 8.3 → 8.4
  **Track I (Release):**
- 9.0 → 9.1

---

## Clarifications Needed

The following items require clarification before implementation (from constitution.md):

1. **[NEEDS CLARIFICATION: Encryption requirement]** - Should queue items be encrypted at rest in `chrome.storage.local`? (STORE-2)
   
   - **Affects:** Epic 1.2 (Storage Manager), Epic 5.0 (Offline Queue System)

2. **[NEEDS CLARIFICATION: Health check timeout]** - What is the appropriate timeout for health check ping to localhost? (Suggested: 2s)
   
   - **Affects:** Epic 5.2 (Health Check & Recovery)

3. **[NEEDS CLARIFICATION: Token expiration]** - Does Anytype API implement token expiration and refresh flow? (FR1.8)
   
   - **Affects:** Epic 2.1 (API Key Management), Epic 2.2 (Re-authentication Flow)

4. **[NEEDS CLARIFICATION: API versioning]** - How does Anytype API communicate version changes? (NFR5.7)
   
   - **Affects:** Epic 1.1 (API Client Foundation)

5. **[NEEDS CLARIFICATION: Object schemas]** - What are the exact Anytype object schemas for Bookmark/Highlight/Article Types?
   
   - **Affects:** Epic 3.0 (Bookmark Capture), Epic 3.1 (Highlight Capture), Epic 4.0 (Readability Integration)

---

## Notes

- All specifications MUST reference PRD requirements (FR, NFR, AC, US)
- All specifications MUST follow constitution gates (Specify → Plan → Tasks → Implement)
- No code may be written before Gate 4 (Implement)
- Specifications MUST be approved before proceeding to planning
- Changes to approved specifications require re-approval and impact assessment
- This index is the single source of truth for specification status

---

## API Reference

For API-related questions, the Coding Agent should refer to the Anytype API OpenAPI specification:

- **File:** `/docs/reference/openapi-2025-11-08.yaml`
- **Purpose:** API Reference for coding
- **Usage Notes:** Refer only for API-related tasks

---

## Maintenance / Unplanned Work

This section tracks bug fixes, chores, and unplanned changes that are not part of the main roadmap.

| Roadmap Anchor | Title                       | Spec Folder                   | Type    | Priority | Status      | Next Task | Evidence                                                                                                 | Target ACs                        |
| -------------- | --------------------------- | ----------------------------- | ------- | -------- | ----------- | --------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| N/A            | Disable CI Workflow         | `specs/012-disable-ci/`       | Bug     | P2       | Done        | N/A       | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/012-disable-ci/spec.md#evidence) | AC-U1, AC-U2                      |
| N/A            | Input Code Auth (Unplanned) | `specs/031-input-code-auth/`  | Feature | P0       | Done        | N/A       | [Evidence](specs/031-input-code-auth/spec.md#evidence)                                                   | AC-U1, AC-U2, AC-U3, AC-U4        |
| N/A            | Fix Spaces Loading Error    | `specs/033-fix-spaces-error/` | Bug     | P0       | Done        | N/A       | [Evidence](specs/033-fix-spaces-error/spec.md#evidence)                                                  | FR1, FR2, FR3                     |
| N/A            | Fix Bookmark Creation 404   | `specs/034-fix-bookmark-404/` | Bug     | P0       | Done        | None      | [Evidence](specs/034-fix-bookmark-404/spec.md#evidence)                                                  | FR1, FR2                          |
| N/A            | Tag Management Integration  | `specs/035-tag-management/`   | Feature | P1       | Done        | None      | [Evidence](specs/035-tag-management/spec.md#evidence)                                                    | AC-U1, AC-U2, AC-U3, AC-U4, AC-U5 |
| N/A            | Fix Highlight Save Function | `specs/036-fix-highlight-save/` | Bug     | P0       | Done        | N/A       | [Evidence](specs/036-fix-highlight-save/spec.md#evidence)                                                | AC-U1, AC-U2, AC-U3, AC-U4        |

---

## Maintenance

This document is maintained by the project team and updated as specifications progress through gates. All updates must be committed with descriptive messages referencing the affected epic(s).
**Last Reviewed:** 2026-01-01 
**Next Review:** After BP0 completion 
**Owner:** [TBD]

---

**End of SPECS.md**

# Epic 7.1: Context Menu Integration - Implementation Plan

## Architecture Overview

### Key Components

**1. Service Worker (service-worker.ts)**
- Register context menu items on installation/update
- Handle context menu click events
- Route clicks to appropriate capture handlers
- Already has highlight capture handler (from Epic 3.1)

**2. Context Menu Handler (NEW)**
- Create `src/background/context-menu-handler.ts`
- Centralize context menu registration and event handling
- Map menu item clicks to capture flows

**3. Existing Capture Services (Reuse)**
- BookmarkCaptureService (Epic 3.0)
- Highlight capture logic (Epic 3.1)  
- Article extraction (Epic 4.0)

### Message Flow

```
User Right-Click → Context Menu Click → Service Worker Event Handler
                                              ↓
                                    Route to Capture Service
                                              ↓
                                    (Bookmark/Highlight/Article)
                                              ↓
                                    Open Popup or Auto-Save
                                              ↓
                                    Show Notification
```

### Alternatives Considered

**Option 1: Inline handlers in service-worker.ts**
- ❌ Clutters main service worker file
- ❌ Harder to test and maintain

**Option 2: Separate context-menu-handler module** (CHOSEN)
- ✅ Clean separation of concerns
- ✅ Easier to test
- ✅ Follows existing modular architecture

---

## Proposed Changes

### [NEW] context-menu-handler.ts

**Purpose:** Centralize context menu registration and event handling

**Key Functions:**
- `registerContextMenus()` - Register all menu items
- `handleContextMenuClick(info, tab)` - Route clicks to appropriate handlers
- `handleSelectionCapture(info, tab)` - Trigger highlight capture
- `handleArticleCapture(info, tab)` - Trigger article extraction
- `handleBookmarkCapture(info, tab)` - Trigger bookmark capture

**Integration Points:**
- Called from service-worker.ts on install/update
- Uses existing capture services
- Sends messages to popup or directly saves

### [MODIFY] service-worker.ts

**Changes:**
- Import and call `registerContextMenus()` on install/update
- Add `chrome.contextMenus.onClicked` listener
- Route clicks to context-menu-handler

**Lines to Modify:**
- Installation handler (~line 5-24): Add context menu registration
- Add new event listener for context menu clicks

### [MODIFY] manifest.json

**Changes:**
- Add `"contextMenus"` to permissions array
- No additional host permissions needed

---

## Testing Plan

### Unit Tests
- Test context menu registration logic
- Test menu item visibility conditions
- Test click event routing

### Integration Tests
- Test highlight capture via context menu
- Test article capture via context menu
- Test bookmark capture via context menu
- Test authentication error handling
- Test offline queueing

### Manual Tests
- Verify menu items appear on right-click
- Verify "Send selection" only shows when text selected
- Test all three capture flows end-to-end
- Test on multiple page types (articles, SPAs, static pages)
- Test with Anytype offline
- Test without authentication

---

## AC Verification Mapping

| AC | Verification Method | Evidence |
|----|---------------------|----------|
| AC-CM1 | Manual test: right-click on page, verify menu items | Screenshot of context menu |
| AC-CM2 | Manual test: select text, verify menu item appears; deselect, verify hidden | Screenshot comparison |
| AC-CM3 | Manual test: capture selection, verify object in Anytype | Anytype object screenshot |
| AC-CM4 | Manual test: clip article, verify Markdown preserved | Anytype object screenshot |
| AC-CM5 | Manual test: bookmark page, verify object created | Anytype object screenshot |
| AC-CM6 | Manual test: click menu without auth, verify error | Error notification screenshot |
| AC-CM7 | Manual test: capture with Anytype offline, verify queued | Queue status screenshot |

---

## Risks and Mitigations

**Risk:** Content script not injected when context menu clicked
- **Mitigation:** Inject on demand if needed, or rely on existing injection policy

**Risk:** Context menu API differences across browsers
- **Mitigation:** Test on Chrome, Brave, Edge; document any limitations

**Risk:** Conflicts with existing context menu from Epic 3.1**
- **Mitigation:** Consolidate with existing "Send selection to Anytype" menu item

---

## Rollout Notes

- No migration needed
- No breaking changes
- Feature is additive
- Can be rolled out incrementally

---

## Observability

**What to Log:**
- Context menu registration success/failure
- Menu item click events (item ID, tab ID)
- Capture flow initiation from context menu
- Errors during context menu handling

**What NOT to Log:**
- Selected text content
- Page URLs (unless in debug mode)
- User's browsing patterns

# Implementation Plan: Configurable Object Types

## Architecture Overview

This feature adds Object Type selection capability to the extension, allowing users to configure default Object Types per capture mode and select Object Types on-the-fly in the popup.

### Key Components

1. **Settings Schema Extension**
   - Add `defaultObjectTypes` field to settings schema
   - Add `lastUsedObjectTypes` field to track per-mode selections
   - Add `cachedObjectTypes` field for offline support

2. **API Client Extension**
   - Add `fetchObjectTypes()` method to fetch available Object Types from Anytype API
   - Add `validateObjectType()` method to check if Object Type ID is valid
   - Handle API errors and caching

3. **Popup UI Extension**
   - Add Object Type selector dropdown below Space selector
   - Fetch and populate Object Types on popup open
   - Pre-select default Object Type for current capture mode
   - Update last-used Object Type on save

4. **Options Page Extension**
   - Add Object Type configuration section
   - Three dropdowns for Article/Highlight/Bookmark defaults
   - Fetch and display all available Object Types
   - Save configuration to storage

### Module Boundaries

```
src/
├── types/
│   └── settings.ts (extend SettingsV1 interface)
├── lib/
│   ├── api/
│   │   └── client.ts (add fetchObjectTypes, validateObjectType)
│   └── storage/
│       └── settings-manager-v2.ts (add Object Type methods)
├── popup/
│   ├── popup.html (add Object Type selector)
│   ├── popup.css (add Object Type styles)
│   └── popup.ts (add Object Type logic)
└── options/
    ├── options.html (add Object Type configuration)
    ├── options.css (add Object Type styles)
    └── options.ts (add Object Type logic)
```

### Call Flow

#### Popup Open Flow
```
1. User clicks extension icon
2. Popup opens and calls init()
3. init() calls loadSettings()
4. init() calls fetchObjectTypes() (async, non-blocking)
5. init() determines capture mode (article/highlight/bookmark)
6. init() pre-selects default Object Type for mode
7. fetchObjectTypes() completes, populates dropdown
8. User optionally changes Object Type
9. User clicks Save
10. Save handler updates lastUsedObjectTypes
11. Save handler creates capture with selected Object Type
```

#### Options Page Flow
```
1. User opens Options page
2. Page calls init()
3. init() calls loadSettings()
4. init() calls fetchObjectTypes()
5. fetchObjectTypes() populates three dropdowns
6. User configures default Object Types
7. User clicks Save
8. Save handler validates selections
9. Save handler updates settings.defaultObjectTypes
10. Save handler saves to chrome.storage.local
```

### Alternatives Considered

**Alternative 1: Single Default Object Type**
- Rejected: Users want different Object Types for different capture modes

**Alternative 2: Object Type Auto-Detection**
- Rejected: Too complex, requires content analysis, out of scope for v1.1

**Alternative 3: Object Type in Context Menu**
- Deferred: Good idea but adds complexity, consider for v1.2

**Chosen Approach:**
- Per-mode defaults with on-the-fly selection
- Balances flexibility and simplicity
- Minimal UI changes
- Backward compatible

---

## Data Contracts

### Settings Schema Extension

```typescript
interface SettingsV2 extends SettingsV1 {
  version: 2;
  objectTypes: {
    // Default Object Type ID per capture mode
    defaults: {
      article: string;      // Default: "Article" Object Type ID
      highlight: string;    // Default: "Highlight" or "Note" Object Type ID
      bookmark: string;     // Default: "Bookmark" Object Type ID
    };
    // Last-used Object Type ID per capture mode (for "Use last-used" option)
    lastUsed: {
      article: string | null;
      highlight: string | null;
      bookmark: string | null;
    };
    // Cached Object Types list for offline use
    cached: ObjectTypeInfo[];
    // Last fetch timestamp
    lastFetchedAt: number;
  };
}

interface ObjectTypeInfo {
  id: string;              // Unique type ID across spaces
  key: string;             // Type key (e.g., "page", "bookmark", "research_paper")
  name: string;            // Display name (e.g., "Page", "Bookmark", "Research Paper")
  plural_name: string;     // Plural display name (e.g., "Pages", "Bookmarks")
  icon: Icon | null;       // Icon (emoji, file, or named icon)
  layout: TypeLayout;      // Layout type (basic, profile, action, note, bookmark, set, collection, participant)
  archived: boolean;       // Whether the type is archived/deleted
  object: string;          // Data model (always "type")
  // properties field omitted for extension use - not needed for type selection
}

type TypeLayout = 'basic' | 'profile' | 'action' | 'note' | 'bookmark' | 'set' | 'collection' | 'participant';

type Icon = EmojiIcon | FileIcon | NamedIcon | null;

interface EmojiIcon {
  format: 'emoji';
  emoji: string;  // Unicode emoji
}

interface FileIcon {
  format: 'file';
  file: string;   // File ID
}

interface NamedIcon {
  format: 'icon';
  icon: string;   // Icon name from predefined set
}
```

### API Contracts

**Fetch Object Types Request:**
```typescript
GET /v1/spaces/{space_id}/types?offset=0&limit=100

Headers:
  Anytype-Version: 2025-11-08
  Authorization: Bearer {api_key}

Response: 200 OK
{
  "data": [
    {
      "id": "bafyreigyb6l5szohs32ts26ku2j42yd65e6hqy2u3gtzgdwqv6hzftsetu",
      "key": "bookmark",
      "name": "Bookmark",
      "plural_name": "Bookmarks",
      "icon": { "format": "emoji", "emoji": "🔖" },
      "layout": "bookmark",
      "archived": false,
      "object": "type",
      "properties": [...]
    },
    {
      "id": "bafyreicustom123...",
      "key": "research_paper",
      "name": "Research Paper",
      "plural_name": "Research Papers",
      "icon": { "format": "emoji", "emoji": "📄" },
      "layout": "basic",
      "archived": false,
      "object": "type",
      "properties": [...]  
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 100,
    "total": 15,
    "has_more": false
  }
}
```

**Validate Object Type (Check if archived):**
```typescript
// No separate validation endpoint needed
// Simply check the 'archived' field from the fetched types
// Filter out types where archived === true
```

**Create Object with Type:**
```typescript
POST /v1/spaces/{space_id}/objects

Headers:
  Anytype-Version: 2025-11-08
  Authorization: Bearer {api_key}
  Content-Type: application/json

Body:
{
  "type_key": "bookmark",  // Use the 'key' field from Type object
  "name": "My Bookmark",
  "body": "Markdown content...",
  "properties": [...]
}
```

---

## Storage and Persistence

### Storage Keys

- `settings` - Main settings object (SettingsV2)
  - `settings.objectTypes.defaults` - Default Object Types per mode
  - `settings.objectTypes.lastUsed` - Last-used Object Types per mode
  - `settings.objectTypes.cached` - Cached Object Types list
  - `settings.objectTypes.lastFetchedAt` - Cache timestamp

### Migration Strategy

**v1 → v2 Migration:**
```typescript
function migrateV1toV2(v1Settings: SettingsV1): SettingsV2 {
  return {
    ...v1Settings,
    version: 2,
    objectTypes: {
      defaults: {
        article: BUILT_IN_ARTICLE_TYPE_ID,
        highlight: BUILT_IN_HIGHLIGHT_TYPE_ID,
        bookmark: BUILT_IN_BOOKMARK_TYPE_ID,
      },
      lastUsed: {
        article: null,
        highlight: null,
        bookmark: null,
      },
      cached: [],
      lastFetchedAt: 0,
    },
  };
}
```

### Cache Strategy

- Cache Object Types list for 24 hours
- Refresh on Options page open
- Refresh on popup open if cache is stale
- Use cached Object Types if API fails
- Fallback to built-in defaults if cache is empty

---

## External Integrations

### Anytype API Integration

**Required API Methods:**
1. `GET /v1/object-types` - Fetch all Object Types (built-in and custom)
2. `GET /v1/object-types/{id}` - Validate Object Type exists
3. `POST /v1/objects` - Create object with Object Type ID (existing)

**Error Handling:**
- API unavailable: Use cached Object Types
- Object Type deleted: Fallback to built-in default
- Invalid Object Type ID: Show error, use fallback
- Network timeout: Use cached Object Types

---

## UX and Operational States

### Popup States

1. **Loading Object Types**
   - Show loading spinner in Object Type dropdown
   - Pre-select default Object Type (from cache or settings)
   - Enable dropdown when Object Types loaded

2. **Object Types Loaded**
   - Populate dropdown with Object Types
   - Show built-in types first, then custom types
   - Show icon/emoji if available

3. **API Error**
   - Show cached Object Types with warning icon
   - Display "Using cached Object Types" message
   - Provide "Refresh" button

4. **No Cached Object Types**
   - Show built-in defaults only
   - Display "Connect to Anytype to see custom Object Types" message

### Options Page States

1. **Loading Object Types**
   - Show loading spinner in dropdowns
   - Disable Save button

2. **Object Types Loaded**
   - Populate all three dropdowns
   - Enable Save button
   - Show current selections

3. **API Error**
   - Show cached Object Types with warning
   - Allow saving with cached types
   - Provide "Refresh Object Types" button

4. **Saving Settings**
   - Show loading state on Save button
   - Disable form inputs
   - Show success message on completion

---

## Testing Plan

### Unit Tests

**Settings Manager Tests:**
- `loadObjectTypeSettings()` - loads Object Type preferences
- `saveObjectTypeSettings()` - saves Object Type preferences
- `getDefaultObjectType(mode)` - returns default for mode
- `updateLastUsedObjectType(mode, typeId)` - updates last-used
- `migrateV1toV2()` - migrates settings schema

**API Client Tests:**
- `fetchObjectTypes()` - fetches Object Types from API
- `validateObjectType(id)` - validates Object Type exists
- `cacheObjectTypes(types)` - caches Object Types list
- `getCachedObjectTypes()` - retrieves cached Object Types

**Popup Logic Tests:**
- `getDefaultObjectTypeForMode(mode)` - returns correct default
- `populateObjectTypeDropdown(types)` - populates dropdown
- `handleObjectTypeChange(typeId)` - updates selection
- `saveWithObjectType(typeId)` - creates capture with type

### Integration Tests

**Popup Integration:**
- Open popup → verify Object Type dropdown appears
- Select Object Type → save capture → verify type applied
- API error → verify cached Object Types shown

**Options Page Integration:**
- Open Options → verify Object Types fetched
- Configure defaults → save → verify settings persisted
- Restart browser → verify settings retained

**Capture Flow Integration:**
- Capture article with custom Object Type → verify created
- Capture highlight with default Object Type → verify created
- Capture bookmark with last-used Object Type → verify created

### Manual Tests

**AC-1: Object Type Selector in Popup**
- Open popup
- Verify Object Type dropdown appears below Space selector
- Verify default Object Type pre-selected
- Change Object Type
- Save capture
- Verify Object Type applied in Anytype

**AC-2: Default Object Type Configuration**
- Open Options page
- Configure default Object Types for each mode
- Save settings
- Create captures of each type
- Verify correct Object Type used

**AC-3: Last-Used Object Type Tracking**
- Capture Article with custom Object Type
- Capture another Article
- Verify last-used Object Type pre-selected

**AC-4: Custom Object Type Support**
- Create custom Object Type in Anytype
- Refresh extension (reload Options page)
- Verify custom Object Type appears in dropdowns
- Select custom Object Type
- Save capture
- Verify custom Object Type applied

**AC-5: Backward Compatibility**
- Fresh install → verify built-in defaults used
- Existing install → verify no breaking changes
- Upgrade from v1 → verify migration works

**AC-6: Object Type Validation**
- Configure Object Type in settings
- Delete Object Type in Anytype
- Attempt capture
- Verify fallback to built-in default
- Verify warning notification shown

**AC-7: Settings Persistence**
- Configure Object Types
- Restart browser
- Verify settings retained

**AC-8: API Error Handling**
- Close Anytype
- Open popup
- Verify cached Object Types shown
- Verify warning message displayed

---

## AC Verification Mapping

| AC | Verification Method | Expected Outcome |
|----|---------------------|------------------|
| AC-1 | Manual test | Object Type dropdown appears, default pre-selected, selection works |
| AC-2 | Manual test | Options page allows configuration, settings persist, captures use correct type |
| AC-3 | Manual test | Last-used Object Type remembered per mode |
| AC-4 | Manual test | Custom Object Types appear in dropdowns and work correctly |
| AC-5 | Manual test | Fresh install uses defaults, upgrade migrates settings |
| AC-6 | Manual test | Deleted Object Type triggers fallback and warning |
| AC-7 | Manual test | Settings persist across browser restarts |
| AC-8 | Manual test | API errors handled gracefully with cached data |

---

## Risks and Mitigations

### Risk 1: API Endpoint Unknown
**Impact:** Critical - cannot implement without API  
**Mitigation:**
- Add `[NEEDS CLARIFICATION]` items to spec
- Research Anytype API documentation
- Test with mock API during development
- Implement API client interface for easy swapping

### Risk 2: Settings Migration Failure
**Impact:** High - users lose settings  
**Mitigation:**
- Implement robust migration logic
- Test migration with various v1 settings
- Fallback to defaults if migration fails
- Log migration errors for debugging

### Risk 3: Cache Staleness
**Impact:** Medium - users see outdated Object Types  
**Mitigation:**
- Implement 24-hour cache expiry
- Refresh on Options page open
- Provide manual "Refresh" button
- Show cache age in UI

### Risk 4: UX Complexity
**Impact:** Low - popup may feel cluttered  
**Mitigation:**
- Use clear labels and help text
- Consider collapsible "Advanced" section
- Pre-select sensible defaults
- Provide inline help

---

## Rollout and Migration Notes

### Rollout Strategy
1. Release as v1.1 feature (post-MVP)
2. Enable by default for all users
3. Migrate existing settings to v2 schema
4. Show one-time notification about new feature
5. Provide link to documentation

### Migration Checklist
- [ ] Implement v1 → v2 settings migration
- [ ] Test migration with various v1 settings
- [ ] Add migration logging for debugging
- [ ] Fallback to defaults if migration fails
- [ ] Update settings schema version to 2

### Backward Compatibility
- Existing captures unaffected
- Built-in defaults used if no configuration
- No breaking changes to capture flows
- Settings migration automatic on upgrade

---

## Observability and Debugging

### What Can Be Logged
- Object Type fetch success/failure
- Object Type validation results
- Settings migration events
- Cache hit/miss events
- Fallback to default Object Type events
- API error messages (sanitized)

### What Must Never Be Logged
- API keys or tokens
- Full capture content
- User's personal data
- Sensitive Object Type metadata

### Debug Information
- Object Types cache age
- Last fetch timestamp
- Number of cached Object Types
- Default Object Types per mode
- Last-used Object Types per mode
- Settings schema version

### Error Messages
- "Failed to fetch Object Types: [error]"
- "Using cached Object Types (last updated: [time])"
- "Object Type '[name]' not found, using default"
- "Failed to save settings: [error]"
- "Settings migration failed, using defaults"

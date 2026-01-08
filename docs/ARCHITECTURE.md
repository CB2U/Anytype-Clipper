# Anytype Clipper - Architecture Overview

> **Note:** This is a skeleton document. Full architecture documentation will be completed in a future update.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Extension                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Popup UI   │    │   Content    │    │   Service    │  │
│  │              │    │   Script     │    │   Worker     │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │           │
│         └───────────────────┴───────────────────┘           │
│                             │                                │
│                    ┌────────┴────────┐                      │
│                    │                 │                       │
│              ┌─────▼─────┐    ┌─────▼─────┐                │
│              │   Queue   │    │  Storage  │                 │
│              │  Manager  │    │  Manager  │                 │
│              └─────┬─────┘    └─────┬─────┘                │
│                    │                 │                       │
│                    └────────┬────────┘                      │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Anytype Desktop  │
                    │  (localhost:31009) │
                    └────────────────────┘
```

## Module Structure

### Background (Service Worker)

- `service-worker.ts`: Main service worker, message routing
- `queue-manager.ts`: Offline queue management
- `storage-manager.ts`: Storage abstraction layer

### Content Scripts

- `content-script.ts`: Page interaction, text selection
- `highlight-capture.ts`: Highlight capture logic
- `metadata-script.ts`: Metadata extraction

### Popup UI

- `popup.ts`: Main popup logic
- `components/`: Reusable UI components
  - `tag-autocomplete.ts`: Tag input with autocomplete
  - `notification.ts`: Notification display
  - `QueueStatusSection.ts`: Queue status display

### Library

- `api/`: Anytype API client
- `extractors/`: Content extraction (Readability, metadata)
- `converters/`: Markdown conversion (Turndown)
- `services/`: Tag service, notification service
- `utils/`: Utilities (URL normalizer, constants)

## Data Flow

### Bookmark Capture Flow

1. User clicks extension icon
2. Popup fetches current tab info
3. User adds tags and notes
4. Popup sends capture request to service worker
5. Service worker checks Anytype availability
6. If available: Create object via API
7. If unavailable: Queue for later
8. Show notification to user

### Queue Processing Flow

1. Service worker detects Anytype is available
2. Dequeue next pending capture
3. Attempt to create object via API
4. If success: Mark as sent, show notification
5. If failure: Increment retry count, schedule retry
6. If max retries exceeded: Mark as failed

## Design Patterns

### Singleton Pattern

Used for managers to ensure single instance:
- `QueueManager`
- `StorageManager`
- `TagService`

### Factory Pattern

Used for content extractors:
- `ArticleExtractor` with fallback chain

### Observer Pattern

Used for notifications:
- `NotificationService` broadcasts events

## Technology Stack

- **TypeScript**: Strict mode for type safety
- **Vite**: Build tool with hot reload
- **Jest**: Unit and integration testing
- **Mozilla Readability**: Article extraction
- **Turndown**: HTML to Markdown conversion

## Storage Schema

```typescript
interface StorageSchema {
  // Authentication
  apiKey: string;
  apiPort: number;
  
  // Queue
  queue: QueueItem[];
  
  // Settings
  settings: {
    defaultSpaces: Record<string, string>;
    retryBehavior: RetryConfig;
    deduplicationEnabled: boolean;
    imageHandling: 'always' | 'smart' | 'never';
    privacyMode: boolean;
  };
  
  // Cache
  tagCache: {
    tags: Tag[];
    lastUpdated: number;
  };
}
```

## Extension Manifest

Key permissions:
- `activeTab`: Access current tab
- `storage`: Local storage
- `contextMenus`: Right-click menu
- `host: localhost`: Anytype API access

For more details, see `src/manifest.json`.

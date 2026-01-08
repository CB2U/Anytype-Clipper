# Anytype Clipper - API Documentation

> **Note:** This is a skeleton document. Full API documentation will be completed in a future update.

## Table of Contents

1. [AnytypeApiClient](#anytypeapiclient)
2. [QueueManager](#queuemanager)
3. [StorageManager](#storagemanager)
4. [TagService](#tagservice)
5. [NotificationService](#notificationservice)

## AnytypeApiClient

The main API client for communicating with Anytype Desktop.

### Methods

- `ping()`: Health check ping
- `authenticate(challengeCode)`: Exchange challenge code for API key
- `createObject(data)`: Create new Anytype object
- `updateObject(id, data)`: Update existing object
- `searchObjects(query)`: Search for objects
- `listSpaces()`: Get available Spaces
- `listTags()`: Get available tags
- `createTag(name)`: Create new tag

## QueueManager

Manages the offline capture queue.

### Methods

- `enqueue(request)`: Add capture to queue
- `dequeue()`: Remove next item from queue
- `getStatus()`: Get queue status
- `retry(id)`: Retry failed capture
- `delete(id)`: Delete queue item
- `clear()`: Clear entire queue

## StorageManager

Type-safe wrapper for chrome.storage.local.

### Methods

- `get(key)`: Get value from storage
- `set(key, value)`: Set value in storage
- `delete(key)`: Delete value from storage
- `clear()`: Clear all storage
- `getQuota()`: Get storage quota information

## TagService

Manages tag operations and caching.

### Methods

- `listTags()`: Get all tags (with caching)
- `createTag(name)`: Create new tag
- `resolveTagProperty(objectType)`: Get tag property ID for object type

## NotificationService

Displays notifications to the user.

### Methods

- `show(message, type, options)`: Show notification
- `showSuccess(message)`: Show success notification
- `showError(message)`: Show error notification
- `showWarning(message)`: Show warning notification
- `showInfo(message)`: Show info notification

## Error Types

- `AuthError`: Authentication failures
- `NetworkError`: Network connectivity issues
- `ValidationError`: Data validation failures
- `StorageError`: Storage quota or access issues

## Code Examples

### Creating a Bookmark

```typescript
const apiClient = new AnytypeApiClient();
const bookmark = {
  type: 'bookmark',
  url: 'https://example.com',
  title: 'Example Site',
  tags: ['example', 'demo']
};

try {
  const result = await apiClient.createObject(bookmark);
  console.log('Bookmark created:', result.id);
} catch (error) {
  console.error('Failed to create bookmark:', error);
}
```

### Queuing a Capture

```typescript
const queueManager = QueueManager.getInstance();
await queueManager.enqueue({
  type: 'bookmark',
  url: 'https://example.com',
  title: 'Example'
});
```

For more examples, see the source code in `src/` directory.

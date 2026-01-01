// Application constants
export const APP_NAME = 'AnytypeClipper';
export const DEFAULT_ANYTYPE_PORT = 31009;
export const MAX_QUEUE_SIZE = 1000;
export const MAX_CAPTURE_SIZE_MB = 5;

// Tag Property IDs (Relations) for different object types
// TODO: Consider dynamic discovery for custom types
export const TAG_PROPERTY_IDS: Record<string, string> = {
    'Bookmark': 'tag',
    'Highlight': 'tag',
    'Note': 'tag',
    'Article': 'tag',
};

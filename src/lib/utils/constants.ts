// Application constants
export const APP_NAME = 'AnytypeClipper';
export const DEFAULT_ANYTYPE_PORT = 31009;
export const MAX_QUEUE_SIZE = 1000;
export const MAX_CAPTURE_SIZE_MB = 5;

export const TAG_PROPERTY_IDS: Record<string, string> = {
    'Bookmark': 'tag',
    'Highlight': 'tag',
    'Note': 'tag',
    'Article': 'tag',
};

// Metadata property lookup configuration
export const METADATA_PROPERTY_LOOKUP: Record<string, { searchNames: string[], fallback?: string }> = {
    'author': {
        searchNames: ['Author', 'Creator'],
        fallback: 'author'
    },
    'publishedDate': {
        searchNames: ['Date published', 'Published', 'Date', 'Published Date'],
        fallback: 'published_date'
    },
    'siteName': {
        searchNames: ['Site Name', 'Source Name', 'Site', 'Publisher', 'Website'],
    },
    'favicon': {
        searchNames: ['Favicon', 'Icon'],
    },
    'language': {
        searchNames: ['Language'],
    },
    'canonicalUrl': {
        searchNames: ['Source', 'Source URL', 'Original URL'],
        fallback: 'source'
    },
    'extractionLevel': {
        searchNames: ['Extraction Level', 'Level'],
    },
    'extractionQuality': {
        searchNames: ['Extraction Quality', 'Quality'],
    },
    'extractionTime': {
        searchNames: ['Extraction Time', 'Time'],
    },
    'note': {
        searchNames: ['Note', 'Comment', 'Remarks'],
    },
};

// Kept for backward compatibility during transition if needed, but we should use LOOKUP
export const METADATA_PROPERTY_IDS: Record<string, string> = {
    'author': 'author',
    'publishedDate': 'published_date',
    'description': 'description',
    'siteName': 'site_name',
    'favicon': 'favicon',
    'language': 'language',
    'canonicalUrl': 'source',
};

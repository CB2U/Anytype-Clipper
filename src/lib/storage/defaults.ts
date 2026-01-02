import { AppSettings, AuthData, StorageSchema, ImageHandlingSettings, ExtensionSettings } from './schema';

export const DEFAULT_APP_SETTINGS: AppSettings = {
    theme: 'system',
    apiPort: 31009, // Default Anytype port
};

export const DEFAULT_AUTH_DATA: AuthData = {
    isAuthenticated: false,
};

export const DEFAULT_IMAGE_SETTINGS: ImageHandlingSettings = {
    preference: 'smart',
    sizeThreshold: 512000,
    maxEmbeddedImages: 20,
    webpQuality: 85,
    fetchTimeout: 5000,
};

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
    debug: false,
    errorReportingEnabled: true,
    includeJSONForDataTables: false,
};

export const DEFAULTS: StorageSchema = {
    _version: 1,
    settings: DEFAULT_APP_SETTINGS,
    imageHandlingSettings: DEFAULT_IMAGE_SETTINGS,
    extensionSettings: DEFAULT_EXTENSION_SETTINGS,
    auth: DEFAULT_AUTH_DATA,
    tagCache: {},
    tagPropertyMappings: {},
    metadataPropertyMappings: {},
    queue: [],
};

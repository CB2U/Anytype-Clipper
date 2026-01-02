import { AppSettings, AuthData, StorageSchema } from './schema';

export const DEFAULT_APP_SETTINGS: AppSettings = {
    theme: 'system',
    apiPort: 31009, // Default Anytype port
};

export const DEFAULT_AUTH_DATA: AuthData = {
    isAuthenticated: false,
};

export const DEFAULTS: StorageSchema = {
    _version: 1,
    settings: DEFAULT_APP_SETTINGS,
    auth: DEFAULT_AUTH_DATA,
    tagCache: {},
    tagPropertyMappings: {},
    metadataPropertyMappings: {},
};

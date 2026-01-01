/**
 * Anytype API Client Library
 *
 * Provides type-safe communication with the local Anytype Desktop API.
 * All exports are re-exported from this module for convenient importing.
 *
 * @example
 * ```typescript
 * import { AnytypeApiClient, checkHealth, ValidationError } from './lib/api';
 *
 * // Check if Anytype is running
 * const isRunning = await checkHealth();
 *
 * // Create API client
 * const client = new AnytypeApiClient(31009);
 *
 * // Make API calls
 * try {
 *   const spaces = await client.get<ListSpacesResponse>('/v1/spaces');
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Invalid API response:', error.validationDetails);
 *   }
 * }
 * ```
 */

// Export API client
export { AnytypeApiClient } from './client';

// Export all TypeScript interfaces
export type {
    CreateChallengeRequest,
    CreateChallengeResponse,
    CreateApiKeyRequest,
    CreateApiKeyResponse,
    ListSpacesResponse,
    Space,
    CreateObjectRequest,
    CreateObjectResponse,
    SearchObjectsRequest,
    SearchObjectsResponse,
    AnytypeObject,
    UpdateObjectRequest,
    UpdateObjectResponse,
} from './types';

// Export all error classes
export { ApiError, AuthError, NetworkError, ValidationError, classifyHttpError } from './errors';

// Export health check
export { checkHealth } from './health';

// Export validation schemas and helper (optional - for advanced users)
export {
    createChallengeResponseSchema,
    createApiKeyResponseSchema,
    spaceSchema,
    listSpacesResponseSchema,
    createObjectResponseSchema,
    anytypeObjectSchema,
    searchObjectsResponseSchema,
    updateObjectResponseSchema,
    validateResponse,
} from './validators';

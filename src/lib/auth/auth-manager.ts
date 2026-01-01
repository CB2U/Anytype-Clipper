import { AnytypeApiClient } from '../api/client';
import { AuthError } from '../api/errors';
import { StorageManager } from '../storage/storage-manager';

export enum AuthStatus {
    Unauthenticated = 'unauthenticated',
    Requesting = 'requesting',
    WaitingForUser = 'waiting_for_user',
    Authenticated = 'authenticated',
    Error = 'error'
}

export interface AuthState {
    status: AuthStatus;
    error?: string;
}

export class AuthManager {
    private static instance: AuthManager;
    private client: AnytypeApiClient;
    private storage: StorageManager;
    private currentChallengeId?: string;
    private state: AuthState = { status: AuthStatus.Unauthenticated };

    private constructor() {
        this.storage = StorageManager.getInstance();
        // TODO: Port should be configurable via StorageManager settings
        this.client = new AnytypeApiClient(31009);
    }

    public static getInstance(): AuthManager {
        if (!AuthManager.instance) {
            AuthManager.instance = new AuthManager();
        }
        return AuthManager.instance;
    }

    /**
     * Initializes auth state from storage
     */
    public async init(): Promise<AuthState> {
        console.log('[AuthManager] Init called');
        const authData = await this.storage.get('auth');
        console.log('[AuthManager] Auth data loaded:', authData);

        // 1. Check for valid session first
        if (authData.isAuthenticated && authData.apiKey) {
            this.client.setApiKey(authData.apiKey);
            this.state = { status: AuthStatus.Authenticated };
            // Validate key asynchronously so we don't block init
            this.validateSession().catch(err => {
                console.log('Session validation failed:', err);
            });
            return this.state;
        }

        // 2. Check for pending challenge (persisted state)
        if (authData.challengeId) {
            console.log('[AuthManager] Found pending challenge:', authData.challengeId);
            this.currentChallengeId = authData.challengeId;
            this.state = {
                status: AuthStatus.WaitingForUser
            };
            return this.state;
        }

        // 3. Default to unauthenticated
        this.state = { status: AuthStatus.Unauthenticated };
        return this.state;
    }

    /**
     * Starts the auth flow by requesting a challenge code
     */
    public async startAuth(): Promise<AuthState> {
        try {
            console.log('[AuthManager] starting Auth...');
            this.state = { status: AuthStatus.Requesting };

            // Get port from settings (if changed)
            const settings = await this.storage.get('settings');
            this.client = new AnytypeApiClient(settings.apiPort);

            const challenge = await this.client.createChallenge();
            console.log('[AuthManager] Challenge received:', challenge);

            this.currentChallengeId = challenge.challengeId;

            // Persist pending challenge
            const currentAuth = await this.storage.get('auth');
            await this.storage.set('auth', {
                ...currentAuth,
                challengeId: this.currentChallengeId
            });
            console.log('[AuthManager] Challenge persisted');

            this.state = {
                status: AuthStatus.WaitingForUser
            };
        } catch (error) {
            console.error('[AuthManager] StartAuth error:', error);
            this.state = {
                status: AuthStatus.Error,
                error: error instanceof Error ? error.message : 'Unknown error starting auth'
            };
        }
        return this.state;
    }

    /**
     * Submits the 4-digit code entered by the user
     * @param code - The 4-digit pairing code
     */
    public async submitCode(code: string): Promise<AuthState> {
        console.log('[AuthManager] Submitting code. CurrentChallengeId:', this.currentChallengeId);

        if (!this.currentChallengeId) {
            // Check storage one last time just in case memory update failed?
            // Or maybe a race condition handled by reload.
            const authData = await this.storage.get('auth');
            if (authData.challengeId) {
                console.log('[AuthManager] Recovered challengeId from storage just in time:', authData.challengeId);
                this.currentChallengeId = authData.challengeId;
            } else {
                console.error('[AuthManager] No active challengeId found in memory or storage');
                return { status: AuthStatus.Error, error: 'No active challenge' };
            }
        }

        try {
            // Try to create API key
            const response = await this.client.createApiKey({
                challengeId: this.currentChallengeId,
                code: code
            });

            if (response.apiKey) {
                // Success! Save to storage and CLEAR challengeId
                await this.storage.set('auth', {
                    apiKey: response.apiKey,
                    isAuthenticated: true,
                    challengeId: undefined // Clear pending challenge
                });

                // Configure client with new key
                this.client.setApiKey(response.apiKey);

                this.state = { status: AuthStatus.Authenticated };
                return this.state;
            }
        } catch (error) {
            console.error('Failed to submit code:', error);
            // Don't reset state to Error immediately, allow retry?
            // Or maybe just return Error state
            this.state = {
                status: AuthStatus.Error,
                error: 'Invalid code or connection failed. Please try again.'
            };
        }
        return this.state;
    }

    public getState(): AuthState {
        return this.state;
    }

    /**
     * Disconnects the extension from Anytype
     * Clears storage and internal state
     */
    public async disconnect(): Promise<void> {
        // Clear auth data from storage
        await this.storage.remove('auth');

        // Reset internal state
        this.currentChallengeId = undefined;
        this.state = { status: AuthStatus.Unauthenticated };

        // We might want to notify listeners here if we had an event emitter
        // For now, the popup polls/checks state on render
    }

    /**
     * Validates the current session by making a lightweight API call
     * If session is invalid (401), automatically disconnects
     */
    public async validateSession(): Promise<boolean> {
        // If not authenticated, session is invalid
        if (this.state.status !== AuthStatus.Authenticated) {
            return false;
        }

        try {
            await this.client.getSpaces();
            return true;
        } catch (error) {
            // Check if error is AuthError (401/403)
            if (error instanceof AuthError) {
                console.log('Session invalid (AuthError), disconnecting...');
                await this.handleAuthError(error);
                return false;
            }

            // Other errors (network, etc.) don't invalidate session state
            return true;
        }
    }

    /**
     * Handles authentication errors (401/403) from API calls
     * Clears session and sets state to Unauthenticated
     * 
     * @param error - The error object
     */
    public async handleAuthError(error: Error): Promise<void> {
        console.error('Authentication error detected:', error.message);
        await this.disconnect();
    }
}

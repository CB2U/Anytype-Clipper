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
    challengeCode?: string;
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
        const authData = await this.storage.get('auth');
        if (authData.isAuthenticated && authData.apiKey) {
            this.state = { status: AuthStatus.Authenticated };
            // Validate key asynchronously so we don't block init
            this.validateSession().catch(err => {
                console.log('Session validation failed:', err);
            });
        } else {
            this.state = { status: AuthStatus.Unauthenticated };
        }
        return this.state;
    }

    /**
     * Starts the auth flow by requesting a challenge code
     */
    public async startAuth(): Promise<AuthState> {
        try {
            this.state = { status: AuthStatus.Requesting };

            // Get port from settings (if changed)
            const settings = await this.storage.get('settings');
            this.client = new AnytypeApiClient(settings.apiPort);

            const challenge = await this.client.createChallenge();
            this.currentChallengeId = challenge.challengeId;

            this.state = {
                status: AuthStatus.WaitingForUser,
                challengeCode: challenge.code
            };
        } catch (error) {
            this.state = {
                status: AuthStatus.Error,
                error: error instanceof Error ? error.message : 'Unknown error starting auth'
            };
        }
        return this.state;
    }

    /**
     * Finalizes auth by exchanging challenge for API key
     * Retries for up to 30 seconds
     */
    public async finalizeAuth(): Promise<AuthState> {
        if (!this.currentChallengeId || !this.state.challengeCode) {
            return { status: AuthStatus.Error, error: 'No active challenge' };
        }

        const challengeCode = this.state.challengeCode;
        const maxAttempts = 30;
        const intervalMs = 1000;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                // Try to create API key
                const response = await this.client.createApiKey({
                    challengeId: this.currentChallengeId,
                    code: challengeCode
                });

                if (response.apiKey) {
                    // Success! Save to storage
                    await this.storage.set('auth', {
                        apiKey: response.apiKey,
                        isAuthenticated: true
                    });

                    this.state = { status: AuthStatus.Authenticated };
                    return this.state;
                }
            } catch (error) {
                // If it's a 404 or specific "pending" error, we continue.
                // For now, assume any error means "not ready" or "failed", 
                // but detailed error handling would check specific codes.
                // We'll log and retry.
                console.log(`Connection attempt ${i + 1} failed, retrying...`);
            }

            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        this.state = {
            status: AuthStatus.Error,
            error: 'Connection timed out. Please try again.'
        };
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

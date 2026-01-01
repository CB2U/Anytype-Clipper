import { AuthManager, AuthStatus } from '../lib/auth/auth-manager';


// DOM Elements
const views = {
  loading: document.getElementById('loading-view'),
  auth: document.getElementById('auth-view'),
  main: document.getElementById('main-view'),
};

const authElements = {
  btnConnect: document.getElementById('btn-connect') as HTMLButtonElement,
  challengeSection: document.getElementById('challenge-section'),
  codeDigits: document.getElementById('code-digits'),
  errorMsg: document.getElementById('auth-error'),
  desc: document.getElementById('auth-desc'),
  actionSection: document.getElementById('action-section'),
};

const mainElements = {
  btnDisconnect: document.getElementById('btn-disconnect') as HTMLButtonElement,
};

const authManager = AuthManager.getInstance();

// Simple router
function switchView(viewName: 'loading' | 'auth' | 'main') {
  Object.values(views).forEach(el => el?.classList.add('hidden'));
  views[viewName]?.classList.remove('hidden');
}

// Error handling
function showError(msg: string) {
  if (authElements.errorMsg) {
    authElements.errorMsg.textContent = msg;
    authElements.errorMsg.classList.remove('hidden');
  }
}

function hideError() {
  authElements.errorMsg?.classList.add('hidden');
}

// Auth Flow
async function handleConnect() {
  hideError();
  authElements.btnConnect.disabled = true;
  authElements.btnConnect.textContent = 'Connecting...';

  // 1. Request Challenge
  const state = await authManager.startAuth();

  if (state.status === AuthStatus.Error) {
    showError(state.error || 'Failed to start auth');
    resetAuthUI();
    return;
  }

  if (state.status === AuthStatus.WaitingForUser && state.challengeCode) {
    // 2. Show Code
    if (authElements.codeDigits) authElements.codeDigits.textContent = state.challengeCode;
    authElements.challengeSection?.classList.remove('hidden');
    authElements.actionSection?.classList.add('hidden'); // Hide connect button
    if (authElements.desc) authElements.desc.textContent = 'Connection pending...';

    // 3. Poll for Success
    const finalState = await authManager.finalizeAuth();

    if (finalState.status === AuthStatus.Authenticated) {
      // Success!
      switchView('main');
    } else {
      showError(finalState.error || 'Authentication timed out');
      resetAuthUI();
    }
  }
}

function resetAuthUI() {
  authElements.btnConnect.disabled = false;
  authElements.btnConnect.textContent = 'Connect';
  authElements.challengeSection?.classList.add('hidden');
  authElements.actionSection?.classList.remove('hidden');
  if (authElements.desc) authElements.desc.textContent = 'Open Anytype Desktop on this device and click Connect to start.';
}

async function handleDisconnect() {
  await authManager.disconnect();
  switchView('auth');
  resetAuthUI();
}

// Initialization
async function init() {
  try {
    const state = await authManager.init();

    if (state.status === AuthStatus.Authenticated) {
      switchView('main');
    } else {
      switchView('auth');
    }

  } catch (error) {
    console.error('Init error:', error);
    switchView('auth');
    showError('Application error. Please reinstall extension.');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  init();
  authElements.btnConnect?.addEventListener('click', handleConnect);
  mainElements.btnDisconnect?.addEventListener('click', handleDisconnect);
});

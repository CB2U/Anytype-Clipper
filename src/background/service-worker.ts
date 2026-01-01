// Service worker entry point for Anytype Clipper Extension
console.log('Anytype Clipper service worker loaded');

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Anytype Clipper installed');
  } else if (details.reason === 'update') {
    console.log('Anytype Clipper updated');
  }
});

// Message handling for future communication
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Message handling will be implemented in future epics
  console.log('Received message:', message);
  sendResponse({ success: true });
  return true; // Keep channel open for async response
});

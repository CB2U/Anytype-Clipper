# Anytype Clipper - User Guide

> **Note:** This is a skeleton document. Full user guide with screenshots will be completed in a future update.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Capturing Content](#capturing-content)
4. [Queue Management](#queue-management)
5. [Settings](#settings)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

1. Download the extension from the Chrome Web Store (coming soon)
2. Or build from source (see [README.md](../README.md))

### First Run

1. Click the extension icon in your browser toolbar
2. You'll see a 4-digit challenge code
3. Open Anytype Desktop
4. Enter the challenge code in Anytype to authorize the extension
5. Select your default Space for captures

## Authentication

The extension connects to your local Anytype Desktop app using a secure challenge code flow.

### Challenge Code Flow

1. Extension requests a challenge code from Anytype
2. Display 4-digit code in popup
3. User enters code in Anytype Desktop
4. Anytype returns API key
5. Extension stores API key securely

### Re-authentication

If your connection expires, the extension will automatically prompt you to re-authenticate.

## Capturing Content

### Bookmark Capture

1. Navigate to the page you want to save
2. Click the extension icon
3. Add tags and notes (optional)
4. Click "Save Bookmark"

### Highlight Capture

1. Select text on any web page
2. Right-click and choose "Send selection to Anytype"
3. Add tags and notes (optional)
4. Click "Save Highlight"

### Article Capture

1. Navigate to an article
2. Right-click and choose "Clip article to Anytype"
3. Extension extracts the article content
4. Add tags and notes (optional)
5. Click "Save Article"

## Queue Management

When Anytype is offline, captures are automatically queued.

### Queue Status

- View pending captures in the popup
- Badge counter shows number of pending items
- Color-coded status indicators:
  - **Blue**: Queued
  - **Yellow**: Sending
  - **Green**: Sent
  - **Red**: Failed

### Manual Actions

- **Retry**: Manually retry a failed capture
- **Delete**: Remove a capture from the queue

## Settings

Access settings by clicking the gear icon in the popup.

### Available Settings

- **Default Spaces**: Set default Space for each content type
- **Retry Behavior**: Configure max attempts and backoff intervals
- **Deduplication**: Enable/disable duplicate detection
- **API Port**: Custom Anytype port (default: 31009)
- **Image Handling**: Choose how images are embedded
- **Privacy Mode**: Disable URL history tracking

## Troubleshooting

### Common Issues

**Extension can't connect to Anytype**
- Ensure Anytype Desktop is running
- Check that Anytype is listening on the correct port (default: 31009)
- Try re-authenticating

**Captures are queued but not processing**
- Check your internet connection
- Ensure Anytype Desktop is running
- Try manually retrying from the queue

**Tags not appearing**
- Ensure you've created tags in Anytype first
- Try refreshing the tag cache (close and reopen popup)

For more help, visit the [GitHub Issues](https://github.com/CB2U/Anytype-Clipper/issues) page.

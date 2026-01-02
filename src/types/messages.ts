/**
 * Message types for communication between Popup and Background script
 */

import { PageMetadata } from './metadata';

export type MessageType =
    | 'CMD_GET_SPACES'
    | 'CMD_CAPTURE_BOOKMARK'
    | 'CMD_CHECK_AUTH'
    | 'CMD_HIGHLIGHT_CAPTURED'
    | 'CMD_EXTRACT_METADATA'
    | 'CMD_EXTRACT_ARTICLE';

export interface BaseMessage {
    type: MessageType;
    payload?: unknown;
}

export interface GetSpacesMessage extends BaseMessage {
    type: 'CMD_GET_SPACES';
}

export interface CaptureBookmarkMessage extends BaseMessage {
    type: 'CMD_CAPTURE_BOOKMARK';
    payload: {
        spaceId: string;
        metadata: PageMetadata;
        userNote?: string;
        tags?: string[];
        type_key?: string;
    };
}

export interface ExtractMetadataMessage extends BaseMessage {
    type: 'CMD_EXTRACT_METADATA';
}

export interface ExtractArticleMessage extends BaseMessage {
    type: 'CMD_EXTRACT_ARTICLE';
}

export interface CheckAuthMessage extends BaseMessage {
    type: 'CMD_CHECK_AUTH';
}

export interface HighlightCapturedMessage extends BaseMessage {
    type: 'CMD_HIGHLIGHT_CAPTURED';
    payload: {
        quote: string;
        contextBefore: string;
        contextAfter: string;
        url: string;
        pageTitle: string;
        timestamp: string;
    };
}

export type ExtensionMessage =
    | GetSpacesMessage
    | CaptureBookmarkMessage
    | CheckAuthMessage
    | HighlightCapturedMessage
    | ExtractMetadataMessage
    | ExtractArticleMessage;

export interface MessageResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

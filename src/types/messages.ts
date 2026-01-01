/**
 * Message types for communication between Popup and Background script
 */

import { CreateObjectParams, AnytypeObject, Space } from '../lib/api/types';

export type MessageType =
    | 'CMD_GET_SPACES'
    | 'CMD_CAPTURE_BOOKMARK'
    | 'CMD_CHECK_AUTH';

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
        params: CreateObjectParams;
    };
}

export interface CheckAuthMessage extends BaseMessage {
    type: 'CMD_CHECK_AUTH';
}

export type ExtensionMessage =
    | GetSpacesMessage
    | CaptureBookmarkMessage
    | CheckAuthMessage;

export interface MessageResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

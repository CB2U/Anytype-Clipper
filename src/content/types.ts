export interface HighlightCaptureData {
    quote: string;
    contextBefore: string;
    contextAfter: string;
    url: string;
    pageTitle: string;
    timestamp: string;
}

export type ContentScriptMessage = {
    type: 'CAPTURE_HIGHLIGHT';
    data: HighlightCaptureData;
};

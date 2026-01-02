export type DataTableFormat = 'markdown' | 'json' | 'both';

export interface ExtensionSettings {
    debug?: boolean;
    errorReportingEnabled?: boolean;
    dataTableFormat?: DataTableFormat;
    // Add other settings here as needed (migrating from ad-hoc storage usage)
}

export enum TableType {
    Simple = 'simple',
    Complex = 'complex',
    Data = 'data'
}

export interface TableMetadata {
    rowCount: number;
    columnCount: number;
    hasHeader: boolean;
    hasMergedCells: boolean;
    hasNestedTables: boolean;
    isUniformStructure: boolean;
    cellTypes: string[]; // 'numeric', 'text', 'mixed'
}

export interface TableClassificationResult {
    type: TableType;
    confidence: number; // 0-1
    metadata: TableMetadata;
    reason: string; // for debugging
}

export interface TableConversionResult {
    format: 'markdown' | 'html' | 'data';
    content: string;
    metadata?: {
        json?: string;
        csv?: string;
        html?: string;
    };
}

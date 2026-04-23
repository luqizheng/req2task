declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    text: string;
    version: string;
  }

  interface PDFParse {
    (dataBuffer: Buffer, options?: Record<string, unknown>): Promise<PDFData>;
    default: PDFParse;
  }

  const pdfParse: PDFParse;
  export = pdfParse;
}

declare module 'mammoth' {
  interface RawTextResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
      row?: number;
      column?: number;
    }>;
  }

  interface ExtractRawTextOptions {
    buffer: Buffer;
  }

  interface ExtractRawText {
    (options: ExtractRawTextOptions): Promise<RawTextResult>;
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<RawTextResult>;
}

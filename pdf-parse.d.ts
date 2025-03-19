declare module 'pdf-parse' {
  interface PDFMetadata {
    [key: string]: any;
  }

  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    [key: string]: any;
  }

  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata?: PDFMetadata | null;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer | Uint8Array | ArrayBuffer, options?: any): Promise<PDFData>;

  export default pdfParse;
}

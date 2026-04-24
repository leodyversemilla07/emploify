declare module "pdf-parse" {
  export interface PDFData {
    text: string
    numpages: number
    numrender: number
    info: Record<string, unknown>
    metadata: Record<string, unknown>
    version: string
  }

  export default function pdfParse(buffer: Buffer): Promise<PDFData>
}

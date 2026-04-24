import pdf from "pdf-parse"
import mammoth from "mammoth"

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  if (mimetype === "application/pdf") {
    const data = await pdf(buffer)
    return data.text
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  throw new Error(`Unsupported mimetype for text extraction: ${mimetype}`)
}

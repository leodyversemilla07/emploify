import mammoth from "mammoth"

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string
): Promise<string | null> {
  try {
    if (mimetype === "application/pdf") {
      // @ts-ignore
      const pdfModule = await import("pdf-parse")
      const pdf = (pdfModule.default || pdfModule) as any
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

    // DOC (application/msword) is not supported for text extraction yet
    return null
  } catch (error) {
    console.error("Resume text extraction failed:", error)
    return null
  }
}

import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
})

export async function uploadToCloudinary(buffer: Buffer, fileName: string): Promise<string | null> {
  try {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "eureka_notes",
          public_id: `${Date.now()}_${cleanFileName}`,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })
    return uploadResult.secure_url || null
  } catch (error) {
    console.error("Cloudinary upload error:", error)
    return null
  }
}

export function cleanExtractedText(raw: string): string {
  if (!raw) return ""

  return raw
    // Replace null bytes and non-printable control characters (except newline \n and tab \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    // Normalize unicode space characters
    .replace(/[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, " ")
    // Fix hyphenated word breaks at end of line (e.g. "meth- \nodology" -> "methodology")
    .replace(/(\w+)-\s*\n\s*(\w+)/g, "$1$2")
    // Replace multiple spaces or tabs on a line with a single space
    .replace(/[ \t]+/g, " ")
    // Replace excessive blank lines with at most two newlines
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim()
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const isPdf = mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")

  if (isPdf) {
    // 1. Primary: Use unpdf (lightweight, zero-worker pdfjs engine optimized for Next.js / serverless / Node)
    try {
      const { extractText } = require("unpdf")
      const result = await extractText(new Uint8Array(buffer), { mergePages: true })
      const text = Array.isArray(result.text) ? result.text.join("\n\n") : (result.text || "")
      if (text && text.trim().length > 0) {
        const cleaned = cleanExtractedText(text)
        if (cleaned.length > 20) {
          return cleaned
        }
      }
    } catch (unpdfErr) {
      console.warn("unpdf extraction failed, falling back to pdf2json / pdf-parse:", unpdfErr)
    }

    // 2. Secondary fallback: pdf2json (pure JS parser, no web-worker or external file dependencies)
    try {
      const PDFParser = require("pdf2json")
      const text = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1)
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError))
        pdfParser.on("pdfParser_dataReady", () => {
          const rawText = pdfParser.getRawTextContent()
          resolve(rawText || "")
        })
        pdfParser.parseBuffer(buffer)
      })

      if (text && text.trim().length > 0) {
        const cleaned = cleanExtractedText(text)
        if (cleaned.length > 20) {
          return cleaned
        }
      }
    } catch (pdf2jsonErr) {
      console.warn("pdf2json parsing failed:", pdf2jsonErr)
    }

    // 3. Fallback if PDF was an image scan or unextractable font
    return `[Attached PDF Document: ${fileName}]\nThis document appears to contain scanned images or protected vector drawings without extractable text streams. Eureka AI will utilize document metadata and title to generate your study materials.`
  }

  // TXT or MD file
  return cleanExtractedText(buffer.toString("utf-8"))
}

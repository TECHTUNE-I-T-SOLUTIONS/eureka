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

export async function parseDocumentBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const isPdf = mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")

  if (isPdf) {
    // 1. Primary: Use dedicated Node.js pdf-parse engine (fast, robust, full text extraction)
    try {
      const pdfParse = require("pdf-parse")
      const data = await pdfParse(buffer)
      if (data?.text && data.text.trim().length > 0) {
        return data.text.trim()
      }
    } catch (parseErr) {
      console.warn("pdf-parse failed, falling back to pdfjs-dist:", parseErr)
    }

    // 2. Secondary fallback: pdfjs-dist
    try {
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
        disableFontFace: true,
      })
      const pdfDoc = await loadingTask.promise
      let extractedText = ""
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str || "")
          .filter(Boolean)
          .join(" ")
        if (pageText.trim()) {
          extractedText += pageText + "\n\n"
        }
      }
      if (extractedText.trim().length > 0) {
        return extractedText.trim()
      }
    } catch (pdfErr) {
      console.warn("PDF.js legacy import failed, trying standard import:", pdfErr)
      try {
        const pdfjsLib = await import("pdfjs-dist")
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
        const pdfDoc = await loadingTask.promise
        let extractedText = ""
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .map((item: any) => item.str || "")
            .filter(Boolean)
            .join(" ")
          if (pageText.trim()) {
            extractedText += pageText + "\n\n"
          }
        }
        if (extractedText.trim().length > 0) {
          return extractedText.trim()
        }
      } catch (err2) {
        console.error("PDF parsing failed:", err2)
      }
    }

    // 3. Last-resort ASCII fallback
    const rawString = buffer.toString("utf-8")
    const cleanAscii = rawString.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ")
    if (cleanAscii.trim().length > 50) {
      return cleanAscii.trim()
    }
    return `[Parsed PDF Document: ${fileName}]`
  }

  // TXT or MD file
  return buffer.toString("utf-8")
}

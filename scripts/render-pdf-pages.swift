// Renders each page of a PDF to <outdir>/page-N.png at 200 dpi so scanned pages can be OCR'd.
// Usage: swift scripts/render-pdf-pages.swift <file.pdf> <outdir> [page numbers...]
import AppKit
import PDFKit

let args = CommandLine.arguments
guard args.count >= 3, let document = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
  FileHandle.standardError.write("usage: render-pdf-pages <file.pdf> <outdir> [pages...]\n".data(using: .utf8)!)
  exit(1)
}
let requested = args.dropFirst(3).compactMap { Int($0) }
let pages = requested.isEmpty ? Array(1...document.pageCount) : requested
for number in pages {
  guard let page = document.page(at: number - 1) else { continue }
  let box = page.bounds(for: .mediaBox)
  let scale: CGFloat = 200.0 / 72.0
  let image = page.thumbnail(of: NSSize(width: box.width * scale, height: box.height * scale), for: .mediaBox)
  guard let tiff = image.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff), let png = bitmap.representation(using: .png, properties: [:]) else { continue }
  try png.write(to: URL(fileURLWithPath: "\(args[2])/page-\(number).png"))
}

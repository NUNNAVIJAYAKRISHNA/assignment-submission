import zlib from "zlib";

// ─── CRC-32 ────────────────────────────────────────────────────────────────────

// Precomputed CRC-32 table fallback for ultra-fast hashing
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

/** Compute CRC-32 for a complete buffer in one shot */
function calculateCrc32(data: Uint8Array): number {
  if (typeof zlib.crc32 === "function") {
    return zlib.crc32(data);
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Incremental CRC-32 calculator for streaming use.
 * Call update() with successive chunks, then digest() for the final value.
 *
 * Uses native zlib.crc32 when available (Node ≥ 22, implemented in C++)
 * and falls back to the JS lookup-table implementation otherwise.
 * Both paths produce identical results and support correct chaining because
 * zlib.crc32() internally un-finalizes its input and re-finalizes its output.
 */
class CRC32Hasher {
  private crc: number = 0;
  private readonly useNative: boolean;

  constructor() {
    this.useNative = typeof zlib.crc32 === "function";
  }

  update(chunk: Uint8Array): void {
    if (this.useNative) {
      this.crc = zlib.crc32(chunk, this.crc);
    } else {
      // Match zlib behavior: XOR to un-finalize, process bytes, XOR to re-finalize
      let c = this.crc ^ 0xffffffff;
      for (let i = 0; i < chunk.length; i++) {
        c = (c >>> 8) ^ crcTable[(c ^ chunk[i]) & 0xff];
      }
      this.crc = (c ^ 0xffffffff) >>> 0;
    }
  }

  digest(): number {
    return this.crc >>> 0;
  }
}

// ─── In-memory ZIP builder (legacy, kept for backward compatibility) ────────

export function createZip(files: { name: string; content: string | Uint8Array }[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const cdParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const contentBytes = typeof file.content === "string" ? new TextEncoder().encode(file.content) : file.content;
    const crc = calculateCrc32(contentBytes);
    const size = contentBytes.length;

    // Local file header
    const lfHeader = new Uint8Array(30 + nameBytes.length);
    const lfView = new DataView(lfHeader.buffer);
    lfView.setUint32(0, 0x04034b50, true); // signature
    lfView.setUint16(4, 10, true);         // version needed
    lfView.setUint16(6, 0, true);          // flags
    lfView.setUint16(8, 0, true);          // compression (0 = store)
    lfView.setUint16(10, 0, true);         // last mod time
    lfView.setUint16(12, 0, true);         // last mod date
    lfView.setUint32(14, crc, true);       // crc-32
    lfView.setUint32(18, size, true);      // compressed size
    lfView.setUint32(22, size, true);      // uncompressed size
    lfView.setUint16(26, nameBytes.length, true); // filename length
    lfView.setUint16(28, 0, true);         // extra field length
    lfHeader.set(nameBytes, 30);

    parts.push(lfHeader);
    parts.push(contentBytes);

    // Central directory file header
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdHeader.buffer);
    cdView.setUint32(0, 0x02014b50, true); // signature
    cdView.setUint16(4, 10, true);         // version made by
    cdView.setUint16(6, 10, true);         // version needed
    cdView.setUint16(8, 0, true);          // flags
    cdView.setUint16(10, 0, true);         // compression
    cdView.setUint16(12, 0, true);         // last mod time
    cdView.setUint16(14, 0, true);         // last mod date
    cdView.setUint32(16, crc, true);       // crc-32
    cdView.setUint32(20, size, true);      // compressed size
    cdView.setUint32(24, size, true);      // uncompressed size
    cdView.setUint16(28, nameBytes.length, true); // filename length
    cdView.setUint16(30, 0, true);         // extra field length
    cdView.setUint16(32, 0, true);         // file comment length
    cdView.setUint16(34, 0, true);         // disk number start
    cdView.setUint16(36, 0, true);         // internal file attrs
    cdView.setUint32(38, 0, true);         // external file attrs
    cdView.setUint32(42, offset, true);    // local header offset
    cdHeader.set(nameBytes, 46);

    cdParts.push(cdHeader);
    offset += lfHeader.length + contentBytes.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const part of cdParts) {
    cdSize += part.length;
  }

  // End of central directory record
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // signature
  eocdView.setUint16(4, 0, true);          // disk number
  eocdView.setUint16(6, 0, true);          // disk number with CD
  eocdView.setUint16(8, cdParts.length, true); // number of CD records on disk
  eocdView.setUint16(10, cdParts.length, true); // total number of CD records
  eocdView.setUint32(12, cdSize, true);    // size of CD
  eocdView.setUint32(16, cdOffset, true);  // offset of CD
  eocdView.setUint16(20, 0, true);         // comment length

  // Concatenate all parts
  const totalLength = offset + cdSize + eocd.length;
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of parts) {
    result.set(part, pos);
    pos += part.length;
  }
  for (const part of cdParts) {
    result.set(part, pos);
    pos += part.length;
  }
  result.set(eocd, pos);

  return result;
}

// ─── Streaming ZIP builder ──────────────────────────────────────────────────────

interface CentralDirectoryEntry {
  nameBytes: Uint8Array;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  gpFlag: number;
}

/**
 * Streaming ZIP builder that writes data incrementally to a ReadableStream controller.
 *
 * Supports two modes of adding files:
 *
 * - addFile(name, content):
 *     For small files already buffered in memory. CRC-32 and sizes are computed
 *     upfront and written into the local file header. No data descriptor.
 *
 * - addFileStream(name, stream):
 *     For large files delivered as a ReadableStream<Uint8Array>. The local file
 *     header is written with CRC/size = 0 and bit 3 set (data descriptor flag).
 *     File data is streamed chunk-by-chunk while CRC-32 is computed incrementally.
 *     A data descriptor containing the final CRC and size is appended after the
 *     file data. If the source stream errors mid-transfer, the data descriptor
 *     records whatever was successfully written, keeping the ZIP structurally valid.
 *
 * All files use STORE compression (method 0) — no DEFLATE. This is intentional:
 * videos (MP4/MOV) and modern office formats (DOCX/PPTX/XLSX) are already
 * internally compressed, making DEFLATE a waste of CPU for negligible savings.
 *
 * Only the small central directory entries (~100 bytes each) are accumulated
 * in memory. File data flows directly from the source into the HTTP response.
 */
export class ZipStreamBuilder {
  private cdEntries: CentralDirectoryEntry[] = [];
  private offset = 0;
  private controller: ReadableStreamDefaultController<Uint8Array>;

  constructor(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.controller = controller;
  }

  /**
   * Add a file whose content is fully buffered in memory.
   * CRC-32 and size are computed before writing the local file header.
   * Best for small files (text, URLs, PDFs, small documents).
   */
  addFile(name: string, content: string | Uint8Array): void {
    const nameBytes = new TextEncoder().encode(name);
    const contentBytes =
      typeof content === "string"
        ? new TextEncoder().encode(content)
        : content;
    const crc = calculateCrc32(contentBytes);
    const size = contentBytes.length;

    // Local file header — CRC and sizes known, no data descriptor needed
    const lfHeader = new Uint8Array(30 + nameBytes.length);
    const lfView = new DataView(lfHeader.buffer);
    lfView.setUint32(0, 0x04034b50, true);  // local file header signature
    lfView.setUint16(4, 20, true);           // version needed to extract (2.0)
    lfView.setUint16(6, 0, true);            // general purpose bit flag
    lfView.setUint16(8, 0, true);            // compression method: STORE
    lfView.setUint16(10, 0, true);           // last mod file time
    lfView.setUint16(12, 0, true);           // last mod file date
    lfView.setUint32(14, crc, true);         // crc-32
    lfView.setUint32(18, size, true);        // compressed size
    lfView.setUint32(22, size, true);        // uncompressed size
    lfView.setUint16(26, nameBytes.length, true); // file name length
    lfView.setUint16(28, 0, true);           // extra field length
    lfHeader.set(nameBytes, 30);

    // Enqueue header + data into the stream immediately
    this.controller.enqueue(lfHeader);
    this.controller.enqueue(contentBytes);

    // Central directory entry (~46 + name length bytes — accumulated)
    this.cdEntries.push({
      nameBytes,
      crc32: crc,
      compressedSize: size,
      uncompressedSize: size,
      localHeaderOffset: this.offset,
      gpFlag: 0,
    });

    this.offset += lfHeader.length + contentBytes.length;
  }

  /**
   * Add a file by streaming its content from a ReadableStream.
   *
   * Uses ZIP data descriptors (bit 3 of the general purpose flag) so that
   * CRC-32 and size are written AFTER the file data, computed incrementally.
   * The local file header is emitted with CRC/size = 0.
   *
   * Memory usage: only one chunk (~64 KB) is in memory at a time,
   * regardless of total file size.
   *
   * If the source stream errors mid-transfer, the data descriptor records
   * whatever was successfully written. The ZIP remains structurally valid
   * but the file entry will contain truncated data.
   */
  async addFileStream(name: string, stream: ReadableStream<Uint8Array>): Promise<void> {
    const nameBytes = new TextEncoder().encode(name);

    // Local file header with bit 3 set — CRC/sizes deferred to data descriptor
    const lfHeader = new Uint8Array(30 + nameBytes.length);
    const lfView = new DataView(lfHeader.buffer);
    lfView.setUint32(0, 0x04034b50, true);  // signature
    lfView.setUint16(4, 20, true);           // version needed (2.0 for data descriptors)
    lfView.setUint16(6, 0x0008, true);       // bit 3 = data descriptor follows
    lfView.setUint16(8, 0, true);            // compression: STORE
    lfView.setUint16(10, 0, true);           // mod time
    lfView.setUint16(12, 0, true);           // mod date
    lfView.setUint32(14, 0, true);           // crc-32 = 0 (deferred)
    lfView.setUint32(18, 0, true);           // compressed size = 0 (deferred)
    lfView.setUint32(22, 0, true);           // uncompressed size = 0 (deferred)
    lfView.setUint16(26, nameBytes.length, true);
    lfView.setUint16(28, 0, true);           // extra field length
    lfHeader.set(nameBytes, 30);

    this.controller.enqueue(lfHeader);

    // Stream file data chunk-by-chunk, computing CRC incrementally
    const hasher = new CRC32Hasher();
    let totalSize = 0;
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        hasher.update(value);
        totalSize += value.length;
        this.controller.enqueue(value);
      }
    } catch (streamErr) {
      // Stream error mid-transfer: record what we have so the ZIP stays structurally valid.
      // The file entry will contain truncated data but the archive won't be corrupted.
      console.error(`[ZipStreamBuilder] Stream error writing "${name}":`, streamErr);
    } finally {
      reader.releaseLock();
    }

    const crc = hasher.digest();

    // Data descriptor (with 4-byte signature prefix for maximum compatibility)
    const dd = new Uint8Array(16);
    const ddView = new DataView(dd.buffer);
    ddView.setUint32(0, 0x08074b50, true);   // data descriptor signature
    ddView.setUint32(4, crc, true);           // crc-32
    ddView.setUint32(8, totalSize, true);     // compressed size
    ddView.setUint32(12, totalSize, true);    // uncompressed size

    this.controller.enqueue(dd);

    // Store central directory entry with actual CRC and size
    this.cdEntries.push({
      nameBytes,
      crc32: crc,
      compressedSize: totalSize,
      uncompressedSize: totalSize,
      localHeaderOffset: this.offset,
      gpFlag: 0x0008,
    });

    this.offset += lfHeader.length + totalSize + dd.length;
  }

  /** Write the central directory and end-of-central-directory record, then close the stream. */
  finalize(): void {
    const cdOffset = this.offset;
    let cdSize = 0;

    for (const entry of this.cdEntries) {
      const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
      const cdView = new DataView(cdHeader.buffer);
      cdView.setUint32(0, 0x02014b50, true);   // central directory signature
      cdView.setUint16(4, 20, true);             // version made by (2.0)
      cdView.setUint16(6, 20, true);             // version needed (2.0)
      cdView.setUint16(8, entry.gpFlag, true);   // general purpose bit flag
      cdView.setUint16(10, 0, true);             // compression: STORE
      cdView.setUint16(12, 0, true);             // mod time
      cdView.setUint16(14, 0, true);             // mod date
      cdView.setUint32(16, entry.crc32, true);   // crc-32
      cdView.setUint32(20, entry.compressedSize, true);
      cdView.setUint32(24, entry.uncompressedSize, true);
      cdView.setUint16(28, entry.nameBytes.length, true);
      cdView.setUint16(30, 0, true);             // extra field length
      cdView.setUint16(32, 0, true);             // file comment length
      cdView.setUint16(34, 0, true);             // disk number start
      cdView.setUint16(36, 0, true);             // internal file attributes
      cdView.setUint32(38, 0, true);             // external file attributes
      cdView.setUint32(42, entry.localHeaderOffset, true);
      cdHeader.set(entry.nameBytes, 46);

      this.controller.enqueue(cdHeader);
      cdSize += cdHeader.length;
    }

    // End of Central Directory Record
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);     // EOCD signature
    eocdView.setUint16(4, 0, true);               // disk number
    eocdView.setUint16(6, 0, true);               // disk number with CD
    eocdView.setUint16(8, this.cdEntries.length, true);  // CD entries on this disk
    eocdView.setUint16(10, this.cdEntries.length, true); // total CD entries
    eocdView.setUint32(12, cdSize, true);         // size of central directory
    eocdView.setUint32(16, cdOffset, true);       // offset of central directory
    eocdView.setUint16(20, 0, true);              // comment length

    this.controller.enqueue(eocd);
    this.controller.close();

    // Release references
    this.cdEntries = [];
  }
}

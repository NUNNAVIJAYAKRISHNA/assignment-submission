import zlib from "zlib";

// Precomputed CRC-32 table fallback for ultra-fast hashing
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

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

/**
 * Streaming ZIP builder that writes data incrementally to a ReadableStream controller.
 * Only the small central directory entries are accumulated in memory.
 */
export class ZipStreamBuilder {
  private cdParts: Uint8Array[] = [];
  private offset = 0;
  private controller: ReadableStreamDefaultController<Uint8Array>;

  constructor(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.controller = controller;
  }

  addFile(name: string, content: string | Uint8Array): void {
    const nameBytes = new TextEncoder().encode(name);
    const contentBytes =
      typeof content === "string"
        ? new TextEncoder().encode(content)
        : content;
    const crc = calculateCrc32(contentBytes);
    const size = contentBytes.length;

    // Local file header (30 + name length bytes — tiny)
    const lfHeader = new Uint8Array(30 + nameBytes.length);
    const lfView = new DataView(lfHeader.buffer);
    lfView.setUint32(0, 0x04034b50, true);
    lfView.setUint16(4, 10, true);
    lfView.setUint16(6, 0, true);
    lfView.setUint16(8, 0, true);
    lfView.setUint16(10, 0, true);
    lfView.setUint16(12, 0, true);
    lfView.setUint32(14, crc, true);
    lfView.setUint32(18, size, true);
    lfView.setUint32(22, size, true);
    lfView.setUint16(26, nameBytes.length, true);
    lfView.setUint16(28, 0, true);
    lfHeader.set(nameBytes, 30);

    // Enqueue header + data into the stream immediately
    this.controller.enqueue(lfHeader);
    this.controller.enqueue(contentBytes);

    // Central directory entry (~46 + name length bytes — accumulated)
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdHeader.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(4, 10, true);
    cdView.setUint16(6, 10, true);
    cdView.setUint16(8, 0, true);
    cdView.setUint16(10, 0, true);
    cdView.setUint16(12, 0, true);
    cdView.setUint16(14, 0, true);
    cdView.setUint32(16, crc, true);
    cdView.setUint32(20, size, true);
    cdView.setUint32(24, size, true);
    cdView.setUint16(28, nameBytes.length, true);
    cdView.setUint16(30, 0, true);
    cdView.setUint16(32, 0, true);
    cdView.setUint16(34, 0, true);
    cdView.setUint16(36, 0, true);
    cdView.setUint32(38, 0, true);
    cdView.setUint32(42, this.offset, true);
    cdHeader.set(nameBytes, 46);

    this.cdParts.push(cdHeader);
    this.offset += lfHeader.length + contentBytes.length;
  }

  finalize(): void {
    const cdOffset = this.offset;
    let cdSize = 0;
    for (const part of this.cdParts) {
      this.controller.enqueue(part);
      cdSize += part.length;
    }

    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, this.cdParts.length, true);
    eocdView.setUint16(10, this.cdParts.length, true);
    eocdView.setUint32(12, cdSize, true);
    eocdView.setUint32(16, cdOffset, true);
    eocdView.setUint16(20, 0, true);

    this.controller.enqueue(eocd);
    this.controller.close();

    // Release references
    this.cdParts = [];
  }
}

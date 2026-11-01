/**
 * Minimal ZIP writer used by the local admin sandbox.
 *
 * Files are stored uncompressed ("store" method) so the browser does not need
 * a compression library. Entries keep their repository paths, which makes the
 * archive directly droppable into the project root.
 */

export interface ZipEntry {
  /** Repository-relative path, using forward slashes, e.g. `public/og/foo.png`. */
  path: string;
  data: Blob | ArrayBuffer | Uint8Array | string;
}

export interface ZipOptions {
  /** Timestamp stored in the archive. Defaults to now. */
  date?: Date;
}

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_CENTRAL = 0x06054b50;
const VERSION = 20;
const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;
const TEXT_ENCODER = new TextEncoder();

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = (CRC_TABLE[(crc ^ bytes[index]!) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function toBytes(data: ZipEntry['data']): Promise<Uint8Array> {
  if (typeof data === 'string') return TEXT_ENCODER.encode(data);
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(await data.arrayBuffer());
}

function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/\/+/g, '/');
}

function dosTimestamp(date: Date): { time: number; date: number } {
  const year = Math.min(Math.max(date.getFullYear(), 1980), 2107);
  return {
    time:
      (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2) & 0x1f),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

interface PreparedEntry {
  name: Uint8Array;
  bytes: Uint8Array;
  crc: number;
  offset: number;
}

/** Builds a valid ZIP archive from repository paths and their contents. */
export async function createZip(entries: ZipEntry[], options: ZipOptions = {}): Promise<Blob> {
  const stamp = dosTimestamp(options.date ?? new Date());
  const prepared: PreparedEntry[] = [];

  for (const entry of entries) {
    const name = TEXT_ENCODER.encode(normalizePath(entry.path));
    if (name.length === 0) continue;
    const bytes = await toBytes(entry.data);
    prepared.push({ name, bytes, crc: crc32(bytes), offset: 0 });
  }

  const localSize = prepared.reduce((total, entry) => total + 30 + entry.name.length + entry.bytes.length, 0);
  const centralSize = prepared.reduce((total, entry) => total + 46 + entry.name.length, 0);
  const buffer = new ArrayBuffer(localSize + centralSize + 22);
  const view = new DataView(buffer);
  const output = new Uint8Array(buffer);
  let offset = 0;

  for (const entry of prepared) {
    entry.offset = offset;
    view.setUint32(offset, LOCAL_HEADER, true);
    view.setUint16(offset + 4, VERSION, true);
    view.setUint16(offset + 6, UTF8_FLAG, true);
    view.setUint16(offset + 8, STORE_METHOD, true);
    view.setUint16(offset + 10, stamp.time, true);
    view.setUint16(offset + 12, stamp.date, true);
    view.setUint32(offset + 14, entry.crc, true);
    view.setUint32(offset + 18, entry.bytes.length, true);
    view.setUint32(offset + 22, entry.bytes.length, true);
    view.setUint16(offset + 26, entry.name.length, true);
    view.setUint16(offset + 28, 0, true);
    output.set(entry.name, offset + 30);
    output.set(entry.bytes, offset + 30 + entry.name.length);
    offset += 30 + entry.name.length + entry.bytes.length;
  }

  const centralStart = offset;
  for (const entry of prepared) {
    view.setUint32(offset, CENTRAL_HEADER, true);
    view.setUint16(offset + 4, VERSION, true);
    view.setUint16(offset + 6, VERSION, true);
    view.setUint16(offset + 8, UTF8_FLAG, true);
    view.setUint16(offset + 10, STORE_METHOD, true);
    view.setUint16(offset + 12, stamp.time, true);
    view.setUint16(offset + 14, stamp.date, true);
    view.setUint32(offset + 16, entry.crc, true);
    view.setUint32(offset + 20, entry.bytes.length, true);
    view.setUint32(offset + 24, entry.bytes.length, true);
    view.setUint16(offset + 28, entry.name.length, true);
    view.setUint16(offset + 30, 0, true);
    view.setUint16(offset + 32, 0, true);
    view.setUint16(offset + 34, 0, true);
    view.setUint16(offset + 36, 0, true);
    view.setUint32(offset + 38, 0, true);
    view.setUint32(offset + 42, entry.offset, true);
    output.set(entry.name, offset + 46);
    offset += 46 + entry.name.length;
  }

  view.setUint32(offset, END_OF_CENTRAL, true);
  view.setUint16(offset + 4, 0, true);
  view.setUint16(offset + 6, 0, true);
  view.setUint16(offset + 8, prepared.length, true);
  view.setUint16(offset + 10, prepared.length, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, centralStart, true);
  view.setUint16(offset + 20, 0, true);

  return new Blob([output], { type: 'application/zip' });
}

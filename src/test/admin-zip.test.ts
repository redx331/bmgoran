import { describe, expect, it } from 'vitest';
import { createZip } from '../lib/admin/zip';

const DECODER = new TextDecoder();
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

interface CentralEntry {
  name: string;
  flags: number;
  crc: number;
  size: number;
  localOffset: number;
}

function readCentralDirectory(bytes: Uint8Array, count: number): CentralEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = bytes.length - 22;
  expect(view.getUint32(eocd, true)).toBe(EOCD_SIGNATURE);
  expect(view.getUint16(eocd + 10, true)).toBe(count);

  let offset = view.getUint32(eocd + 16, true);
  const entries: CentralEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    expect(view.getUint32(offset, true)).toBe(CENTRAL_SIGNATURE);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    entries.push({
      name: DECODER.decode(bytes.slice(offset + 46, offset + 46 + nameLength)),
      flags: view.getUint16(offset + 8, true),
      crc: view.getUint32(offset + 16, true),
      size: view.getUint32(offset + 24, true),
      localOffset: view.getUint32(offset + 42, true),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

describe('createZip', () => {
  it('writes a valid, uncompressed archive with UTF-8 paths', async () => {
    const blob = await createZip(
      [
        { path: 'src/data/products.json', data: '[]\n' },
        { path: 'public/og/café.png', data: new Uint8Array([1, 2, 3]) },
      ],
      { date: new Date(2026, 10, 1, 12, 0, 0) },
    );

    expect(blob.type).toBe('application/zip');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const entries = readCentralDirectory(bytes, 2);

    expect(entries.map((entry) => entry.name)).toEqual([
      'src/data/products.json',
      'public/og/café.png',
    ]);
    expect(entries.every((entry) => (entry.flags & 0x0800) !== 0)).toBe(true);

    expect(entries[0]!.crc).toBe(0x7068d244);
    expect(entries[0]!.size).toBe(3);
    expect(entries[1]!.crc).toBe(0x55bc801d);

    for (const entry of entries) {
      expect(view.getUint32(entry.localOffset, true)).toBe(LOCAL_SIGNATURE);
      expect(view.getUint32(entry.localOffset + 14, true)).toBe(entry.crc);
    }

    const firstData = entries[0]!.localOffset + 30 + 'src/data/products.json'.length;
    expect(DECODER.decode(bytes.slice(firstData, firstData + 3))).toBe('[]\n');
  });

  it('normalizes repository paths', async () => {
    const blob = await createZip([{ path: './public//images/a.jpg', data: 'x' }]);
    const bytes = new Uint8Array(await blob.arrayBuffer());

    expect(readCentralDirectory(bytes, 1)[0]!.name).toBe('public/images/a.jpg');
  });

  it('produces a valid empty archive', async () => {
    const blob = await createZip([]);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    expect(bytes.length).toBe(22);
    expect(view.getUint32(0, true)).toBe(EOCD_SIGNATURE);
    expect(view.getUint16(10, true)).toBe(0);
  });
});

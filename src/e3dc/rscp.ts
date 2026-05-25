/**
 * RSCP protocol implementation for E3DC energy storage systems.
 *
 * Frame format (little-endian):
 *   [2B magic 0xDCE3] [2B ctrl 0x1100] [4B sec] [4B sec2=0] [2B ns] [2B payloadLen]
 *   [payload bytes] [4B CRC32]
 *
 * Item format within payload (little-endian):
 *   [4B tag] [1B type] [2B dataLen] [dataLen bytes data]
 *
 * Encryption: AES (Rijndael) CBC, 32-byte block size, key padded to 32 bytes with 0xFF,
 * IV initialized to 32×0xFF and chained between sends.
 */

import { createCipheriv, createDecipheriv } from "crypto";

// ── RSCP Tag constants ────────────────────────────────────────────────────────

export const Tag = {
  RSCP_REQ_AUTHENTICATION: 0x00000001,
  RSCP_AUTHENTICATION_USER: 0x00000002,
  RSCP_AUTHENTICATION_PASSWORD: 0x00000003,
  RSCP_AUTHENTICATION: 0x00800001,
  RSCP_GENERAL_ERROR: 0x00ffffff,

  EMS_REQ_POWER_PV: 0x01000001,
  EMS_REQ_POWER_BAT: 0x01000002,
  EMS_REQ_POWER_HOME: 0x01000003,
  EMS_REQ_POWER_GRID: 0x01000004,
  EMS_REQ_AUTARKY: 0x01000006,
  EMS_REQ_SELF_CONSUMPTION: 0x01000007,
  EMS_REQ_BAT_SOC: 0x01000008,

  EMS_POWER_PV: 0x01800001,
  EMS_POWER_BAT: 0x01800002,
  EMS_POWER_HOME: 0x01800003,
  EMS_POWER_GRID: 0x01800004,
  EMS_AUTARKY: 0x01800006,
  EMS_SELF_CONSUMPTION: 0x01800007,
  EMS_BAT_SOC: 0x01800008,

  // EMS extended request tags
  EMS_REQ_POWER_ADD: 0x01000005,
  EMS_REQ_COUPLING_MODE: 0x01000009,
  EMS_REQ_POWER_WB_ALL: 0x0100001f,
  EMS_REQ_POWER_WB_SOLAR: 0x01000020,
  EMS_REQ_STATUS: 0x01000040,
  EMS_REQ_BAT_CHARGE_LIMIT: 0x01000042,
  EMS_REQ_BAT_DISCHARGE_LIMIT: 0x01000046,
  EMS_REQ_REMAINING_BAT_CHARGE_POWER: 0x01000071,
  EMS_REQ_REMAINING_BAT_DISCHARGE_POWER: 0x01000072,
  EMS_REQ_EMERGENCY_POWER_STATUS: 0x01000073,

  // EMS extended response tags
  EMS_POWER_ADD: 0x01800005,
  EMS_COUPLING_MODE: 0x01800009,
  EMS_POWER_WB_ALL: 0x0180001f,
  EMS_POWER_WB_SOLAR: 0x01800020,
  EMS_STATUS: 0x01800040,
  EMS_BAT_CHARGE_LIMIT: 0x01800042,
  EMS_BAT_DISCHARGE_LIMIT: 0x01800046,
  EMS_REMAINING_BAT_CHARGE_POWER: 0x01800071,
  EMS_REMAINING_BAT_DISCHARGE_POWER: 0x01800072,
  EMS_EMERGENCY_POWER_STATUS: 0x01800073,

  // PVI request tags (0x020xxxxx)
  PVI_REQ_DATA: 0x02040000,
  PVI_INDEX: 0x02040001,
  PVI_VALUE: 0x02040005,
  PVI_REQ_ON_GRID: 0x02000001,
  PVI_REQ_STATE: 0x02000002,
  PVI_REQ_TEMPERATURE: 0x02000100,
  PVI_REQ_AC_POWER: 0x020ac001,
  PVI_REQ_AC_VOLTAGE: 0x020ac002,
  PVI_REQ_AC_CURRENT: 0x020ac003,
  PVI_REQ_AC_ENERGY_ALL: 0x020ac006,
  PVI_REQ_AC_ENERGY_DAY: 0x020ac008,
  PVI_REQ_AC_FREQUENCY: 0x020ac00a,
  PVI_REQ_DC_POWER: 0x020dc001,
  PVI_REQ_DC_VOLTAGE: 0x020dc002,
  PVI_REQ_DC_CURRENT: 0x020dc003,

  // PVI response tags (0x028xxxxx)
  PVI_DATA: 0x02840000,
  PVI_ON_GRID: 0x02800001,
  PVI_STATE: 0x02800002,
  PVI_TEMPERATURE: 0x02800100,
  PVI_AC_POWER: 0x028ac001,
  PVI_AC_VOLTAGE: 0x028ac002,
  PVI_AC_CURRENT: 0x028ac003,
  PVI_AC_ENERGY_ALL: 0x028ac006,
  PVI_AC_ENERGY_DAY: 0x028ac008,
  PVI_AC_FREQUENCY: 0x028ac00a,
  PVI_DC_POWER: 0x028dc001,
  PVI_DC_VOLTAGE: 0x028dc002,
  PVI_DC_CURRENT: 0x028dc003,

  // BAT request tags (0x030xxxxx)
  BAT_REQ_DATA: 0x03040000,
  BAT_INDEX: 0x03040001,
  BAT_REQ_RSOC: 0x03000001,
  BAT_REQ_MODULE_VOLTAGE: 0x03000002,
  BAT_REQ_CURRENT: 0x03000003,
  BAT_REQ_CHARGE_CYCLES: 0x03000008,
  BAT_REQ_TERMINAL_VOLTAGE: 0x03000009,
  BAT_REQ_STATUS_CODE: 0x0300000a,
  BAT_REQ_ERROR_CODE: 0x0300000b,
  BAT_REQ_DCB_COUNT: 0x0300000d,
  BAT_REQ_TRAINING_MODE: 0x03000021,

  // BAT response tags (0x038xxxxx)
  BAT_DATA: 0x03840000,
  BAT_RSOC: 0x03800001,
  BAT_MODULE_VOLTAGE: 0x03800002,
  BAT_CURRENT: 0x03800003,
  BAT_CHARGE_CYCLES: 0x03800008,
  BAT_TERMINAL_VOLTAGE: 0x03800009,
  BAT_STATUS_CODE: 0x0380000a,
  BAT_ERROR_CODE: 0x0380000b,
  BAT_DCB_COUNT: 0x0380000d,
  BAT_TRAINING_MODE: 0x03800021,

  // PM request tags (0x050xxxxx)
  PM_REQ_DATA: 0x05040000,
  PM_INDEX: 0x05040001,
  PM_REQ_POWER_L1: 0x05000001,
  PM_REQ_POWER_L2: 0x05000002,
  PM_REQ_POWER_L3: 0x05000003,
  PM_REQ_ACTIVE_PHASES: 0x05000004,
  PM_REQ_MODE: 0x05000005,
  PM_REQ_ENERGY_L1: 0x05000006,
  PM_REQ_ENERGY_L2: 0x05000007,
  PM_REQ_ENERGY_L3: 0x05000008,
  PM_REQ_ERROR_CODE: 0x0500000a,
  PM_REQ_VOLTAGE_L1: 0x05000011,
  PM_REQ_VOLTAGE_L2: 0x05000012,
  PM_REQ_VOLTAGE_L3: 0x05000013,
  PM_REQ_TYPE: 0x05000014,

  // PM response tags (0x058xxxxx)
  PM_DATA: 0x05840000,
  PM_POWER_L1: 0x05800001,
  PM_POWER_L2: 0x05800002,
  PM_POWER_L3: 0x05800003,
  PM_ACTIVE_PHASES: 0x05800004,
  PM_MODE: 0x05800005,
  PM_ENERGY_L1: 0x05800006,
  PM_ENERGY_L2: 0x05800007,
  PM_ENERGY_L3: 0x05800008,
  PM_ERROR_CODE: 0x0580000a,
  PM_VOLTAGE_L1: 0x05800011,
  PM_VOLTAGE_L2: 0x05800012,
  PM_VOLTAGE_L3: 0x05800013,
  PM_TYPE: 0x05800014,
} as const;

// ── RSCP Type constants ───────────────────────────────────────────────────────

export const Type = {
  NoneType: 0x00,
  Bool: 0x01,
  Char8: 0x02,
  UChar8: 0x03,
  Int16: 0x04,
  Uint16: 0x05,
  Int32: 0x06,
  Uint32: 0x07,
  Int64: 0x08,
  Uint64: 0x09,
  Float32: 0x0a,
  Double64: 0x0b,
  CString: 0x0d,
  Container: 0x0e,
} as const;

type RscpTag = number;
type RscpType = number;
type RscpValue = number | string | boolean | null | RscpItem[];
export type RscpItem = [RscpTag, RscpType, RscpValue];

// ── CRC32 (IEEE 802.3 / zlib compatible) ─────────────────────────────────────

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (CRC_TABLE[(crc ^ (buf[i] ?? 0)) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const MAGIC = 0xe3dc;
const CTRL = 0x0011;       // CRC enabled (bit 0x10 set)
const BLOCK_SIZE = 32;
const KEY_SIZE = 32;
const ITEM_HEADER_SIZE = 7;  // 4B tag + 1B type + 2B length
// Frame header: magic(H2) ctrl(H2) sec(I4) sec2(I4) ms(I4) payloadLen(H2) = 18 bytes
const FRAME_HEADER_SIZE = 18;

// ── Encryption ────────────────────────────────────────────────────────────────

export class RscpCrypto {
  private key: Buffer;
  private encryptIV: Buffer;
  private decryptIV: Buffer;

  constructor(rscpKey: string) {
    // Key padded to 32 bytes with 0xFF
    const keyBytes = Buffer.from(rscpKey, "utf-8");
    if (keyBytes.length > KEY_SIZE) throw new Error("RSCP key must be <= 32 bytes");
    this.key = Buffer.concat([keyBytes, Buffer.alloc(KEY_SIZE - keyBytes.length, 0xff)]);
    this.encryptIV = Buffer.alloc(BLOCK_SIZE, 0xff);
    this.decryptIV = Buffer.alloc(BLOCK_SIZE, 0xff);
  }

  encrypt(plain: Buffer): Buffer {
    // Pad to block boundary with zeros
    const padLen = BLOCK_SIZE - (plain.length % BLOCK_SIZE);
    const padded = padLen === BLOCK_SIZE ? plain : Buffer.concat([plain, Buffer.alloc(padLen, 0)]);

    // Node's AES-256-CBC uses 16-byte blocks; Rijndael CBC with 32-byte blocks is
    // equivalent to AES-256 when block size is 32. Node crypto does not support
    // 32-byte AES blocks natively, so we implement CBC manually over 32-byte chunks.
    const cipher = createCipheriv("aes-256-ecb", this.key, null);
    cipher.setAutoPadding(false);

    const blocks: Buffer[] = [];
    let iv = this.encryptIV;
    for (let offset = 0; offset < padded.length; offset += BLOCK_SIZE) {
      const block = padded.subarray(offset, offset + BLOCK_SIZE);
      const xored = xorBuffers(block, iv);
      // Node's ECB on 32-byte key with 16-byte blocks: feed two 16-byte halves together.
      // We encrypt the 32-byte block as two sequential 16-byte ECB blocks chained via XOR
      // to emulate a 32-byte CBC block (matches py3rijndael behavior).
      const enc = Buffer.concat([
        cipher.update(xored.subarray(0, 16)),
        cipher.update(xored.subarray(16, 32)),
      ]);
      blocks.push(enc);
      iv = enc;
    }
    this.encryptIV = iv;
    return Buffer.concat(blocks);
  }

  decrypt(enc: Buffer): Buffer {
    const decipher = createDecipheriv("aes-256-ecb", this.key, null);
    decipher.setAutoPadding(false);

    const blocks: Buffer[] = [];
    let iv = this.decryptIV;
    for (let offset = 0; offset < enc.length; offset += BLOCK_SIZE) {
      const block = enc.subarray(offset, offset + BLOCK_SIZE);
      const dec = Buffer.concat([
        decipher.update(block.subarray(0, 16)),
        decipher.update(block.subarray(16, 32)),
      ]);
      blocks.push(xorBuffers(dec, iv));
      iv = block;
    }
    this.decryptIV = iv;
    return Buffer.concat(blocks);
  }
}

function xorBuffers(a: Buffer, b: Buffer): Buffer {
  const out = Buffer.alloc(a.length);
  for (let i = 0; i < a.length; i++) {
    out[i] = (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return out;
}

// ── Encoding ──────────────────────────────────────────────────────────────────

export function encodeItem(tag: RscpTag, type: RscpType, value: RscpValue): Buffer {
  let dataBuf: Buffer;

  switch (type) {
    case Type.NoneType:
      dataBuf = Buffer.alloc(0);
      break;
    case Type.Bool:
      dataBuf = Buffer.alloc(1);
      dataBuf.writeUInt8(value ? 1 : 0, 0);
      break;
    case Type.UChar8:
      dataBuf = Buffer.alloc(1);
      dataBuf.writeUInt8(value as number, 0);
      break;
    case Type.Char8:
      dataBuf = Buffer.alloc(1);
      dataBuf.writeInt8(value as number, 0);
      break;
    case Type.Int16:
      dataBuf = Buffer.alloc(2);
      dataBuf.writeInt16LE(value as number, 0);
      break;
    case Type.Uint16:
      dataBuf = Buffer.alloc(2);
      dataBuf.writeUInt16LE(value as number, 0);
      break;
    case Type.Int32:
      dataBuf = Buffer.alloc(4);
      dataBuf.writeInt32LE(value as number, 0);
      break;
    case Type.Uint32:
      dataBuf = Buffer.alloc(4);
      dataBuf.writeUInt32LE(value as number, 0);
      break;
    case Type.Float32:
      dataBuf = Buffer.alloc(4);
      dataBuf.writeFloatLE(value as number, 0);
      break;
    case Type.Double64:
      dataBuf = Buffer.alloc(8);
      dataBuf.writeDoubleLE(value as number, 0);
      break;
    case Type.CString: {
      dataBuf = Buffer.from(value as string, "utf-8");
      break;
    }
    case Type.Container: {
      const items = value as RscpItem[];
      dataBuf = Buffer.concat(items.map((item) => encodeItem(item[0], item[1], item[2])));
      break;
    }
    default:
      throw new Error(`Unsupported RSCP type: 0x${type.toString(16)}`);
  }

  const header = Buffer.alloc(ITEM_HEADER_SIZE);
  header.writeUInt32LE(tag, 0);
  header.writeUInt8(type, 4);
  header.writeUInt16LE(dataBuf.length, 5);
  return Buffer.concat([header, dataBuf]);
}

export function encodeContainer(items: RscpItem[]): Buffer {
  return Buffer.concat(items.map((item) => encodeItem(item[0], item[1], item[2])));
}

// ── Framing ───────────────────────────────────────────────────────────────────

export function buildFrame(payload: Buffer): Buffer {
  const now = Date.now();
  const sec = Math.floor(now / 1000);
  const ms = now % 1000; // sub-second milliseconds (0–999), fits uint16

  // Python struct "<HHIIIH": magic(H2) ctrl(H2) sec(I4) sec2(I4) ms(I4) payloadLen(H2) = 18B
  // magic and ctrl use big-endian byte order (endian-swapped in the reference Python impl)
  const header = Buffer.alloc(FRAME_HEADER_SIZE);
  header.writeUInt16BE(MAGIC, 0);
  header.writeUInt16BE(CTRL, 2);
  header.writeUInt32LE(sec, 4);
  header.writeUInt32LE(0, 8);       // sec2 always 0
  header.writeUInt32LE(ms, 12);     // sub-second ms stored as uint32
  header.writeUInt16LE(payload.length, 16);

  const frameWithoutCrc = Buffer.concat([header, payload]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32LE(crc32(frameWithoutCrc), 0);
  return Buffer.concat([frameWithoutCrc, crcBuf]);
}

// ── Decoding ──────────────────────────────────────────────────────────────────

export function decodeFrame(data: Buffer): Buffer {
  const magic = data.readUInt16BE(0);
  const ctrl = data.readUInt16BE(2);

  if (magic !== MAGIC) throw new Error(`Bad RSCP magic: 0x${magic.toString(16)}`);

  const payloadLen = data.readUInt16LE(16);
  const headerSize = FRAME_HEADER_SIZE;
  const payload = data.subarray(headerSize, headerSize + payloadLen);

  if (ctrl & 0x0010) {
    const crcOffset = headerSize + payloadLen;
    const storedCrc = data.readUInt32LE(crcOffset);
    const computed = crc32(data.subarray(0, crcOffset));
    if (storedCrc !== computed) throw new Error("RSCP CRC mismatch");
  }

  return payload;
}

export function decodeItems(data: Buffer): RscpItem[] {
  const items: RscpItem[] = [];
  let offset = 0;

  while (offset + ITEM_HEADER_SIZE <= data.length) {
    const tag = data.readUInt32LE(offset);
    const type = data.readUInt8(offset + 4);
    const len = data.readUInt16LE(offset + 5);
    const valueStart = offset + ITEM_HEADER_SIZE;
    const valueBuf = data.subarray(valueStart, valueStart + len);

    items.push([tag, type, decodeValue(type, valueBuf)]);
    offset = valueStart + len;
  }

  return items;
}

function decodeValue(type: RscpType, buf: Buffer): RscpValue {
  switch (type) {
    case Type.NoneType:   return null;
    case Type.Bool:       return buf.readUInt8(0) !== 0;
    case Type.UChar8:     return buf.readUInt8(0);
    case Type.Char8:      return buf.readInt8(0);
    case Type.Int16:      return buf.readInt16LE(0);
    case Type.Uint16:     return buf.readUInt16LE(0);
    case Type.Int32:      return buf.readInt32LE(0);
    case Type.Uint32:     return buf.readUInt32LE(0);
    case Type.Float32:    return buf.readFloatLE(0);
    case Type.Double64:   return buf.readDoubleLE(0);
    case Type.CString:    return buf.toString("utf-8");
    case Type.Container:  return decodeItems(buf);
    default:              return null;
  }
}

export function findTag(items: RscpItem[], tag: RscpTag): RscpValue | undefined {
  for (const item of items) {
    if (item[0] === tag) return item[2];
    if (item[1] === Type.Container) {
      const found = findTag(item[2] as RscpItem[], tag);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

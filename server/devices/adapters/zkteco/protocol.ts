/**
 * ZKTeco Binary Protocol Implementation
 * بروتوكول ZKTeco الثنائي عبر TCP/IP
 *
 * المصدر: توثيق بروتوكول ZKTeco المفتوح المصدر
 * https://github.com/adrobinoga/zk-protocol
 *
 * بنية الحزمة (Packet Structure):
 * ┌────────────────────────────────────────────────────────┐
 * │ TCP PREFIX (8 bytes)                                   │
 * │  [0x50][0x50][0x82][0x7D]  ← Magic bytes (4)          │
 * │  [SIZE: uint32 LE]         ← حجم حزمة الأمر (4)       │
 * ├────────────────────────────────────────────────────────┤
 * │ COMMAND PACKET (8 + data bytes)                        │
 * │  [CMD:     uint16 LE]  ← كود الأمر (2)                │
 * │  [CHKSUM:  uint16 LE]  ← checksum (2)                 │
 * │  [SESSION: uint16 LE]  ← معرف الجلسة (2)              │
 * │  [REPLY:   uint16 LE]  ← عداد الردود (2)              │
 * │  [DATA: variable]      ← البيانات                     │
 * └────────────────────────────────────────────────────────┘
 */

// ============= أكواد الأوامر =============
export const CMD = {
  // اتصال وقطع
  CONNECT: 1000,
  EXIT: 1001,
  DISABLE_DEVICE: 1002,
  ENABLE_DEVICE: 1003,

  // ردود من الجهاز
  ACK_OK: 2000,
  ACK_ERROR: 2001,
  ACK_DATA: 2002,

  // بيانات
  PREPARE_DATA: 1500,
  DATA: 1501,
  FREE_DATA: 1502,

  // إعدادات الجهاز
  OPTIONS_RRQ: 11,     // قراءة إعداد معين
  GET_TIME: 201,       // وقت الجهاز
  SET_TIME: 202,

  // الموظفون
  USERTEMP_RRQ: 9,     // جلب قائمة الموظفين
  USERTEMP_WRQ: 8,     // كتابة موظف
  DELETE_USER: 18,

  // سجلات الحضور
  ATTLOG_RRQ: 12,      // جلب سجلات الحضور
  CLEAR_ATTLOG: 14,    // مسح سجلات الحضور

  // معلومات الجهاز
  GET_FREE_SIZES: 50,  // عدد المستخدمين والسجلات
} as const;

// حجم رأس الحزمة TCP
export const TCP_PREFIX_SIZE = 8;
export const CMD_HEADER_SIZE = 8;
export const PACKET_HEADER_SIZE = TCP_PREFIX_SIZE + CMD_HEADER_SIZE;

// ============= بناء الحزم =============

let _replyCounter = 0;

/** حساب checksum لحزمة الأمر */
function calcChecksum(buf: Buffer): number {
  let sum = 0;
  for (let i = 0; i < buf.length - 1; i += 2) {
    sum += buf.readUInt16LE(i);
  }
  if (buf.length % 2 !== 0) {
    sum += buf[buf.length - 1]!;
  }
  sum = (sum & 0xffff) + ((sum >> 16) & 0xffff);
  return (~sum) & 0xffff;
}

/**
 * بناء حزمة للإرسال إلى الجهاز
 */
export function buildPacket(
  cmd: number,
  sessionId: number,
  data?: Buffer
): Buffer {
  const dataLen = data ? data.length : 0;
  const cmdBuf = Buffer.alloc(CMD_HEADER_SIZE + dataLen);

  cmdBuf.writeUInt16LE(cmd, 0);
  cmdBuf.writeUInt16LE(0, 2);           // checksum placeholder
  cmdBuf.writeUInt16LE(sessionId, 4);
  cmdBuf.writeUInt16LE(_replyCounter++ & 0xffff, 6);
  if (data) data.copy(cmdBuf, 8);

  // احسب checksum وضعه في مكانه
  const chk = calcChecksum(cmdBuf);
  cmdBuf.writeUInt16LE(chk, 2);

  // أضف رأس TCP
  const tcpHeader = Buffer.alloc(TCP_PREFIX_SIZE);
  tcpHeader[0] = 0x50;
  tcpHeader[1] = 0x50;
  tcpHeader[2] = 0x82;
  tcpHeader[3] = 0x7d;
  tcpHeader.writeUInt32LE(cmdBuf.length, 4);

  return Buffer.concat([tcpHeader, cmdBuf]);
}

// ============= تحليل الحزم =============

export interface ParsedPacket {
  command: number;
  sessionId: number;
  replyId: number;
  data: Buffer;
}

/**
 * تحليل حزمة استجابة من الجهاز
 * يتجاهل رأس TCP ويستخرج محتوى الأمر
 */
export function parsePacket(buf: Buffer): ParsedPacket | null {
  // تحقق من الحجم الأدنى
  if (buf.length < PACKET_HEADER_SIZE) return null;

  // تحقق من magic bytes
  const isTCP =
    buf[0] === 0x50 && buf[1] === 0x50 &&
    buf[2] === 0x82 && buf[3] === 0x7d;

  let offset = 0;
  if (isTCP) {
    const payloadSize = buf.readUInt32LE(4);
    if (buf.length < TCP_PREFIX_SIZE + payloadSize) return null;
    offset = TCP_PREFIX_SIZE;
  }

  const command   = buf.readUInt16LE(offset + 0);
  const sessionId = buf.readUInt16LE(offset + 4);
  const replyId   = buf.readUInt16LE(offset + 6);
  const data      = buf.slice(offset + CMD_HEADER_SIZE);

  return { command, sessionId, replyId, data };
}

// ============= ترميز/فك ترميز الوقت =============

/**
 * فك ترميز وقت ZKTeco الخاص (uint32) إلى كائن Date
 * الصيغة: ((year-2000)*12*31 + (month-1)*31 + (day-1)) * 86400 + h*3600 + m*60 + s
 */
export function decodeZKTime(encoded: number): Date {
  let t = encoded;
  const second = t % 60; t = Math.floor(t / 60);
  const minute = t % 60; t = Math.floor(t / 60);
  const hour   = t % 24; t = Math.floor(t / 24);
  const day    = (t % 31) + 1; t = Math.floor(t / 31);
  const month  = (t % 12) + 1; t = Math.floor(t / 12);
  const year   = t + 2000;
  return new Date(year, month - 1, day, hour, minute, second);
}

/**
 * ترميز كائن Date إلى تنسيق وقت ZKTeco (uint32)
 */
export function encodeZKTime(date: Date): number {
  return (
    (((date.getFullYear() - 2000) * 12 * 31 +
      date.getMonth() * 31 +
      (date.getDate() - 1)) *
      86400) +
    date.getHours() * 3600 +
    date.getMinutes() * 60 +
    date.getSeconds()
  );
}

// ============= تحليل سجلات الحضور =============

/**
 * بنية سجل حضور واحد في الجهاز (16 بايت)
 *
 * [UID: 2B LE] [UserID: 9B null-term] [Verify: 1B] [Time: 4B LE] [Type: 1B] [reserved: 7B]
 * مجموع: 24 بايت (تنسيق جديد)
 */
const ATTLOG_RECORD_SIZE = 40; // بعض الموديلات تستخدم 40 بايت

export interface RawAttendanceRecord {
  userId: string;
  recordedAt: Date;
  inOutType: number;
  verifyType: number;
}

/** تحليل مخزن مؤقت يحتوي على سجلات حضور متعددة */
export function parseAttendanceLogs(data: Buffer): RawAttendanceRecord[] {
  const records: RawAttendanceRecord[] = [];

  // تحديد حجم السجل تلقائياً: إذا كان حجم البيانات قابلاً للقسمة على 40 نستخدم 40
  const recordSize = data.length % ATTLOG_RECORD_SIZE === 0 ? ATTLOG_RECORD_SIZE : 8;

  if (data.length < recordSize) return records;

  for (let offset = 0; offset + recordSize <= data.length; offset += recordSize) {
    try {
      // استخراج User ID (نص)
      let userIdEnd = offset + 2;
      while (userIdEnd < offset + 26 && data[userIdEnd] !== 0) userIdEnd++;
      const userId = data.slice(offset + 2, userIdEnd).toString("ascii").trim();
      if (!userId) continue;

      // استخراج الوقت (uint32 LE) في الموقع 26
      const timeEncoded = data.readUInt32LE(offset + 26);
      const recordedAt = decodeZKTime(timeEncoded);

      // التحقق من صحة التاريخ
      if (
        recordedAt.getFullYear() < 2000 ||
        recordedAt.getFullYear() > 2100
      ) continue;

      const verifyType = data[offset + 30] ?? 0;
      const inOutType  = data[offset + 31] ?? 0;

      records.push({ userId, recordedAt, inOutType, verifyType });
    } catch {
      // تجاهل سجل تالف والانتقال للتالي
    }
  }

  return records;
}

// ============= تحليل بيانات الموظفين =============

export interface RawEmployee {
  uid: number;
  userId: string;
  name: string;
  cardNumber: string;
  role: number;
}

/** تحليل مخزن مؤقت يحتوي على بيانات موظفين متعددة (72 بايت لكل موظف) */
export function parseEmployees(data: Buffer): RawEmployee[] {
  const employees: RawEmployee[] = [];
  const USER_RECORD_SIZE = 72;

  for (let offset = 0; offset + USER_RECORD_SIZE <= data.length; offset += USER_RECORD_SIZE) {
    try {
      const uid = data.readUInt16LE(offset);
      
      // استخراج User ID
      let idEnd = offset + 2;
      while (idEnd < offset + 11 && data[idEnd] !== 0) idEnd++;
      const userId = data.slice(offset + 2, idEnd).toString("ascii").trim();

      const role = data[offset + 11] ?? 0;

      // استخراج الاسم (24 بايت)
      let nameEnd = offset + 20;
      while (nameEnd < offset + 44 && data[nameEnd] !== 0) nameEnd++;
      const name = data.slice(offset + 20, nameEnd).toString("utf8").trim();

      // استخراج رقم البطاقة (uint32)
      const cardNumber = data.readUInt32LE(offset + 44).toString();

      if (!userId) continue;
      employees.push({ uid, userId, name: name || userId, cardNumber, role });
    } catch {
      // تجاهل سجل تالف
    }
  }

  return employees;
}

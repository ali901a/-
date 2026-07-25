/**
 * ZKTeco TCP/IP Adapter
 * تنفيذ IDeviceAdapter للتواصل مع أجهزة ZKTeco عبر بروتوكول TCP/IP الثنائي
 *
 * يستخدم بروتوكول ZKTeco المفتوح المصدر (ZK Push SDK Protocol).
 * لاستخدام SDK رسمي من ZKTeco، استبدل هذا الملف بمحول آخر يرث من IDeviceAdapter.
 */

import * as net from "net";
import type {
  IDeviceAdapter,
  DeviceConfig,
  DeviceEmployee,
  DeviceAttendanceRecord,
  DeviceInfo,
  ConnectionTestResult,
} from "../../core/types";
import {
  DeviceConnectionError,
  DeviceTimeoutError,
  DeviceNotConnectedError,
  DeviceProtocolError,
} from "../../core/errors";
import {
  CMD,
  buildPacket,
  parsePacket,
  parseAttendanceLogs,
  parseEmployees,
} from "./protocol";
import { getModelCapabilities } from "./models";

export class ZKTecoTCPAdapter implements IDeviceAdapter {
  private socket: net.Socket | null = null;
  private sessionId = 0;
  private _connected = false;
  private readonly capabilities;
  private readonly timeoutMs: number;

  constructor(private readonly config: DeviceConfig) {
    this.capabilities = getModelCapabilities(config.model);
    this.timeoutMs = (config.timeoutSeconds ?? 10) * 1000;
  }

  isConnected(): boolean {
    return this._connected && this.socket !== null && !this.socket.destroyed;
  }

  // ============= الاتصال =============

  async connect(): Promise<void> {
    if (this.isConnected()) return;

    return new Promise((resolve, reject) => {
      const sock = new net.Socket();
      const timer = setTimeout(() => {
        sock.destroy();
        reject(
          new DeviceTimeoutError(
            this.config.name,
            "connect",
            this.timeoutMs
          )
        );
      }, this.timeoutMs);

      sock.connect(this.config.port, this.config.ipAddress, async () => {
        clearTimeout(timer);
        this.socket = sock;

        try {
          await this._sendConnect();
          this._connected = true;
          console.log(
            `[ZKTeco] اتصل بـ ${this.config.name} (${this.config.ipAddress}:${this.config.port})`
          );
          resolve();
        } catch (err) {
          sock.destroy();
          this.socket = null;
          reject(err);
        }
      });

      sock.on("error", (err: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        this.socket = null;
        this._connected = false;
        reject(
          new DeviceConnectionError(
            this.config.name,
            this.config.ipAddress,
            err.message,
            err
          )
        );
      });

      sock.on("close", () => {
        this._connected = false;
        this.socket = null;
      });
    });
  }

  async disconnect(): Promise<void> {
    if (!this.socket) return;
    try {
      await this._sendCommand(CMD.EXIT);
    } catch {
      // تجاهل أخطاء قطع الاتصال
    } finally {
      this.socket?.destroy();
      this.socket = null;
      this._connected = false;
    }
  }

  // ============= اختبار الاتصال =============

  async testConnection(): Promise<ConnectionTestResult> {
    const start = Date.now();
    try {
      await this.connect();
      const deviceInfo = await this.getDeviceInfo();
      return {
        success: true,
        deviceInfo,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        success: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      await this.disconnect();
    }
  }

  // ============= معلومات الجهاز =============

  async getDeviceInfo(): Promise<DeviceInfo> {
    this._assertConnected();

    const results: DeviceInfo = {};

    // جلب معلومات الجهاز الأساسية
    const infoFields = [
      { key: "~DeviceName",    target: "deviceName" },
      { key: "~SerialNumber",  target: "serialNumber" },
      { key: "~FirmVer",       target: "firmwareVersion" },
      { key: "~Platform",      target: "platform" },
      { key: "~MAC",           target: "macAddress" },
    ] as const;

    for (const field of infoFields) {
      try {
        const data = await this._sendCommand(
          CMD.OPTIONS_RRQ,
          Buffer.from(field.key + "\x00")
        );
        if (data && data.length > 0) {
          const str = data.toString("utf8").replace(/\x00/g, "").trim();
          const eqIdx = str.indexOf("=");
          results[field.target] = eqIdx >= 0 ? str.slice(eqIdx + 1) : str;
        }
      } catch {
        // حقل غير متاح في هذا الموديل
      }
    }

    // جلب عدد المستخدمين والسجلات
    try {
      const sizeData = await this._sendCommand(CMD.GET_FREE_SIZES);
      if (sizeData && sizeData.length >= 80) {
        results.totalUsers       = sizeData.readUInt32LE(24);
        results.totalAttendance  = sizeData.readUInt32LE(40);
      }
    } catch {
      // بعض الموديلات لا تدعم هذا الأمر
    }

    return results;
  }

  // ============= الموظفون =============

  async getEmployees(): Promise<DeviceEmployee[]> {
    this._assertConnected();

    const rawData = await this._readLargeData(CMD.USERTEMP_RRQ);
    const rawEmployees = parseEmployees(rawData);

    return rawEmployees.map((e) => ({
      deviceUserId: e.userId,
      name: e.name,
      cardNumber: e.cardNumber !== "0" ? e.cardNumber : undefined,
      role: e.role,
    }));
  }

  // ============= سجلات الحضور =============

  async getAttendanceLogs(since?: Date): Promise<DeviceAttendanceRecord[]> {
    this._assertConnected();

    const rawData = await this._readLargeData(CMD.ATTLOG_RRQ);
    const rawRecords = parseAttendanceLogs(rawData);

    let records = rawRecords.map((r) => ({
      deviceUserId: r.userId,
      recordedAt: r.recordedAt,
      inOutType: r.inOutType,
      verifyType: r.verifyType,
    }));

    // تصفية حسب التاريخ للمزامنة التفاضلية
    if (since) {
      records = records.filter((r) => r.recordedAt > since);
    }

    return records;
  }

  // ============= أوامر داخلية =============

  private _assertConnected(): void {
    if (!this.isConnected()) {
      throw new DeviceNotConnectedError(this.config.name);
    }
  }

  /** إرسال أمر CMD_CONNECT وقراءة معرف الجلسة */
  private async _sendConnect(): Promise<void> {
    const packet = buildPacket(CMD.CONNECT, 0);
    const response = await this._sendRaw(packet);
    const parsed = parsePacket(response);

    if (!parsed) {
      throw new DeviceProtocolError(this.config.name, "لم يتم استقبال رد على CMD_CONNECT");
    }

    if (parsed.command !== CMD.ACK_OK) {
      throw new DeviceProtocolError(
        this.config.name,
        `CMD_CONNECT: رد غير متوقع: 0x${parsed.command.toString(16)}`
      );
    }

    this.sessionId = parsed.sessionId;
  }

  /** إرسال أمر وانتظار الرد */
  private async _sendCommand(cmd: number, data?: Buffer): Promise<Buffer> {
    const packet = buildPacket(cmd, this.sessionId, data);
    const response = await this._sendRaw(packet);
    const parsed = parsePacket(response);

    if (!parsed) {
      throw new DeviceProtocolError(this.config.name, `لا يوجد رد على الأمر 0x${cmd.toString(16)}`);
    }

    if (parsed.command === CMD.ACK_ERROR) {
      throw new DeviceProtocolError(
        this.config.name,
        `الأمر 0x${cmd.toString(16)} أعاد ACK_ERROR`
      );
    }

    return parsed.data;
  }

  /**
   * جلب بيانات كبيرة (موظفين/سجلات) من الجهاز
   * الجهاز يرسل CMD_PREPARE_DATA أولاً ثم CMD_DATA ثم CMD_FREE_DATA
   */
  private async _readLargeData(cmd: number): Promise<Buffer> {
    const packet = buildPacket(cmd, this.sessionId);
    const firstResponse = await this._sendRaw(packet);
    const firstParsed = parsePacket(firstResponse);

    if (!firstParsed) {
      throw new DeviceProtocolError(this.config.name, "لا يوجد رد على طلب البيانات الكبيرة");
    }

    // إذا رد بـ ACK_OK مباشرة + بيانات
    if (firstParsed.command === CMD.ACK_OK) {
      return firstParsed.data;
    }

    // إذا رد بـ PREPARE_DATA: الجهاز سيرسل البيانات على دفعات
    if (firstParsed.command === CMD.PREPARE_DATA) {
      return await this._collectChunkedData(firstParsed.data);
    }

    if (firstParsed.command === CMD.ACK_ERROR) {
      return Buffer.alloc(0); // الجهاز ليس لديه بيانات
    }

    return firstParsed.data;
  }

  /** تجميع البيانات المجزأة من الجهاز */
  private async _collectChunkedData(prepareData: Buffer): Promise<Buffer> {
    const totalSize =
      prepareData.length >= 4 ? prepareData.readUInt32LE(0) : 0;
    const chunks: Buffer[] = [];
    let received = 0;

    while (received < totalSize) {
      const chunk = await this._receiveRaw();
      const parsed = parsePacket(chunk);
      if (!parsed) break;

      if (parsed.command === CMD.DATA) {
        chunks.push(parsed.data);
        received += parsed.data.length;
      } else if (parsed.command === CMD.FREE_DATA) {
        break;
      } else {
        break;
      }
    }

    // إرسال تأكيد استلام البيانات
    try {
      const ack = buildPacket(CMD.ACK_OK, this.sessionId);
      this.socket?.write(ack);
    } catch { /* تجاهل */ }

    return Buffer.concat(chunks);
  }

  /** إرسال حزمة خام وانتظار رد */
  private _sendRaw(packet: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new DeviceNotConnectedError(this.config.name));
      }

      const timer = setTimeout(() => {
        reject(new DeviceTimeoutError(this.config.name, "sendRaw", this.timeoutMs));
      }, this.timeoutMs);

      this.socket.once("data", (data: Buffer) => {
        clearTimeout(timer);
        resolve(data);
      });

      this.socket.once("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.socket.write(packet);
    });
  }

  /** استقبال حزمة خام بدون إرسال */
  private _receiveRaw(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new DeviceNotConnectedError(this.config.name));
      }

      const timer = setTimeout(() => {
        reject(new DeviceTimeoutError(this.config.name, "receiveRaw", this.timeoutMs));
      }, this.timeoutMs);

      this.socket.once("data", (data: Buffer) => {
        clearTimeout(timer);
        resolve(data);
      });

      this.socket.once("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}

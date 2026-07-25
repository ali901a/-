/**
 * المحاكي - SimulatedAdapter
 * محول وهمي للاختبار بدون جهاز حقيقي
 * يولّد بيانات واقعية لاختبار تدفق المزامنة الكامل
 */

import type {
  IDeviceAdapter,
  DeviceConfig,
  DeviceEmployee,
  DeviceAttendanceRecord,
  DeviceInfo,
  ConnectionTestResult,
} from "../core/types";

export class SimulatedAdapter implements IDeviceAdapter {
  private _connected = false;

  constructor(private readonly config: DeviceConfig) {}

  isConnected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    await this._delay(150);
    this._connected = true;
    console.log(`[SimulatedAdapter] اتصال وهمي بـ ${this.config.name}`);
  }

  async disconnect(): Promise<void> {
    await this._delay(50);
    this._connected = false;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    return {
      success: true,
      latencyMs: 12,
      deviceInfo: await this.getDeviceInfo(),
    };
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      deviceName: `Simulated ${this.config.model}`,
      serialNumber: `SIM-${this.config.id}-TEST`,
      firmwareVersion: "6.60 Mar 25 2019",
      platform: "ZEM800",
      macAddress: "00:17:61:AB:CD:EF",
      totalUsers: 10,
      totalAttendance: 100,
    };
  }

  async getEmployees(): Promise<DeviceEmployee[]> {
    await this._delay(200);
    return [
      { deviceUserId: "1", name: "أحمد محمد العلي",    role: 0 },
      { deviceUserId: "2", name: "فاطمة خالد الحسن",   role: 0 },
      { deviceUserId: "3", name: "محمد سالم الراشد",   role: 0 },
      { deviceUserId: "4", name: "نورة عبدالله المطيري", role: 0 },
      { deviceUserId: "5", name: "خالد إبراهيم الشمري", role: 14 },
      { deviceUserId: "6", name: "سارة علي القحطاني",  role: 0 },
      { deviceUserId: "7", name: "عبدالرحمن يوسف",     role: 0 },
      { deviceUserId: "8", name: "منى حسن العمري",     role: 0 },
      { deviceUserId: "9", name: "طارق محمود الدوسري", role: 0 },
      { deviceUserId: "10", name: "ريم سعود الغامدي",  role: 0 },
    ];
  }

  async getAttendanceLogs(since?: Date): Promise<DeviceAttendanceRecord[]> {
    await this._delay(300);

    const now = new Date();
    const records: DeviceAttendanceRecord[] = [];

    // توليد سجلات للأيام الثلاثة الماضية
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const day = new Date(now);
      day.setDate(day.getDate() - dayOffset);

      for (let userId = 1; userId <= 8; userId++) {
        // دخول في الصباح (8:00 - 8:30)
        const checkIn = new Date(day);
        checkIn.setHours(8, Math.floor(Math.random() * 30), 0, 0);

        // خروج بعد الظهر (16:00 - 17:00)
        const checkOut = new Date(day);
        checkOut.setHours(16, Math.floor(Math.random() * 60), 0, 0);

        if (since && checkIn <= since) continue;

        records.push({
          deviceUserId: userId.toString(),
          recordedAt: checkIn,
          inOutType: 0, // دخول
          verifyType: 1,
        });

        if (!since || checkOut > since) {
          records.push({
            deviceUserId: userId.toString(),
            recordedAt: checkOut,
            inOutType: 1, // خروج
            verifyType: 1,
          });
        }
      }
    }

    return records.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  }

  private _delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

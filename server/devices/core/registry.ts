/**
 * سجل محولات الأجهزة
 *
 * يتيح إضافة محولات جديدة لأي علامة تجارية أو بروتوكول دون تعديل بقية النظام.
 * كل محول يُسجّل نفسه عند الاستيراد.
 */

import type { AdapterDescriptor, DeviceConfig, IDeviceAdapter } from "./types";

class DeviceAdapterRegistry {
  private readonly adapters: AdapterDescriptor[] = [];

  /**
   * تسجيل محول جديد
   * @example
   * registry.register({
   *   brand: "zkteco",
   *   models: ["*"],          // يدعم جميع موديلات ZKTeco
   *   protocol: "tcp",
   *   description: "ZKTeco TCP/IP Binary Protocol",
   *   factory: (cfg) => new ZKTecoTCPAdapter(cfg),
   * });
   */
  register(descriptor: AdapterDescriptor): void {
    this.adapters.push(descriptor);
    console.log(
      `[DeviceRegistry] محول مسجل: ${descriptor.brand} / ${descriptor.models.join(",")} / ${descriptor.protocol}`
    );
  }

  /**
   * الحصول على محول مناسب للجهاز
   * يبحث بالترتيب: brand + model + protocol → brand + '*' + protocol
   */
  getAdapter(config: DeviceConfig): IDeviceAdapter {
    const brand = config.brand.toLowerCase();
    const model = config.model.toLowerCase();
    const protocol = config.protocol.toLowerCase();

    // محاولة مطابقة دقيقة للموديل أولاً
    let descriptor = this.adapters.find(
      (a) =>
        a.brand === brand &&
        a.protocol === protocol &&
        (a.models.includes(model) || a.models.includes("*"))
    );

    // fallback: أي محول بنفس العلامة التجارية والبروتوكول
    if (!descriptor) {
      descriptor = this.adapters.find(
        (a) => a.brand === brand && a.protocol === protocol
      );
    }

    // fallback للمحاكاة
    if (!descriptor && protocol === "simulated") {
      descriptor = this.adapters.find((a) => a.protocol === "simulated");
    }

    if (!descriptor) {
      const available = this.adapters
        .map((a) => `${a.brand}/${a.protocol}`)
        .join(", ");
      throw new Error(
        `لا يوجد محول مسجل للجهاز: brand="${brand}", protocol="${protocol}". ` +
          `المحولات المتاحة: ${available || "لا يوجد"}`
      );
    }

    return descriptor.factory(config);
  }

  /** قائمة جميع المحولات المسجلة */
  listRegistered(): Array<Omit<AdapterDescriptor, "factory">> {
    return this.adapters.map(({ brand, models, protocol, description }) => ({
      brand,
      models,
      protocol,
      description,
    }));
  }
}

/** سجل عالمي مشترك */
export const registry = new DeviceAdapterRegistry();

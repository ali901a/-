/**
 * تسجيل جميع محولات الأجهزة في السجل المركزي
 * أضف هنا أي محول جديد لعلامة تجارية أخرى
 */

import { registry } from "../core/registry";
import { ZKTecoTCPAdapter } from "./zkteco/ZKTecoTCPAdapter";
import { SimulatedAdapter } from "./SimulatedAdapter";

// تسجيل محول ZKTeco TCP/IP
registry.register({
  brand: "zkteco",
  models: ["*"],
  protocol: "tcp",
  description: "ZKTeco Binary Protocol over TCP/IP (ZK Push SDK)",
  factory: (cfg) => new ZKTecoTCPAdapter(cfg),
});

// تسجيل المحاكي (للاختبار بدون جهاز)
registry.register({
  brand: "zkteco",
  models: ["*"],
  protocol: "simulated",
  description: "Simulated ZKTeco device for testing",
  factory: (cfg) => new SimulatedAdapter(cfg),
});

registry.register({
  brand: "other",
  models: ["*"],
  protocol: "simulated",
  description: "Simulated generic device for testing",
  factory: (cfg) => new SimulatedAdapter(cfg),
});

export { registry };

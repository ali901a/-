---
name: Device Integration Layer
description: Architecture and gotchas for the ZKTeco device adapter system added to the attendance project.
---

# Device Integration Layer

## Architecture
- `server/devices/core/types.ts` — `IDeviceAdapter` interface; all adapters implement this
- `server/devices/core/registry.ts` — `AdapterRegistry` singleton; adapters self-register at import time via `server/devices/adapters/index.ts`
- `server/devices/adapters/zkteco/ZKTecoTCPAdapter.ts` — ZKTeco binary protocol over TCP; handles connect/session/large-data chunking
- `server/devices/adapters/SimulatedAdapter.ts` — fake device for testing without hardware
- `server/devices/SyncService.ts` — incremental & full sync; duplicate check is ±1 minute window in `isDuplicateAttendance()`
- `server/devices/DeviceManager.ts` — only file the rest of the system should import; starts auto-sync on server boot

## DB tables
`devices`, `deviceSyncLogs`, `deviceEmployeeMappings` — added to `drizzle/schema.ts`.

**Why:** `drizzle-kit generate` and `push` both fail silently or error in non-TTY shells when schema conflicts exist. Applied via `scripts/apply-device-schema.ts` (direct SQL via pg Pool). Run this script whenever new device-related columns are added.

## Adding a new device brand
1. Create `server/devices/adapters/<brand>/<BrandAdapter>.ts` implementing `IDeviceAdapter`
2. Register in `server/devices/adapters/index.ts` with `registry.register({ brand, models, protocol, factory })`
3. No other files need to change.

## ZKTeco binary protocol notes
- TCP prefix: `50 50 82 7D` + uint32_LE payload size
- Command packet: cmd(2) + checksum(2) + sessionId(2) + replyId(2) + data
- Time encoding: `((year-2000)*12*31 + (month-1)*31 + (day-1)) * 86400 + h*3600 + m*60 + s`
- Large data (attendance/users): device replies with CMD_PREPARE_DATA (1500) then CMD_DATA (1501) chunks
- Exact attendance record size varies by firmware (40 bytes is most common)

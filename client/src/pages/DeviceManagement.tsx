import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, RefreshCw, Wifi, WifiOff, Trash2, Edit2, Play,
  Loader2, CheckCircle2, XCircle, AlertCircle, Link2, Users,
  Activity, Settings, ChevronRight, Search, ArrowUpDown, AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Protocol = "tcp" | "sdk" | "simulated";
type Brand = "zkteco" | "other";

interface DeviceForm {
  deviceId: string;
  name: string;
  brand: Brand;
  model: string;
  protocol: Protocol;
  ipAddress: string;
  port: number;
  timeoutSeconds: number;
  password: string;
  location: string;
  branch: string;
  notes: string;
  isActive: boolean;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
}

const DEFAULT_FORM: DeviceForm = {
  deviceId: "",
  name: "",
  brand: "zkteco",
  model: "generic",
  protocol: "tcp",
  ipAddress: "",
  port: 4370,
  timeoutSeconds: 10,
  password: "",
  location: "",
  branch: "",
  notes: "",
  isActive: true,
  autoSyncEnabled: true,
  syncIntervalMinutes: 30,
};

const ZKTECO_MODELS = [
  "generic", "k14", "k20", "k40", "f18", "f22", "uface202", "uface800",
];

function statusBadge(status?: string | null) {
  if (!status) return <Badge variant="outline" className="text-xs">لم تتم مزامنة</Badge>;
  if (status === "success") return <Badge className="bg-emerald-500 text-xs">ناجح</Badge>;
  if (status === "partial") return <Badge className="bg-amber-500 text-xs">جزئي</Badge>;
  if (status === "failed") return <Badge className="bg-red-500 text-xs">فشل</Badge>;
  return <Badge variant="outline" className="text-xs">{status}</Badge>;
}

function formatDuration(ms?: number | null) {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(d?: Date | string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("ar-SA", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function DeviceManagement() {
  const [tab, setTab] = useState("devices");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [protocolFilter, setProtocolFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DeviceForm>(DEFAULT_FORM);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkEmployeeId, setLinkEmployeeId] = useState<string>("");
  const [linkMappingId, setLinkMappingId] = useState<number | null>(null);

  const devicesQ = trpc.devices.list.useQuery();
  const employeesQ = trpc.employees.list.useQuery();
  const syncLogsQ = trpc.devices.recentSyncLogs.useQuery({ limit: 30 });
  const connectionErrorsQ = trpc.devices.connectionErrors.useQuery({ limit: 50 });
  const mappingsQ = trpc.devices.getMappings.useQuery(
    { deviceId: selectedDevice! },
    { enabled: selectedDevice !== null }
  );

  const createM = trpc.devices.create.useMutation({ onSuccess: () => { devicesQ.refetch(); toast.success("تم إضافة الجهاز"); closeDialog(); } });
  const updateM = trpc.devices.update.useMutation({ onSuccess: () => { devicesQ.refetch(); toast.success("تم حفظ التعديلات"); closeDialog(); } });
  const deleteM = trpc.devices.delete.useMutation({ onSuccess: () => { devicesQ.refetch(); toast.success("تم حذف الجهاز"); } });
  const testM = trpc.devices.testConnection.useMutation();
  const syncM = trpc.devices.sync.useMutation({ onSuccess: (r) => { devicesQ.refetch(); syncLogsQ.refetch(); toast.success(`اكتملت المزامنة: ${r.attendanceImported} سجل جديد`); } });
  const linkM = trpc.devices.linkEmployee.useMutation({ onSuccess: () => { mappingsQ.refetch(); toast.success("تم الربط"); setLinkDialogOpen(false); } });

  function openCreate() { setForm(DEFAULT_FORM); setEditingId(null); setDialogOpen(true); }
  type DeviceRow = NonNullable<typeof devicesQ.data>[number];

  function openEdit(d: DeviceRow) {
    setForm({
      name: d.name,
      deviceId: d.deviceId ?? "",
      brand: d.brand as Brand,
      model: d.model,
      protocol: d.protocol as Protocol,
      ipAddress: d.ipAddress,
      port: d.port,
      timeoutSeconds: d.timeoutSeconds,
      password: d.password ?? "",
      location: d.location ?? "",
      branch: d.branch ?? "",
      notes: d.notes ?? "",
      isActive: d.isActive,
      autoSyncEnabled: d.autoSyncEnabled,
      syncIntervalMinutes: d.syncIntervalMinutes,
    });
    setEditingId(d.id);
    setDialogOpen(true);
  }
  function closeDialog() { setDialogOpen(false); setEditingId(null); }

  function handleSave() {
    const payload = {
      ...form,
      password: form.password || undefined,
      deviceId: form.deviceId || undefined,
      location: form.location || undefined,
      branch: form.branch || undefined,
      notes: form.notes || undefined,
    };
    if (editingId) {
      updateM.mutate({ id: editingId, ...payload });
    } else {
      createM.mutate(payload);
    }
  }

  async function handleTest(id: number) {
    setTestingId(id);
    try {
      const result = await testM.mutateAsync({ id });
      if (result.success) {
        toast.success(`اتصال ناجح! الجهاز: ${result.deviceInfo?.deviceName ?? "غير محدد"} — زمن الاستجابة: ${result.latencyMs}ms`);
      } else {
        toast.error(`فشل الاتصال: ${result.error}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTestingId(null);
    }
  }

  async function handleSync(id: number) {
    setSyncingId(id);
    try {
      await syncM.mutateAsync({ id, type: "incremental" });
    } finally {
      setSyncingId(null);
    }
  }

  function openLinkDialog(mappingId: number) {
    setLinkMappingId(mappingId);
    setLinkEmployeeId("");
    setLinkDialogOpen(true);
  }

  const devices = devicesQ.data ?? [];
  const mappings = mappingsQ.data ?? [];
  const syncLogs = syncLogsQ.data ?? [];
  const connectionErrors = connectionErrorsQ.data ?? [];
  const employees = employeesQ.data ?? [];
  const saving = createM.isPending || updateM.isPending;
  const filteredDevices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return [...devices]
      .filter((device) => {
        const haystack = [device.name, device.deviceId, device.model, device.ipAddress, device.branch, device.location]
          .filter(Boolean).join(" ").toLocaleLowerCase();
        const matchesSearch = !query || haystack.includes(query);
        const matchesStatus = statusFilter === "all" || device.connectionStatus === statusFilter;
        const matchesProtocol = protocolFilter === "all" || device.protocol === protocolFilter;
        return matchesSearch && matchesStatus && matchesProtocol;
      })
      .sort((a, b) => {
        if (sortBy === "lastConnection") {
          return (b.lastConnectionAt ? new Date(b.lastConnectionAt).getTime() : 0) -
            (a.lastConnectionAt ? new Date(a.lastConnectionAt).getTime() : 0);
        }
        if (sortBy === "lastSync") {
          return (b.lastSyncAt ? new Date(b.lastSyncAt).getTime() : 0) -
            (a.lastSyncAt ? new Date(a.lastSyncAt).getTime() : 0);
        }
        return a.name.localeCompare(b.name, "ar");
      });
  }, [devices, search, statusFilter, protocolFilter, sortBy]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* رأس الصفحة */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-right">إدارة أجهزة البصمة</h1>
            <p className="text-muted-foreground text-sm text-right mt-1">
              إدارة أجهزة ZKTeco والمزامنة التلقائية لسجلات الحضور
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة جهاز
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="devices">الأجهزة</TabsTrigger>
            <TabsTrigger value="mappings">ربط الموظفين</TabsTrigger>
            <TabsTrigger value="logs">سجلات المزامنة</TabsTrigger>
            <TabsTrigger value="errors">أخطاء الاتصال</TabsTrigger>
          </TabsList>

          {/* ============= الأجهزة ============= */}
          <TabsContent value="devices" className="mt-4">
            <div className="flex flex-wrap items-center gap-3 mb-4 rounded-xl border bg-card p-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pr-9" placeholder="ابحث بالاسم أو Device ID أو IP أو الفرع..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="حالة الاتصال" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="connected">متصل</SelectItem>
                  <SelectItem value="error">خطأ</SelectItem>
                  <SelectItem value="unknown">غير معروف</SelectItem>
                </SelectContent>
              </Select>
              <Select value={protocolFilter} onValueChange={setProtocolFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="البروتوكول" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل البروتوكولات</SelectItem>
                  <SelectItem value="tcp">TCP/IP</SelectItem>
                  <SelectItem value="sdk">SDK</SelectItem>
                  <SelectItem value="simulated">محاكاة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[170px]"><ArrowUpDown className="ml-2 h-4 w-4" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">ترتيب الاسم</SelectItem>
                  <SelectItem value="lastConnection">آخر اتصال</SelectItem>
                  <SelectItem value="lastSync">آخر مزامنة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {devicesQ.isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : devices.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لا توجد أجهزة مضافة</p>
                <p className="text-sm mt-1">أضف جهاز ZKTeco للبدء في استيراد سجلات الحضور</p>
                <Button onClick={openCreate} variant="outline" className="mt-4 gap-2">
                  <Plus className="w-4 h-4" /> إضافة جهاز
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDevices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border rounded-xl">
                    لا توجد أجهزة مطابقة للفلاتر الحالية
                  </div>
                ) : filteredDevices.map((device) => (
                  <div key={device.id} className="border rounded-xl p-4 bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${device.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-muted text-muted-foreground"}`}>
                          {device.isActive ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{device.name}</h3>
                            {!device.isActive && <Badge variant="outline" className="text-xs">معطّل</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {device.ipAddress}:{device.port} · {device.model.toUpperCase()} · {device.protocol.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {device.branch || device.location || "بدون فرع"} {device.deviceId && `· Device ID: ${device.deviceId}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-muted-foreground text-xs">آخر مزامنة:</span>
                            {statusBadge(device.lastSyncStatus)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(device.lastSyncAt)}
                          </p>
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <span className={`h-2 w-2 rounded-full ${device.connectionStatus === "connected" ? "bg-emerald-500" : device.connectionStatus === "error" ? "bg-red-500" : "bg-slate-400"}`} />
                            <span className="text-xs text-muted-foreground">
                              {device.connectionStatus === "connected" ? "متصل" : device.connectionStatus === "error" ? "خطأ اتصال" : "غير معروف"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">آخر اتصال: {formatDate(device.lastConnectionAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                      <Button
                        size="sm" variant="outline" className="gap-1.5"
                        onClick={() => handleTest(device.id)}
                        disabled={testingId === device.id}
                      >
                        {testingId === device.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Activity className="w-3.5 h-3.5" />}
                        اختبار الاتصال
                      </Button>

                      <Button
                        size="sm" variant="outline" className="gap-1.5"
                        onClick={() => handleSync(device.id)}
                        disabled={syncingId === device.id}
                      >
                        {syncingId === device.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <RefreshCw className="w-3.5 h-3.5" />}
                        مزامنة الآن
                      </Button>

                      <Button
                        size="sm" variant="outline" className="gap-1.5"
                        onClick={() => { setSelectedDevice(device.id); setTab("mappings"); }}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        الموظفون
                      </Button>

                      <Button size="sm" variant="ghost" onClick={() => openEdit(device)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف الجهاز "${device.name}"؟`)) {
                            deleteM.mutate({ id: device.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============= ربط الموظفين ============= */}
          <TabsContent value="mappings" className="mt-4">
            <div className="space-y-4">
              {/* اختيار الجهاز */}
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium whitespace-nowrap">الجهاز:</Label>
                <Select
                  value={selectedDevice?.toString() ?? ""}
                  onValueChange={(v) => setSelectedDevice(parseInt(v))}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="اختر جهازاً..." />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDevice === null ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>اختر جهازاً لعرض الموظفين المستوردين منه</p>
                </div>
              ) : mappingsQ.isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
              ) : mappings.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>لا توجد بيانات موظفين من هذا الجهاز بعد</p>
                  <p className="text-sm mt-1">قم بمزامنة الجهاز لاستيراد قائمة الموظفين</p>
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم في الجهاز</TableHead>
                        <TableHead className="text-right">رقم في الجهاز</TableHead>
                        <TableHead className="text-right">الموظف في النظام</TableHead>
                        <TableHead className="text-right">الإجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.map((m) => {
                        const emp = employees.find((e) => e.id === m.employeeId);
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.deviceUserName ?? "-"}</TableCell>
                            <TableCell className="text-muted-foreground">{m.deviceUserId}</TableCell>
                            <TableCell>
                              {emp ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span>{emp.name}</span>
                                  <span className="text-muted-foreground text-xs">({emp.employeeNumber})</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-amber-600">
                                  <AlertCircle className="w-4 h-4" />
                                  <span className="text-sm">غير مربوط</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
                                onClick={() => openLinkDialog(m.id)}
                              >
                                <Link2 className="w-3 h-3" />
                                {emp ? "تغيير الربط" : "ربط بموظف"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ============= أخطاء الاتصال ============= */}
          <TabsContent value="errors" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => connectionErrorsQ.refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
                تحديث
              </Button>
              <h3 className="font-medium text-right">سجل أخطاء الاتصال</h3>
            </div>
            {connectionErrorsQ.isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : connectionErrors.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border rounded-xl">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-70" />
                <p>لا توجد أخطاء اتصال مسجلة</p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الجهاز</TableHead>
                      <TableHead className="text-right">العملية</TableHead>
                      <TableHead className="text-right">الخطأ</TableHead>
                      <TableHead className="text-right">وقت الخطأ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectionErrors.map((error) => {
                      const device = devices.find((d) => d.id === error.deviceId);
                      return (
                        <TableRow key={error.id}>
                          <TableCell className="font-medium">{device?.name ?? `#${error.deviceId}`}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{error.operation}</TableCell>
                          <TableCell className="max-w-[420px]">
                            <div className="flex items-start gap-2 text-destructive text-sm">
                              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                              <span className="break-words">{error.message}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(error.occurredAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* ============= سجلات المزامنة ============= */}
          <TabsContent value="logs" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => syncLogsQ.refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
                تحديث
              </Button>
              <h3 className="font-medium text-right">آخر عمليات المزامنة</h3>
            </div>

            {syncLogsQ.isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : syncLogs.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>لا توجد سجلات مزامنة حتى الآن</p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الجهاز</TableHead>
                      <TableHead className="text-right">نوع المزامنة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">موظفون</TableHead>
                      <TableHead className="text-right">سجلات حضور</TableHead>
                      <TableHead className="text-right">مكررة</TableHead>
                      <TableHead className="text-right">المدة</TableHead>
                      <TableHead className="text-right">الوقت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log) => {
                      const device = devices.find((d) => d.id === log.deviceId);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium text-sm">
                            {device?.name ?? `#${log.deviceId}`}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.syncType === "full" ? "كاملة" :
                             log.syncType === "incremental" ? "تفاضلية" :
                             log.syncType === "employees_only" ? "موظفون فقط" :
                             "حضور فقط"}
                          </TableCell>
                          <TableCell>
                            {log.status === "success" ? (
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs">ناجح</span>
                              </div>
                            ) : log.status === "partial" ? (
                              <div className="flex items-center gap-1.5 text-amber-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs">جزئي</span>
                              </div>
                            ) : log.status === "running" ? (
                              <div className="flex items-center gap-1.5 text-blue-600">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs">جارٍ</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-destructive">
                                <XCircle className="w-4 h-4" />
                                <span className="text-xs">فشل</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm">{log.employeesImported}</TableCell>
                          <TableCell className="text-center text-sm">{log.attendanceImported}</TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">{log.duplicatesSkipped}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDuration(log.durationMs)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(log.startedAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ============= نافذة إضافة/تعديل الجهاز ============= */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingId ? "تعديل الجهاز" : "إضافة جهاز بصمة"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Device ID</Label>
                <Input
                  dir="ltr"
                  placeholder="مثال: ZK-001"
                  value={form.deviceId}
                  onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>اسم الجهاز *</Label>
                <Input
                  placeholder="مثل: جهاز المدخل الرئيسي"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>الموقع</Label>
                <Input
                  placeholder="مثل: المبنى A - الطابق الأول"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>الفرع المرتبط</Label>
                <Input
                  placeholder="مثال: الفرع الرئيسي"
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>العلامة التجارية</Label>
                <Select value={form.brand} onValueChange={(v: Brand) => setForm({ ...form, brand: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zkteco">ZKTeco</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الموديل</Label>
                <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ZKTECO_MODELS.map((m) => (
                      <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>البروتوكول</Label>
                <Select value={form.protocol} onValueChange={(v: Protocol) => setForm({ ...form, protocol: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tcp">TCP/IP</SelectItem>
                    <SelectItem value="simulated">محاكاة (اختبار)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>عنوان IP *</Label>
                <Input
                  placeholder="192.168.1.201"
                  dir="ltr"
                  value={form.ipAddress}
                  onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>المنفذ</Label>
                <Input
                  type="number" min={1} max={65535}
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 4370 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>كلمة المرور (اختياري)</Label>
                <Input
                  type="password" placeholder="0000"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>مهلة الاتصال (ثانية)</Label>
                <Input
                  type="number" min={1} max={60}
                  value={form.timeoutSeconds}
                  onChange={(e) => setForm({ ...form, timeoutSeconds: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Switch
                  checked={form.autoSyncEnabled}
                  onCheckedChange={(v) => setForm({ ...form, autoSyncEnabled: v })}
                />
                <Label>تفعيل المزامنة التلقائية</Label>
              </div>

              {form.autoSyncEnabled && (
                <div className="space-y-1.5">
                  <Label>فترة المزامنة (بالدقائق)</Label>
                  <Input
                    type="number" min={5} max={1440}
                    value={form.syncIntervalMinutes}
                    onChange={(e) => setForm({ ...form, syncIntervalMinutes: parseInt(e.target.value) || 30 })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <Label>الجهاز نشط</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.ipAddress}>
              {saving && <Loader2 className="w-4 h-4 animate-spin me-2" />}
              {editingId ? "حفظ التعديلات" : "إضافة الجهاز"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============= نافذة ربط الموظف ============= */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-right">ربط بموظف</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>اختر الموظف</Label>
            <Select value={linkEmployeeId} onValueChange={setLinkEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر موظفاً..." />
              </SelectTrigger>
              <SelectContent>
                {employees.filter((e) => e.status === "active").map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.name} ({e.employeeNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>إلغاء</Button>
            <Button
              disabled={!linkEmployeeId || linkM.isPending}
              onClick={() => {
                if (linkMappingId && linkEmployeeId) {
                  linkM.mutate({ mappingId: linkMappingId, employeeId: parseInt(linkEmployeeId) });
                }
              }}
            >
              {linkM.isPending && <Loader2 className="w-4 h-4 animate-spin me-2" />}
              ربط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, LogIn, LogOut, ClipboardList, RefreshCw, Download,
  Edit2, History, Clock, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}
function fmtTime(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}
function fmtMinutes(m: number) {
  if (!m || m === 0) return null;
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0 && min > 0) return `${h}س ${min}د`;
  if (h > 0) return `${h}س`;
  return `${min}د`;
}

export default function AttendanceLog() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState<"shifts" | "records">("shifts");

  const employeesQuery = trpc.employees.list.useQuery();

  const shiftsQuery = trpc.attendance.getShifts.useQuery(
    selectedEmployee
      ? { employeeId: selectedEmployee, startDate: new Date(startDate), endDate: new Date(endDate) }
      : { startDate: new Date(startDate), endDate: new Date(endDate) },
    { enabled: !!selectedEmployee }
  );

  const recordsQuery = trpc.attendance.getRecords.useQuery(
    selectedEmployee
      ? { employeeId: selectedEmployee, startDate: new Date(startDate), endDate: new Date(endDate) }
      : { employeeId: 0 },
    { enabled: !!selectedEmployee && activeTab === "records" }
  );

  const selectedEmp = employeesQuery.data?.find(e => e.id === selectedEmployee);
  const shifts = (shiftsQuery.data ?? []) as any[];

  // إحصائيات سريعة
  const totalWorkHours = shifts.reduce((s, sh) => s + parseFloat(sh.workHours ?? '0'), 0);
  const totalLate = shifts.reduce((s, sh) => s + (sh.lateMinutes ?? 0), 0);
  const totalOvertime = shifts.reduce((s, sh) => s + (sh.overtimeMinutes ?? 0), 0);
  const completedCount = shifts.filter(sh => sh.status === 'complete').length;

  const handleExportShifts = () => {
    if (!shifts.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    const headers = ["التاريخ", "دخول", "خروج", "ساعات العمل", "تأخير", "خروج مبكر", "إضافي", "نقص", "الحالة"];
    const rows = shifts.map(s => [
      fmtDate(s.shiftDate),
      fmtTime(s.checkInTime),
      fmtTime(s.checkOutTime),
      s.workHours ? parseFloat(s.workHours).toFixed(2) : "—",
      s.lateMinutes > 0 ? fmtMinutes(s.lateMinutes) : "—",
      s.earlyLeaveMinutes > 0 ? fmtMinutes(s.earlyLeaveMinutes) : "—",
      s.overtimeMinutes > 0 ? fmtMinutes(s.overtimeMinutes) : "—",
      s.shortageMinutes > 0 ? fmtMinutes(s.shortageMinutes) : "—",
      s.status === 'complete' ? 'مكتملة' : 'غير مكتملة',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `shifts_${selectedEmp?.name ?? 'all'}_${Date.now()}.csv`;
    a.click();
    toast.success("تم تصدير السجل بنجاح");
  };

  return (
    <DashboardLayout>
      <div className="space-y-5" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">سجل الحضور والانصراف</h1>
            <p className="text-muted-foreground text-sm mt-1">تفاصيل الورديات والبصمات وإدارة التعديلات</p>
          </div>
          {selectedEmployee && shifts.length > 0 && (
            <Button variant="outline" onClick={handleExportShifts} className="gap-2">
              <Download className="w-4 h-4" /> تصدير CSV
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">فلتر البحث</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">الموظف</label>
              <select
                value={selectedEmployee || ""}
                onChange={e => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">اختر موظف...</option>
                {employeesQuery.data?.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} — {emp.employeeNumber}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">من تاريخ</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">إلى تاريخ</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Summary cards */}
        {selectedEmp && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {selectedEmp.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-foreground text-base">{selectedEmp.name}</p>
                <p className="text-sm text-muted-foreground">{selectedEmp.department} · {selectedEmp.employeeNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "ورديات مكتملة", value: `${completedCount} / ${shifts.length}`, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                { label: "إجمالي ساعات العمل", value: `${totalWorkHours.toFixed(1)}س`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
                { label: "إجمالي التأخير", value: fmtMinutes(totalLate) ?? "لا يوجد", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
                { label: "إجمالي الإضافي", value: fmtMinutes(totalOvertime) ?? "لا يوجد", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        {selectedEmployee ? (
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="shifts" className="gap-2">
                <Clock className="w-4 h-4" /> الورديات
              </TabsTrigger>
              <TabsTrigger value="records" className="gap-2">
                <ClipboardList className="w-4 h-4" /> البصمات الخام
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shifts">
              <ShiftsTable shifts={shifts} isLoading={shiftsQuery.isLoading} onRefresh={() => shiftsQuery.refetch()} />
            </TabsContent>
            <TabsContent value="records">
              <RawRecordsTable records={recordsQuery.data ?? []} isLoading={recordsQuery.isLoading} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">اختر موظفاً لعرض سجله</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ============= جدول الورديات مع إمكانية التعديل =============
function ShiftsTable({ shifts, isLoading, onRefresh }: { shifts: any[]; isLoading: boolean; onRefresh: () => void }) {
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [logShiftId, setLogShiftId] = useState<number | null>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }
  if (!shifts.length) {
    return (
      <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-16 gap-3">
        <Clock className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-muted-foreground">لا توجد ورديات في هذه الفترة</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">التاريخ</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">دخول</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">خروج</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">ساعات</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">تأخير</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">إضافي</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shifts.map(shift => (
                <tr key={shift.id} className={`hover:bg-muted/20 transition-colors ${shift.isManuallyEdited ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{fmtDate(shift.shiftDate)}</p>
                      {shift.shiftTemplateName && <p className="text-xs text-muted-foreground">{shift.shiftTemplateName}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground" dir="ltr">{fmtTime(shift.checkInTime)}</td>
                  <td className="px-4 py-3 text-foreground" dir="ltr">{fmtTime(shift.checkOutTime)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {shift.workHours ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{parseFloat(shift.workHours).toFixed(1)}س</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {shift.lateMinutes > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />{fmtMinutes(shift.lateMinutes)}
                      </span>
                    ) : <span className="text-emerald-600 dark:text-emerald-400 text-xs">في الوقت</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {shift.overtimeMinutes > 0 ? (
                      <span className="text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />{fmtMinutes(shift.overtimeMinutes)}
                      </span>
                    ) : shift.shortageMinutes > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" />-{fmtMinutes(shift.shortageMinutes)}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {shift.status === 'complete' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle className="w-3 h-3" /> مكتملة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Clock className="w-3 h-3" /> جارية
                        </span>
                      )}
                      {shift.isManuallyEdited && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <Edit2 className="w-3 h-3" /> معدّل
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingShift(shift)} title="تعديل يدوي">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setLogShiftId(shift.id)} title="سجل التعديلات">
                        <History className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingShift && (
        <EditShiftDialog shift={editingShift} onClose={() => setEditingShift(null)} onSaved={onRefresh} />
      )}
      {logShiftId !== null && (
        <EditLogDialog shiftId={logShiftId} onClose={() => setLogShiftId(null)} />
      )}
    </>
  );
}

// ============= حوار التعديل اليدوي =============
function EditShiftDialog({ shift, onClose, onSaved }: { shift: any; onClose: () => void; onSaved: () => void }) {
  const toInputDateTime = (d: Date | string | null) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}T${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  };

  const [checkIn, setCheckIn] = useState(toInputDateTime(shift.checkInTime));
  const [checkOut, setCheckOut] = useState(toInputDateTime(shift.checkOutTime));
  const [reason, setReason] = useState("");

  const editMutation = trpc.attendance.editShift.useMutation();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error("سبب التعديل مطلوب"); return; }
    try {
      await editMutation.mutateAsync({
        shiftId: shift.id,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        editReason: reason,
      });
      toast.success("تم تعديل الوردية بنجاح");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل يدوي — {fmtDate(shift.shiftDate)}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400">
            ⚠️ سيتم تسجيل هذا التعديل في سجل التدقيق مع اسمك وسبب التعديل.
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">وقت الدخول</label>
            <Input type="datetime-local" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">وقت الخروج</label>
            <Input type="datetime-local" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">سبب التعديل <span className="text-destructive">*</span></label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="اذكر سبب التعديل..."
              required
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={editMutation.isPending}>
              {editMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              حفظ التعديل
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============= سجل التدقيق =============
function EditLogDialog({ shiftId, onClose }: { shiftId: number; onClose: () => void }) {
  const logQuery = trpc.attendance.getShiftEditLog.useQuery({ shiftId });
  const logs = logQuery.data ?? [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>سجل التعديلات — وردية #{shiftId}</DialogTitle>
        </DialogHeader>
        {logQuery.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">لا توجد تعديلات على هذه الوردية</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{log.editedByName ?? "مجهول"}</span>
                  <span>{fmtDate(log.createdAt)} {fmtTime(log.createdAt)}</span>
                </div>
                <p className="text-sm text-foreground bg-muted/40 rounded p-2">{log.editReason}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-rose-50 dark:bg-rose-900/20 rounded p-2">
                    <p className="text-rose-700 dark:text-rose-400 font-medium mb-1">قبل التعديل</p>
                    <p>دخول: {fmtTime(log.previousCheckIn)}</p>
                    <p>خروج: {fmtTime(log.previousCheckOut)}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded p-2">
                    <p className="text-emerald-700 dark:text-emerald-400 font-medium mb-1">بعد التعديل</p>
                    <p>دخول: {fmtTime(log.newCheckIn)}</p>
                    <p>خروج: {fmtTime(log.newCheckOut)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============= جدول البصمات الخام =============
function RawRecordsTable({ records, isLoading }: { records: any[]; isLoading: boolean }) {
  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }
  if (!records.length) {
    return (
      <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-16 gap-3">
        <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-muted-foreground">لا توجد بصمات في هذه الفترة</p>
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">اليوم الإداري</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">وقت البصمة</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">النوع</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">ملاحظات</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">يدوي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map(record => (
              <tr key={record.id} className={`hover:bg-muted/20 transition-colors ${record.isManualEntry ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}>
                <td className="px-4 py-3 font-medium text-foreground">{fmtDate(record.shiftDate)}</td>
                <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                  {fmtTime(record.recordedAt)}
                </td>
                <td className="px-4 py-3">
                  {record.type === 'checkin' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      <LogIn className="w-3 h-3" /> دخول
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
                      <LogOut className="w-3 h-3" /> خروج
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{record.notes || "—"}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {record.isManualEntry ? (
                    <span className="text-xs text-blue-600 dark:text-blue-400">يدوي</span>
                  ) : <span className="text-xs text-muted-foreground">تلقائي</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

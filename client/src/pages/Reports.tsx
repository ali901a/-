import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, Download, Filter, Clock, CheckCircle, XCircle,
  RefreshCw, Users, AlertTriangle, TrendingUp, TrendingDown, User,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ======= تنسيق الوقت =======
function fmtTime(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}
function fmtMinutes(m: number) {
  if (!m || m === 0) return "—";
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0 && min > 0) return `${h}س ${min}د`;
  if (h > 0) return `${h}س`;
  return `${min}د`;
}
function fmtHours(h: number) {
  if (!h) return "—";
  return h.toFixed(1) + "س";
}

export default function Reports() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]!
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]!);

  const employeesQuery = trpc.employees.list.useQuery();
  const deptsQuery = trpc.statistics.departments.useQuery();

  // ملخص جميع الموظفين
  const summaryQuery = trpc.statistics.employeesSummary.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      department: selectedDept || undefined,
    },
    { enabled: !selectedEmployee }
  );

  // تفاصيل موظف واحد
  const detailQuery = trpc.attendance.getShifts.useQuery(
    {
      employeeId: selectedEmployee ?? 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: !!selectedEmployee }
  );

  const employees = employeesQuery.data ?? [];
  const depts = deptsQuery.data ?? [];
  const summaryRows = (summaryQuery.data ?? []).filter(r =>
    !selectedEmployee && (!selectedDept || r.department === selectedDept)
  );
  const detailShifts = (detailQuery.data ?? []) as any[];
  const selectedEmp = employees.find(e => e.id === selectedEmployee);

  // إحصائيات سريعة — ملخص
  const summaryTotals = useMemo(() => ({
    employees: summaryRows.length,
    presentDays: summaryRows.reduce((s, r) => s + r.completedDays, 0),
    totalHours: summaryRows.reduce((s, r) => s + r.totalWorkHours, 0),
    lateCount: summaryRows.reduce((s, r) => s + r.lateDays, 0),
    overtimeCount: summaryRows.reduce((s, r) => s + r.overtimeDays, 0),
  }), [summaryRows]);

  // إحصائيات سريعة — تفصيلي
  const detailTotals = useMemo(() => ({
    total: detailShifts.length,
    completed: detailShifts.filter(s => s.status === 'complete').length,
    hours: detailShifts.reduce((s, sh) => s + parseFloat(sh.workHours ?? '0'), 0),
    lateMin: detailShifts.reduce((s, sh) => s + (sh.lateMinutes ?? 0), 0),
    overtimeMin: detailShifts.reduce((s, sh) => s + (sh.overtimeMinutes ?? 0), 0),
    shortageMin: detailShifts.reduce((s, sh) => s + (sh.shortageMinutes ?? 0), 0),
    earlyLeaveMin: detailShifts.reduce((s, sh) => s + (sh.earlyLeaveMinutes ?? 0), 0),
  }), [detailShifts]);

  // ======= تصدير ملخص =======
  const exportSummary = () => {
    if (!summaryRows.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    const headers = ["الموظف", "الرقم الوظيفي", "القسم", "أيام الحضور", "إجمالي الساعات",
      "أيام التأخير", "دقائق التأخير", "أيام الإضافي", "دقائق الإضافي",
      "دقائق النقص", "دقائق الخروج المبكر"];
    const rows = summaryRows.map(r => [
      r.employeeName, r.employeeNumber, r.department,
      r.completedDays, r.totalWorkHours.toFixed(2),
      r.lateDays, r.totalLateMinutes,
      r.overtimeDays, r.totalOvertimeMinutes,
      r.totalShortageMinutes, r.totalEarlyLeaveMinutes,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    downloadCSV(csv, `summary_${startDate}_${endDate}.csv`);
    toast.success("تم تصدير الملخص بنجاح");
  };

  // ======= تصدير تفصيلي =======
  const exportDetail = () => {
    if (!detailShifts.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    const headers = ["التاريخ", "الوردية", "دخول", "خروج", "ساعات العمل",
      "تأخير", "خروج مبكر", "إضافي", "نقص", "الحالة", "معدّل"];
    const rows = detailShifts.map(s => [
      fmtDate(s.shiftDate),
      s.shiftTemplateName ?? "—",
      fmtTime(s.checkInTime),
      fmtTime(s.checkOutTime),
      s.workHours ? parseFloat(s.workHours).toFixed(2) : "—",
      s.lateMinutes > 0 ? s.lateMinutes : "—",
      s.earlyLeaveMinutes > 0 ? s.earlyLeaveMinutes : "—",
      s.overtimeMinutes > 0 ? s.overtimeMinutes : "—",
      s.shortageMinutes > 0 ? s.shortageMinutes : "—",
      s.status === 'complete' ? 'مكتملة' : 'غير مكتملة',
      s.isManuallyEdited ? 'نعم' : 'لا',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    downloadCSV(csv, `detail_${selectedEmp?.name ?? 'employee'}_${startDate}_${endDate}.csv`);
    toast.success("تم تصدير التقرير بنجاح");
  };

  function downloadCSV(csv: string, filename: string) {
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  const isLoading = selectedEmployee ? detailQuery.isLoading : summaryQuery.isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-5" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">التقارير</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {selectedEmployee
                ? `تقرير تفصيلي — ${selectedEmp?.name ?? ""}`
                : "ملخص جميع الموظفين"}
            </p>
          </div>
          <div className="flex gap-2">
            {!selectedEmployee && summaryRows.length > 0 && (
              <Button onClick={exportSummary} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> تصدير الملخص
              </Button>
            )}
            {selectedEmployee && detailShifts.length > 0 && (
              <Button onClick={exportDetail} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> تصدير التفصيلي
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-foreground">فلتر التقرير</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">الموظف</label>
              <select
                value={selectedEmployee || ""}
                onChange={e => {
                  setSelectedEmployee(e.target.value ? parseInt(e.target.value) : null);
                  if (!e.target.value) setSelectedDept("");
                }}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">جميع الموظفين</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} — {emp.employeeNumber}</option>
                ))}
              </select>
            </div>

            {!selectedEmployee && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">القسم</label>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">جميع الأقسام</option>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

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

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : selectedEmployee ? (
          <DetailView shifts={detailShifts} employee={selectedEmp} totals={detailTotals} />
        ) : (
          <SummaryView rows={summaryRows} totals={summaryTotals} />
        )}
      </div>
    </DashboardLayout>
  );
}

// ======= ملخص جميع الموظفين =======
function SummaryView({ rows, totals }: { rows: any[]; totals: any }) {
  if (rows.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-20 gap-3">
        <Users className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">لا توجد بيانات للفترة المحددة</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "الموظفون", value: totals.employees, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "أيام الحضور", value: totals.presentDays, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "إجمالي الساعات", value: totals.totalHours.toFixed(0) + "س", icon: Clock, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-900/20" },
          { label: "موظف تأخر", value: totals.lateCount, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "موظف إضافي", value: totals.overtimeCount, icon: TrendingUp, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 flex flex-col gap-1`}>
              <Icon className={`w-4 h-4 ${s.color}`} />
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الموظف</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">القسم</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">أيام الحضور</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">الساعات</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><AlertTriangle className="w-3 h-3" />التأخير</span>
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400"><TrendingDown className="w-3 h-3" />خروج مبكر</span>
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                  <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400"><TrendingUp className="w-3 h-3" />إضافي</span>
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">نقص</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(r => (
                <tr key={r.employeeId} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {r.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{r.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{r.employeeNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{r.department}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${r.completedDays > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      {r.completedDays}
                    </span>
                    {r.totalDays > r.completedDays && (
                      <span className="text-xs text-muted-foreground mr-1">/ {r.totalDays}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{r.totalWorkHours.toFixed(1)}س</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {r.totalLateMinutes > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">{fmtMinutes(r.totalLateMinutes)}</span>
                    ) : <span className="text-muted-foreground text-xs">لا يوجد</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {r.totalEarlyLeaveMinutes > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400">{fmtMinutes(r.totalEarlyLeaveMinutes)}</span>
                    ) : <span className="text-muted-foreground text-xs">لا يوجد</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {r.totalOvertimeMinutes > 0 ? (
                      <span className="text-violet-600 dark:text-violet-400">{fmtMinutes(r.totalOvertimeMinutes)}</span>
                    ) : <span className="text-muted-foreground text-xs">لا يوجد</span>}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {r.totalShortageMinutes > 0 ? (
                      <span className="text-indigo-600 dark:text-indigo-400">{fmtMinutes(r.totalShortageMinutes)}</span>
                    ) : <span className="text-muted-foreground text-xs">لا يوجد</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ======= تفاصيل موظف واحد =======
function DetailView({ shifts, employee, totals }: { shifts: any[]; employee: any; totals: any }) {
  if (shifts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-20 gap-3">
        <User className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">لا توجد بيانات للموظف في الفترة المحددة</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Employee card + totals */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
            {employee?.name?.charAt(0) ?? "؟"}
          </div>
          <div>
            <p className="font-semibold text-foreground text-base">{employee?.name}</p>
            <p className="text-sm text-muted-foreground">{employee?.department} · {employee?.employeeNumber}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "إجمالي الورديات", value: totals.total, color: "text-foreground" },
            { label: "مكتملة", value: totals.completed, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "إجمالي الساعات", value: fmtHours(totals.hours), color: "text-blue-600 dark:text-blue-400" },
            { label: "إجمالي التأخير", value: fmtMinutes(totals.lateMin), color: "text-amber-600 dark:text-amber-400" },
            { label: "خروج مبكر", value: fmtMinutes(totals.earlyLeaveMin), color: "text-rose-600 dark:text-rose-400" },
            { label: "إجمالي الإضافي", value: fmtMinutes(totals.overtimeMin), color: "text-violet-600 dark:text-violet-400" },
            { label: "إجمالي النقص", value: fmtMinutes(totals.shortageMin), color: "text-indigo-600 dark:text-indigo-400" },
          ].map(s => (
            <div key={s.label} className="bg-muted/40 rounded-xl p-3 text-center">
              <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">التاريخ</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">الوردية</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">دخول</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">خروج</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">ساعات</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                  <span className="text-amber-600 dark:text-amber-400">تأخير</span>
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                  <span className="text-rose-600 dark:text-rose-400">خروج مبكر</span>
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                  <span className="text-violet-600 dark:text-violet-400">إضافي</span>
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">
                  <span className="text-indigo-600 dark:text-indigo-400">نقص</span>
                </th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shifts.map(shift => (
                <tr key={shift.id} className={`hover:bg-muted/20 transition-colors ${shift.isManuallyEdited ? 'bg-blue-50/20 dark:bg-blue-900/5' : ''}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{fmtDate(shift.shiftDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{shift.shiftTemplateName ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">{fmtTime(shift.checkInTime)}</td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">{fmtTime(shift.checkOutTime)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {shift.workHours ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{parseFloat(shift.workHours).toFixed(1)}س</span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {(shift.lateMinutes ?? 0) > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">{fmtMinutes(shift.lateMinutes)}</span>
                    ) : <span className="text-emerald-600 dark:text-emerald-400 text-xs">في الوقت</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {(shift.earlyLeaveMinutes ?? 0) > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400">{fmtMinutes(shift.earlyLeaveMinutes)}</span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {(shift.overtimeMinutes ?? 0) > 0 ? (
                      <span className="text-violet-600 dark:text-violet-400">{fmtMinutes(shift.overtimeMinutes)}</span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {(shift.shortageMinutes ?? 0) > 0 ? (
                      <span className="text-indigo-600 dark:text-indigo-400">{fmtMinutes(shift.shortageMinutes)}</span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {shift.status === 'complete' ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> مكتملة
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <XCircle className="w-3 h-3" /> غير مكتملة
                      </span>
                    )}
                    {shift.isManuallyEdited && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mt-1">
                        معدّل
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

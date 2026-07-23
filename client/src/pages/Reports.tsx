import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Filter, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Reports() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const employeesQuery = trpc.employees.list.useQuery();
  const shiftsQuery = trpc.attendance.getShifts.useQuery(
    selectedEmployee
      ? { employeeId: selectedEmployee, startDate: new Date(startDate), endDate: new Date(endDate) }
      : { employeeId: 0, startDate: new Date(), endDate: new Date() },
    { enabled: !!selectedEmployee }
  );

  const selectedEmp = employeesQuery.data?.find(e => e.id === selectedEmployee);
  const shifts = shiftsQuery.data ?? [];

  const totalHours = shifts.reduce((sum, s) => sum + (parseFloat(String(s.workHours)) || 0), 0);
  const completedShifts = shifts.filter(s => s.status === "complete").length;
  const incompleteShifts = shifts.filter(s => s.status !== "complete").length;

  const handleExport = () => {
    if (!shifts.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    const headers = ["التاريخ", "وقت الدخول", "وقت الخروج", "ساعات العمل", "الحالة"];
    const rows = shifts.map(s => [
      new Date(s.shiftDate).toLocaleDateString("ar-SA"),
      s.checkInTime ? new Date(s.checkInTime).toLocaleTimeString("ar-SA") : "-",
      s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString("ar-SA") : "-",
      s.workHours || "0",
      s.status === "complete" ? "مكتملة" : "غير مكتملة",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `report_${selectedEmp?.name || "employee"}_${Date.now()}.csv`;
    a.click();
    toast.success("تم تصدير التقرير بنجاح");
  };

  return (
    <DashboardLayout>
      <div className="space-y-5" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">التقارير</h1>
            <p className="text-muted-foreground text-sm mt-1">تقارير الحضور والانصراف التفصيلية</p>
          </div>
          {selectedEmployee && shifts.length > 0 && (
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              تصدير Excel / CSV
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm text-foreground">فلتر التقرير</h2>
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

        {/* Summary stats */}
        {selectedEmployee && !shiftsQuery.isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "إجمالي الورديات", value: shifts.length, icon: BarChart3, color: "text-primary" },
              { label: "ورديات مكتملة", value: completedShifts, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "ورديات ناقصة", value: incompleteShifts, icon: XCircle, color: "text-rose-600 dark:text-rose-400" },
              { label: "إجمالي الساعات", value: totalHours.toFixed(1), icon: Clock, color: "text-amber-600 dark:text-amber-400" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {!selectedEmployee ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BarChart3 className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">اختر موظفاً لعرض تقريره</p>
            </div>
          ) : shiftsQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !shifts.length ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <BarChart3 className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">لا توجد بيانات للفترة المحددة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">التاريخ</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">وقت الدخول</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">وقت الخروج</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">ساعات العمل</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shifts.map(shift => (
                    <tr key={shift.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {new Date(shift.shiftDate).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                        {shift.checkInTime ? new Date(shift.checkInTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                        {shift.checkOutTime ? new Date(shift.checkOutTime).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {shift.workHours ? `${shift.workHours} ساعة` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {shift.status === "complete" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                            <CheckCircle className="w-3 h-3" /> مكتملة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                            <XCircle className="w-3 h-3" /> غير مكتملة
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

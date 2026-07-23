import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Calendar, LogIn, LogOut, ClipboardList, RefreshCw, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AttendanceLog() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const employeesQuery = trpc.employees.list.useQuery();
  const recordsQuery = trpc.attendance.getRecords.useQuery(
    selectedEmployee
      ? { employeeId: selectedEmployee, startDate: new Date(startDate), endDate: new Date(endDate) }
      : { employeeId: 0, startDate: new Date(), endDate: new Date() },
    { enabled: !!selectedEmployee }
  );

  const selectedEmp = employeesQuery.data?.find(e => e.id === selectedEmployee);

  const handleExport = () => {
    const data = recordsQuery.data;
    if (!data?.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    const headers = ["التاريخ", "الوقت", "النوع", "ملاحظات"];
    const rows = data.map(r => [
      new Date(r.shiftDate).toLocaleDateString("ar-SA"),
      new Date(r.recordedAt).toLocaleTimeString("ar-SA"),
      r.type === "checkin" ? "دخول" : "خروج",
      r.notes || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${selectedEmp?.name}_${Date.now()}.csv`;
    a.click();
    toast.success("تم تصدير السجل بنجاح");
  };

  const checkinCount = recordsQuery.data?.filter(r => r.type === "checkin").length ?? 0;
  const checkoutCount = recordsQuery.data?.filter(r => r.type === "checkout").length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-5" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">سجل الحضور والانصراف</h1>
            <p className="text-muted-foreground text-sm mt-1">تفاصيل حركات الدخول والخروج</p>
          </div>
          {selectedEmployee && recordsQuery.data?.length ? (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
            >
              <Download className="w-4 h-4" />
              تصدير CSV
            </button>
          ) : null}
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
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.employeeNumber}
                  </option>
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

        {/* Employee info + summary */}
        {selectedEmp && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {selectedEmp.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-foreground text-base">{selectedEmp.name}</p>
                <p className="text-sm text-muted-foreground">{selectedEmp.department} · {selectedEmp.employeeNumber}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "إجمالي السجلات", value: recordsQuery.data?.length ?? 0, color: "text-foreground" },
                { label: "دخول", value: checkinCount, color: "text-emerald-600 dark:text-emerald-400" },
                { label: "خروج", value: checkoutCount, color: "text-rose-600 dark:text-rose-400" },
              ].map(s => (
                <div key={s.label} className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {!selectedEmployee ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">اختر موظفاً لعرض سجله</p>
            </div>
          ) : recordsQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !recordsQuery.data?.length ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">لا توجد سجلات في هذه الفترة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">التاريخ</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الوقت</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">النوع</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">ملاحظات</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">إدخال يدوي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recordsQuery.data.map(record => (
                    <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {new Date(record.shiftDate).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                        {new Date(record.recordedAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        {record.type === "checkin" ? (
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">يدوي</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">آلي</span>
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

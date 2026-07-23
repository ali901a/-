import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Reports() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const employeesQuery = trpc.employees.list.useQuery();
  const shiftsQuery = trpc.attendance.getShifts.useQuery(
    selectedEmployee
      ? {
          employeeId: selectedEmployee,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }
      : { employeeId: 0, startDate: new Date(), endDate: new Date() },
    { enabled: !!selectedEmployee }
  );

  const handleExport = () => {
    if (!shiftsQuery.data || shiftsQuery.data.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    // تصدير بسيط إلى CSV
    const headers = ["التاريخ", "وقت الدخول", "وقت الخروج", "ساعات العمل"];
    const rows = shiftsQuery.data.map((shift) => [
      new Date(shift.shiftDate).toLocaleDateString("ar-SA"),
      shift.checkInTime ? new Date(shift.checkInTime).toLocaleTimeString("ar-SA") : "-",
      shift.checkOutTime ? new Date(shift.checkOutTime).toLocaleTimeString("ar-SA") : "-",
      shift.workHours || "-",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_${new Date().getTime()}.csv`;
    link.click();

    toast.success("تم تصدير التقرير بنجاح");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">التقارير</h1>
          <p className="text-muted-foreground mt-1">
            عرض وتصدير تقارير الحضور والانصراف
          </p>
        </div>

        {/* مرشحات البحث */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              المرشحات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  الموظف
                </label>
                <select
                  value={selectedEmployee || ""}
                  onChange={(e) => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="">اختر موظف...</option>
                  {employeesQuery.data?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  من التاريخ
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  إلى التاريخ
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {selectedEmployee && (
              <Button
                onClick={handleExport}
                variant="outline"
                className="w-full md:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                تصدير التقرير
              </Button>
            )}
          </CardContent>
        </Card>

        {/* جدول البيانات */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>سجل الحضور والانصراف</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedEmployee ? (
              <div className="text-center py-8 text-muted-foreground">
                اختر موظفاً لعرض سجله
              </div>
            ) : shiftsQuery.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                جاري التحميل...
              </div>
            ) : shiftsQuery.data && shiftsQuery.data.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>وقت الدخول</TableHead>
                      <TableHead>وقت الخروج</TableHead>
                      <TableHead>ساعات العمل</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shiftsQuery.data.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell>
                          {new Date(shift.shiftDate).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          {shift.checkInTime
                            ? new Date(shift.checkInTime).toLocaleTimeString("ar-SA")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {shift.checkOutTime
                            ? new Date(shift.checkOutTime).toLocaleTimeString("ar-SA")
                            : "-"}
                        </TableCell>
                        <TableCell>{shift.workHours || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              shift.status === "complete"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {shift.status === "complete" ? "مكتملة" : "غير مكتملة"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد سجلات للموظف المختار
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

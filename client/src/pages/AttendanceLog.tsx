import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, LogIn, LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AttendanceLog() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const employeesQuery = trpc.employees.list.useQuery();
  const recordsQuery = trpc.attendance.getRecords.useQuery(
    selectedEmployee
      ? {
          employeeId: selectedEmployee,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        }
      : { employeeId: 0, startDate: new Date(), endDate: new Date() },
    { enabled: !!selectedEmployee }
  );

  const selectedEmployeeData = employeesQuery.data?.find(e => e.id === selectedEmployee);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">سجل الحضور والانصراف</h1>
          <p className="text-muted-foreground mt-1">
            عرض سجل تفصيلي لكل حركات الحضور والانصراف
          </p>
        </div>

        {/* مرشحات البحث */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
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
          </CardContent>
        </Card>

        {/* معلومات الموظف */}
        {selectedEmployeeData && (
          <Card className="border-border bg-blue-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">الاسم</p>
                  <p className="font-semibold text-foreground">{selectedEmployeeData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">رقم الموظف</p>
                  <p className="font-semibold text-foreground">{selectedEmployeeData.employeeNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">القسم</p>
                  <p className="font-semibold text-foreground">{selectedEmployeeData.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المنصب</p>
                  <p className="font-semibold text-foreground">{selectedEmployeeData.position || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* جدول السجلات */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>السجلات التفصيلية</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedEmployee ? (
              <div className="text-center py-8 text-muted-foreground">
                اختر موظفاً لعرض سجله
              </div>
            ) : recordsQuery.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                جاري التحميل...
              </div>
            ) : recordsQuery.data && recordsQuery.data.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الوقت</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>ملاحظات</TableHead>
                      <TableHead>إدخال يدوي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordsQuery.data.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.shiftDate).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          {new Date(record.recordedAt).toLocaleTimeString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.type === "checkin" ? (
                              <>
                                <LogIn className="w-4 h-4 text-green-600" />
                                <span className="text-green-700 font-medium">دخول</span>
                              </>
                            ) : (
                              <>
                                <LogOut className="w-4 h-4 text-red-600" />
                                <span className="text-red-700 font-medium">خروج</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.notes || "-"}
                        </TableCell>
                        <TableCell>
                          {record.isManualEntry ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                              نعم
                            </span>
                          ) : (
                            <span className="text-muted-foreground">لا</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد سجلات للموظف المختار في هذه الفترة
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

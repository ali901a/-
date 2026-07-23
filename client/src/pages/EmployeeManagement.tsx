import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { z } from "zod";

const employeeSchema = z.object({
  employeeNumber: z.string().min(1, "رقم الموظف مطلوب"),
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  department: z.string().min(1, "القسم مطلوب"),
  position: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeNumber: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
  });

  const employeesQuery = trpc.employees.list.useQuery();
  const createMutation = trpc.employees.create.useMutation();
  const updateMutation = trpc.employees.update.useMutation();
  const deleteMutation = trpc.employees.delete.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = employeeSchema.parse(formData);

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...validated,
        });
        toast.success("تم تحديث بيانات الموظف بنجاح");
      } else {
        await createMutation.mutateAsync(validated);
        toast.success("تم إضافة الموظف بنجاح");
      }

      setIsDialogOpen(false);
      setFormData({
        employeeNumber: "",
        name: "",
        email: "",
        phone: "",
        department: "",
        position: "",
      });
      setEditingId(null);
      await utils.employees.list.invalidate();
    } catch (error: any) {
      if (error.issues) {
        error.issues.forEach((issue: any) => {
          toast.error(issue.message);
        });
      } else {
        toast.error(error?.message || "حدث خطأ");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("تم حذف الموظف بنجاح");
        await utils.employees.list.invalidate();
      } catch (error: any) {
        toast.error(error?.message || "حدث خطأ");
      }
    }
  };

  const handleEdit = (employee: any) => {
    setFormData({
      employeeNumber: employee.employeeNumber,
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      department: employee.department,
      position: employee.position || "",
    });
    setEditingId(employee.id);
    setIsDialogOpen(true);
  };

  const handleOpenDialog = () => {
    setFormData({
      employeeNumber: "",
      name: "",
      email: "",
      phone: "",
      department: "",
      position: "",
    });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">إدارة الموظفين</h1>
            <p className="text-muted-foreground mt-1">
              إضافة وتعديل وحذف بيانات الموظفين
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                إضافة موظف جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    رقم الموظف
                  </label>
                  <Input
                    value={formData.employeeNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeNumber: e.target.value })
                    }
                    placeholder="مثال: EMP001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    الاسم
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    البريد الإلكتروني
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="example@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    رقم الهاتف
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+966..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    القسم
                  </label>
                  <Input
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="مثال: المبيعات"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    المنصب
                  </label>
                  <Input
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    placeholder="مثال: مدير"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>قائمة الموظفين</CardTitle>
          </CardHeader>
          <CardContent>
            {employeesQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : employeesQuery.data && employeesQuery.data.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الموظف</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>القسم</TableHead>
                      <TableHead>المنصب</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeesQuery.data.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.employeeNumber}
                        </TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.position || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(employee)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(employee.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد موظفين مسجلين
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

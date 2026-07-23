import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Edit2, Trash2, Loader2, Search, Download, Upload,
  ChevronRight, ChevronLeft, ArrowUpDown, Filter, Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { z } from "zod";

const employeeSchema = z.object({
  employeeNumber: z.string().min(1, "رقم الموظف مطلوب"),
  name: z.string().min(1, "الاسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
  phone: z.string().optional(),
  department: z.string().min(1, "القسم مطلوب"),
  position: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

const PAGE_SIZE = 10;
type SortField = "name" | "employeeNumber" | "department";
type SortDir = "asc" | "desc";

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const avatarColors = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

const DEPARTMENTS = ["تقنية المعلومات", "الموارد البشرية", "المالية", "المبيعات", "التسويق", "العمليات", "الإدارة"];

export default function EmployeeManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeNumber: "", name: "", email: "", phone: "", department: "", position: "",
  });
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const employeesQuery = trpc.employees.list.useQuery();
  const createMutation = trpc.employees.create.useMutation();
  const updateMutation = trpc.employees.update.useMutation();
  const deleteMutation = trpc.employees.delete.useMutation();
  const utils = trpc.useUtils();

  const employees = employeesQuery.data ?? [];

  const filtered = useMemo(() => {
    let result = [...employees];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q)
      );
    }
    if (departmentFilter) result = result.filter(e => e.department === departmentFilter);
    if (statusFilter) result = result.filter(e => e.status === statusFilter);
    result.sort((a, b) => {
      const va = (a[sortField] ?? "").toString().toLowerCase();
      const vb = (b[sortField] ?? "").toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb, "ar") : vb.localeCompare(va, "ar");
    });
    return result;
  }, [employees, search, departmentFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = employeeSchema.parse(formData);
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...validated });
        toast.success("تم تحديث بيانات الموظف بنجاح");
      } else {
        await createMutation.mutateAsync(validated);
        toast.success("تم إضافة الموظف بنجاح");
      }
      setIsDialogOpen(false);
      resetForm();
      await utils.employees.list.invalidate();
    } catch (error: any) {
      if (error?.issues) error.issues.forEach((i: any) => toast.error(i.message));
      else toast.error(error?.message || "حدث خطأ");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الموظف "${name}"؟`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("تم حذف الموظف بنجاح");
      await utils.employees.list.invalidate();
    } catch (error: any) {
      toast.error(error?.message || "حدث خطأ");
    }
  };

  const handleEdit = (emp: any) => {
    setFormData({
      employeeNumber: emp.employeeNumber, name: emp.name,
      email: emp.email || "", phone: emp.phone || "",
      department: emp.department, position: emp.position || "",
    });
    setEditingId(emp.id);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ employeeNumber: "", name: "", email: "", phone: "", department: "", position: "" });
    setEditingId(null);
  };

  const handleExportCSV = () => {
    if (!filtered.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    const headers = ["رقم الموظف", "الاسم", "القسم", "الوظيفة", "الهاتف", "الحالة"];
    const rows = filtered.map(e => [
      e.employeeNumber, e.name, e.department, e.position || "-",
      e.phone || "-", e.status === "active" ? "نشط" : "غير نشط",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `employees_${Date.now()}.csv`;
    link.click();
    toast.success("تم تصدير البيانات بنجاح");
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown className={`w-3.5 h-3.5 inline mr-1 transition-opacity ${sortField === field ? "opacity-100 text-primary" : "opacity-40"}`} />
  );

  const activeCount = employees.filter(e => e.status === "active").length;
  const inactiveCount = employees.filter(e => e.status === "inactive").length;

  return (
    <DashboardLayout>
      <div className="space-y-5" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة الموظفين</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {employees.length} موظف إجمالاً · {activeCount} نشط · {inactiveCount} غير نشط
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
            >
              <Download className="w-4 h-4" />
              تصدير CSV
            </button>
            <Button
              onClick={() => { resetForm(); setIsDialogOpen(true); }}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة موظف
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "إجمالي الموظفين", value: employees.length, color: "text-primary" },
            { label: "الموظفون النشطون", value: activeCount, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "غير النشطين", value: inactiveCount, color: "text-rose-600 dark:text-rose-400" },
          ].map(c => (
            <div key={c.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Filters bar */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="بحث بالاسم أو الرقم أو القسم..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pr-9 text-sm"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={e => { setDepartmentFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground min-w-36 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">جميع الأقسام</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
              className="px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground min-w-28 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
            {(search || departmentFilter || statusFilter) && (
              <button
                onClick={() => { setSearch(""); setDepartmentFilter(""); setStatusFilter(""); setPage(1); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {employeesQuery.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Users className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {employees.length === 0 ? "لا يوجد موظفون مسجلون بعد" : "لا توجد نتائج مطابقة"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الموظف</th>
                    <th
                      className="text-right px-4 py-3 font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none"
                      onClick={() => toggleSort("employeeNumber")}
                    >
                      <SortIcon field="employeeNumber" />
                      الرقم الوظيفي
                    </th>
                    <th
                      className="text-right px-4 py-3 font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none hidden sm:table-cell"
                      onClick={() => toggleSort("department")}
                    >
                      <SortIcon field="department" />
                      القسم
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">الوظيفة</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">الهاتف</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map(emp => (
                    <tr key={emp.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${getAvatarColor(emp.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(emp.name)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{emp.name}</p>
                            {emp.email && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">{emp.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded text-foreground">{emp.employeeNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{emp.department}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{emp.position || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell" dir="ltr">{emp.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                          emp.status === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "active" ? "bg-emerald-500" : "bg-zinc-400"}`} />
                          {emp.status === "active" ? "نشط" : "غير نشط"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(emp)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id, emp.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 text-muted-foreground hover:text-rose-600 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
              <p className="text-sm text-muted-foreground">
                عرض {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} من {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                        p === page ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={o => { setIsDialogOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-right">
                {editingId ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2" dir="rtl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">رقم الموظف <span className="text-rose-500">*</span></label>
                  <Input value={formData.employeeNumber} onChange={e => setFormData({ ...formData, employeeNumber: e.target.value })} placeholder="EMP001" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">الاسم الكامل <span className="text-rose-500">*</span></label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="محمد أحمد" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">القسم <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">اختر القسم...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">المسمى الوظيفي</label>
                  <Input value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="مدير / محاسب..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="example@company.com" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">رقم الهاتف</label>
                  <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+966..." dir="ltr" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الحفظ...</>
                  ) : (editingId ? "حفظ التعديلات" : "إضافة الموظف")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

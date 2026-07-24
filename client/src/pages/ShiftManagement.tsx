import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Edit2, Trash2, Loader2, Clock, Users, Calendar,
  Moon, Sun, ChevronDown, CheckCircle, XCircle, Link,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ============= أيام الأسبوع =============
const DAYS = [
  { value: 0, label: "أحد" },
  { value: 1, label: "اثنين" },
  { value: 2, label: "ثلاثاء" },
  { value: 3, label: "أربعاء" },
  { value: 4, label: "خميس" },
  { value: 5, label: "جمعة" },
  { value: 6, label: "سبت" },
];

function dayNames(workDaysJson: string) {
  try {
    const days: number[] = JSON.parse(workDaysJson);
    return days.map(d => DAYS.find(x => x.value === d)?.label ?? "").filter(Boolean).join("، ");
  } catch {
    return workDaysJson;
  }
}

// ============= نموذج الوردية =============
type TemplateForm = {
  name: string;
  startTime: string;
  endTime: string;
  isOvernight: boolean;
  gracePeriodMinutes: number;
  expectedWorkHours: number;
  workDays: number[];
  dayEndHour: number;
  notes: string;
};

const defaultForm: TemplateForm = {
  name: "",
  startTime: "08:00",
  endTime: "17:00",
  isOvernight: false,
  gracePeriodMinutes: 15,
  expectedWorkHours: 8,
  workDays: [0, 1, 2, 3, 4],
  dayEndHour: 0,
  notes: "",
};

export default function ShiftManagement() {
  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الورديات</h1>
          <p className="text-muted-foreground text-sm mt-1">تعريف أنواع الدوام وربطها بالموظفين</p>
        </div>
        <Tabs defaultValue="templates">
          <TabsList className="mb-4">
            <TabsTrigger value="templates" className="gap-2">
              <Clock className="w-4 h-4" /> قوالب الورديات
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <Link className="w-4 h-4" /> ربط الموظفين
            </TabsTrigger>
          </TabsList>
          <TabsContent value="templates">
            <TemplatesTab />
          </TabsContent>
          <TabsContent value="assignments">
            <AssignmentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// ============= تبويب القوالب =============
function TemplatesTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TemplateForm>(defaultForm);

  const templatesQuery = trpc.shiftTemplates.list.useQuery();
  const createMutation = trpc.shiftTemplates.create.useMutation();
  const updateMutation = trpc.shiftTemplates.update.useMutation();
  const deleteMutation = trpc.shiftTemplates.delete.useMutation();
  const utils = trpc.useUtils();

  const openCreate = () => { setForm(defaultForm); setEditingId(null); setIsOpen(true); };
  const openEdit = (t: any) => {
    setForm({
      name: t.name,
      startTime: t.startTime,
      endTime: t.endTime,
      isOvernight: t.isOvernight,
      gracePeriodMinutes: t.gracePeriodMinutes,
      expectedWorkHours: parseFloat(t.expectedWorkHours),
      workDays: JSON.parse(t.workDays),
      dayEndHour: t.dayEndHour,
      notes: t.notes ?? "",
    });
    setEditingId(t.id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("اسم الوردية مطلوب"); return; }
    if (form.workDays.length === 0) { toast.error("حدد أيام العمل"); return; }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form });
        toast.success("تم تحديث الوردية بنجاح");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("تم إنشاء الوردية بنجاح");
      }
      setIsOpen(false);
      utils.shiftTemplates.list.invalidate();
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف وردية "${name}"؟`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("تم حذف الوردية");
      utils.shiftTemplates.list.invalidate();
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    }
  };

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      workDays: f.workDays.includes(day) ? f.workDays.filter(d => d !== day) : [...f.workDays, day].sort(),
    }));
  };

  const templates = templatesQuery.data ?? [];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{templates.length} وردية</p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> وردية جديدة
        </Button>
      </div>

      {templatesQuery.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-card border border-border rounded-xl">
          <Clock className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">لا توجد ورديات. أنشئ وردية جديدة للبدء.</p>
          <Button onClick={openCreate} variant="outline" className="gap-2"><Plus className="w-4 h-4" /> إنشاء وردية</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {t.isOvernight ? (
                    <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                  ) : (
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <h3 className="font-semibold text-foreground truncate">{t.name}</h3>
                </div>
                <Badge variant={t.isActive ? "default" : "secondary"} className="shrink-0 text-xs">
                  {t.isActive ? "نشطة" : "موقفة"}
                </Badge>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span dir="ltr">{t.startTime} → {t.endTime}</span>
                {t.isOvernight && <span className="text-xs text-indigo-500">(ليلية)</span>}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">ساعات العمل</p>
                  <p className="font-semibold text-foreground mt-0.5">{t.expectedWorkHours} ساعة</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">فترة السماح</p>
                  <p className="font-semibold text-foreground mt-0.5">{t.gracePeriodMinutes} دقيقة</p>
                </div>
                {t.dayEndHour > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 col-span-2">
                    <p className="text-amber-700 dark:text-amber-400 text-xs">نهاية اليوم الإداري: {t.dayEndHour}:00 صباحاً</p>
                  </div>
                )}
              </div>

              {/* Work days */}
              <div className="flex flex-wrap gap-1">
                {DAYS.map(d => (
                  <span key={d.value} className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    JSON.parse(t.workDays).includes(d.value)
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/40 text-muted-foreground line-through"
                  }`}>{d.label}</span>
                ))}
              </div>

              {t.notes && <p className="text-xs text-muted-foreground border-t border-border pt-2">{t.notes}</p>}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(t)}>
                  <Edit2 className="w-3.5 h-3.5" /> تعديل
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="text-destructive hover:text-destructive gap-1"
                  onClick={() => handleDelete(t.id, t.name)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل وردية" : "وردية جديدة"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">اسم الوردية</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: الدوام الصباحي" required />
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">وقت الدخول</label>
                <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">وقت الخروج</label>
                <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
              </div>
            </div>

            {/* Overnight toggle */}
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
              <input
                type="checkbox"
                checked={form.isOvernight}
                onChange={e => setForm(f => ({ ...f, isOvernight: e.target.checked }))}
                className="w-4 h-4 accent-primary"
              />
              <div>
                <p className="text-sm font-medium">وردية ليلية (تمتد لليوم التالي)</p>
                <p className="text-xs text-muted-foreground">مثال: من 22:00 حتى 06:00 صباح اليوم التالي</p>
              </div>
            </label>

            {/* Hours & grace */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">ساعات العمل المتوقعة</label>
                <Input
                  type="number" step="0.5" min="0.5" max="24"
                  value={form.expectedWorkHours}
                  onChange={e => setForm(f => ({ ...f, expectedWorkHours: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">فترة السماح (دقيقة)</label>
                <Input
                  type="number" min="0" max="120"
                  value={form.gracePeriodMinutes}
                  onChange={e => setForm(f => ({ ...f, gracePeriodMinutes: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            {/* Day end hour */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                ساعة انتهاء اليوم الإداري
                <span className="text-xs text-muted-foreground mr-2">(0 = منتصف الليل)</span>
              </label>
              <select
                value={form.dayEndHour}
                onChange={e => setForm(f => ({ ...f, dayEndHour: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Array.from({ length: 13 }, (_, i) => (
                  <option key={i} value={i}>{i === 0 ? "منتصف الليل (00:00)" : `${String(i).padStart(2, '0')}:00 صباحاً`}</option>
                ))}
              </select>
              {form.dayEndHour > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  أي بصمة قبل {form.dayEndHour}:00 صباحاً ستُحسب على يوم العمل السابق
                </p>
              )}
            </div>

            {/* Work days */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">أيام العمل</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button
                    key={d.value} type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      form.workDays.includes(d.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted/40"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ملاحظات (اختياري)</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="أي ملاحظات إضافية..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                {editingId ? "حفظ التعديلات" : "إنشاء الوردية"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============= تبويب ربط الموظفين =============
function AssignmentsTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", shiftTemplateId: "", effectiveFrom: new Date().toISOString().split("T")[0] });

  const employeesQuery = trpc.employees.list.useQuery();
  const templatesQuery = trpc.shiftTemplates.list.useQuery();
  const assignMutation = trpc.assignments.assign.useMutation();
  const removeMutation = trpc.assignments.remove.useMutation();
  const utils = trpc.useUtils();

  // جلب الوردية النشطة لكل موظف
  const employees = employeesQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  // استخدام assignments list لعرض الكل
  const assignmentsQuery = trpc.assignments.list.useQuery();
  const assignments = assignmentsQuery.data ?? [];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || !form.shiftTemplateId) { toast.error("اختر الموظف والوردية"); return; }
    try {
      await assignMutation.mutateAsync({
        employeeId: parseInt(form.employeeId),
        shiftTemplateId: parseInt(form.shiftTemplateId),
        effectiveFrom: new Date(form.effectiveFrom),
      });
      toast.success("تم ربط الموظف بالوردية بنجاح");
      setIsOpen(false);
      setForm({ employeeId: "", shiftTemplateId: "", effectiveFrom: new Date().toISOString().split("T")[0] });
      utils.assignments.list.invalidate();
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm("هل تريد إزالة هذا التعيين؟")) return;
    try {
      await removeMutation.mutateAsync({ id });
      toast.success("تم إزالة التعيين");
      utils.assignments.list.invalidate();
    } catch (err: any) {
      toast.error(err?.message ?? "حدث خطأ");
    }
  };

  // بناء خريطة الموظفين والورديات
  const employeeMap = Object.fromEntries(employees.map(e => [e.id, e]));
  const templateMap = Object.fromEntries(templates.map(t => [t.id, t]));

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{assignments.length} تعيين</p>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <Link className="w-4 h-4" /> ربط موظف بوردية
        </Button>
      </div>

      {assignmentsQuery.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-card border border-border rounded-xl">
          <Users className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">لا توجد تعيينات. ابدأ بربط الموظفين بالورديات.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الموظف</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الوردية</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">من تاريخ</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">الحالة</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignments.map(a => {
                  const emp = employeeMap[a.employeeId];
                  const tmpl = templateMap[a.shiftTemplateId];
                  return (
                    <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{emp?.name ?? `موظف #${a.employeeId}`}</p>
                          <p className="text-xs text-muted-foreground">{emp?.department ?? ""}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {tmpl?.isOvernight ? <Moon className="w-3.5 h-3.5 text-indigo-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                          <span className="text-foreground">{tmpl?.name ?? `وردية #${a.shiftTemplateId}`}</span>
                        </div>
                        {tmpl && <p className="text-xs text-muted-foreground" dir="ltr">{tmpl.startTime} → {tmpl.endTime}</p>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {new Date(a.effectiveFrom).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        {a.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> منتهي
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost" size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(a.id)}
                          disabled={removeMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>ربط موظف بوردية</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الموظف</label>
              <select
                value={form.employeeId}
                onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">اختر موظفاً...</option>
                {employees.filter(e => e.status === 'active').map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} — {emp.employeeNumber}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الوردية</label>
              <select
                value={form.shiftTemplateId}
                onChange={e => setForm(f => ({ ...f, shiftTemplateId: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">اختر وردية...</option>
                {templates.filter(t => t.isActive).map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.startTime}→{t.endTime})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">تاريخ البدء</label>
              <Input type="date" value={form.effectiveFrom} onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))} required />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={assignMutation.isPending}>
                {assignMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                تطبيق التعيين
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

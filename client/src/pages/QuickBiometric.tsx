import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2, Fingerprint, LogIn, LogOut, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type LastRecord = {
  type: "checkin" | "checkout";
  time: Date;
  name: string;
  department?: string;
};

export default function QuickBiometric() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastRecord, setLastRecord] = useState<LastRecord | null>(null);

  const recordAttendanceMutation = trpc.attendance.record.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeNumber.trim()) { toast.error("يرجى إدخال رقم الموظف"); return; }

    setLoading(true);
    try {
      const employee = await utils.employees.getByNumber.fetch({ employeeNumber: employeeNumber.trim() });
      if (!employee) { toast.error("الموظف غير موجود"); return; }

      await recordAttendanceMutation.mutateAsync({ employeeId: employee.id, isManualEntry: false });

      setLastRecord({ type: "checkin", time: new Date(), name: employee.name, department: employee.department });
      setEmployeeNumber("");
      toast.success(`تم تسجيل الحضور — ${employee.name}`);
    } catch (error: any) {
      toast.error(error?.message || "حدث خطأ في التسجيل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Top bar */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Fingerprint className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">بصمتي</span>
        </div>
        <a
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          العودة للوحة التحكم
        </a>
      </header>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-primary p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Fingerprint className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">تسجيل البصمة</h1>
              <p className="text-primary-foreground/80 text-sm mt-1">أدخل رقم الموظف لتسجيل الحضور أو الانصراف</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Last record feedback */}
              {lastRecord && (
                <div className={`rounded-xl p-4 border flex items-center gap-4 ${
                  lastRecord.type === "checkin"
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                    : "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    lastRecord.type === "checkin" ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-rose-100 dark:bg-rose-900/40"
                  }`}>
                    {lastRecord.type === "checkin" ? (
                      <LogIn className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <LogOut className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{lastRecord.name}</p>
                    <p className="text-sm text-muted-foreground">{lastRecord.department}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">
                        {lastRecord.type === "checkin" ? "تم تسجيل الدخول" : "تم تسجيل الخروج"} ·{" "}
                        {lastRecord.time.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">رقم الموظف</label>
                  <Input
                    type="text"
                    placeholder="أدخل الرقم الوظيفي..."
                    value={employeeNumber}
                    onChange={e => setEmployeeNumber(e.target.value)}
                    disabled={loading}
                    className="text-center text-xl h-14 font-mono tracking-widest"
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !employeeNumber.trim()}
                  className="w-full h-12 text-base font-semibold"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 ml-2 animate-spin" />جاري التسجيل...</>
                  ) : (
                    <><Fingerprint className="w-5 h-5 ml-2" />تسجيل الحضور</>
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground pt-2">
                سيتم تحديد نوع التسجيل (دخول / خروج) تلقائياً بناءً على آخر سجل
              </p>
            </div>
          </div>

          {/* Time display */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

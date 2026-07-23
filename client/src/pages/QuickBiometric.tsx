import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function QuickBiometric() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastRecord, setLastRecord] = useState<{
    type: "checkin" | "checkout";
    time: Date;
    name: string;
  } | null>(null);

  const recordAttendanceMutation = trpc.attendance.record.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeNumber.trim()) {
      toast.error("يرجى إدخال رقم الموظف");
      return;
    }

    setLoading(true);
    try {
      // البحث عن الموظف باستخدام query
      const employee = await utils.employees.getByNumber.fetch({
        employeeNumber: employeeNumber.trim(),
      });

      if (!employee) {
        toast.error("الموظف غير موجود");
        return;
      }

      // النظام سيحدد نوع التسجيل تلقائياً
      // تسجيل الحضور
      const result = await recordAttendanceMutation.mutateAsync({
        employeeId: employee.id,
        isManualEntry: false,
      });

      // النظام يحدد نوع التسجيل تلقائياً، لذلك نعرض رسالة عامة
      setLastRecord({
        type: "checkin",
        time: new Date(),
        name: employee?.name || "الموظف",
      });

      setEmployeeNumber("");
      toast.success("تم تسجيل الحضور بنجاح");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "حدث خطأ في التسجيل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-center text-2xl">
            تسجيل البصمة السريع
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-8">
          {lastRecord ? (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">{lastRecord.name}</p>
                  <p className="text-sm text-green-700">
                    تم تسجيل الحضور بنجاح
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {lastRecord.time.toLocaleTimeString("ar-SA")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                رقم الموظف
              </label>
              <Input
                type="text"
                placeholder="أدخل رقم الموظف"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                disabled={loading}
                className="text-center text-lg h-12"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري التسجيل...
                </>
              ) : (
                "تسجيل"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              أدخل رقم الموظف وسيتم تسجيل الحضور أو الانصراف تلقائياً
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

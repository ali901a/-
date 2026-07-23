import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, UserCheck, AlertCircle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  // للاختبار: عرض لوحة التحكم مباشرة
  return <AdminDashboard />;
}

function AdminDashboard() {
  const [today] = useState(new Date());
  // للاختبار: تجاهل البيانات الفعلية
  // const dailyStats = trpc.statistics.daily.useQuery({ date: today });
  const dailyStats = { data: { totalEmployees: 0, presentCount: 0, absentCount: 0, lateCount: 0 } };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* رأس الصفحة */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-muted-foreground mt-1">
              مرحباً بك في نظام إدارة الحضور والانصراف
            </p>
          </div>
        </div>

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="إجمالي الموظفين"
            value={dailyStats.data.totalEmployees || 0}
            icon={Users}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="الحاضرون"
            value={dailyStats.data.presentCount || 0}
            icon={UserCheck}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            title="العائبون"
            value={dailyStats.data.absentCount || 0}
            icon={AlertCircle}
            color="bg-red-50 text-red-600"
          />
          <StatCard
            title="المتأخرون"
            value={dailyStats.data.lateCount || 0}
            icon={Clock}
            color="bg-orange-50 text-orange-600"
          />
        </div>

        {/* الإجراءات السريعة */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>الإجراءات السريعة</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/biometric">
              <Button className="w-full" size="lg" variant="default">
                تسجيل بصمة جديدة
              </Button>
            </a>
            <a href="/employees">
              <Button className="w-full" size="lg" variant="outline">
                إدارة الموظفين
              </Button>
            </a>
            <a href="/reports">
              <Button className="w-full" size="lg" variant="outline">
                عرض التقارير
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* آخر التسجيلات */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>آخر التسجيلات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              لا توجد تسجيلات حديثة
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EmployeeDashboard() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          سجلك الشخصي
        </h1>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              يمكنك هنا عرض سجل حضورك وانصرافك الشخصي
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

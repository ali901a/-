import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import {
  Users, UserCheck, UserX, Clock, Briefcase, LogIn, LogOut, TrendingUp, RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";

export default function Home() {
  return <AdminDashboard />;
}

function AdminDashboard() {
  const today = useMemo(() => new Date(), []);
  const statsQuery = trpc.statistics.daily.useQuery({ date: today });
  const recentQuery = trpc.attendance.recent.useQuery({ limit: 8 });
  const chartQuery = trpc.statistics.chart.useQuery({ days: 30 });
  const [, setLocation] = useLocation();

  const stats = statsQuery.data;
  const chartData = chartQuery.data ?? [];
  const maxVal = chartData.length > 0 ? Math.max(...chartData.map(d => d.total > 0 ? d.rate : 0), 1) : 100;

  const statCards = [
    {
      title: "إجمالي الموظفين",
      value: stats?.totalEmployees ?? 0,
      icon: Users,
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      title: "الحاضرون اليوم",
      value: stats?.presentCount ?? 0,
      icon: UserCheck,
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    {
      title: "الغائبون",
      value: stats?.absentCount ?? 0,
      icon: UserX,
      bg: "bg-rose-500/10 dark:bg-rose-500/20",
      iconColor: "text-rose-600 dark:text-rose-400",
      border: "border-rose-200 dark:border-rose-800",
    },
    {
      title: "المتأخرون",
      value: stats?.lateCount ?? 0,
      icon: AlertTriangle,
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
    },
    {
      title: "ورديات مكتملة",
      value: stats?.completedCount ?? 0,
      icon: Briefcase,
      bg: "bg-violet-500/10 dark:bg-violet-500/20",
      iconColor: "text-violet-600 dark:text-violet-400",
      border: "border-violet-200 dark:border-violet-800",
    },
  ];

  const dateStr = today.toLocaleDateString("ar-SA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const recentRecords = recentQuery.data ?? [];

  // حساب التغيّر عن آخر 7 أيام
  const recentRates = chartData.slice(-14);
  const last7Avg = recentRates.slice(-7).reduce((s, d) => s + d.rate, 0) / 7;
  const prev7Avg = recentRates.slice(0, 7).reduce((s, d) => s + d.rate, 0) / 7;
  const rateDelta = Math.round(last7Avg - prev7Avg);

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-muted-foreground text-sm mt-1">{dateStr}</p>
          </div>
          <button
            onClick={() => { statsQuery.refetch(); recentQuery.refetch(); chartQuery.refetch(); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-accent"
          >
            <RefreshCw className={`w-4 h-4 ${statsQuery.isFetching ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`bg-card rounded-xl border ${card.border} p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{card.title}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Attendance rate chart — real data */}
          <div className="lg:col-span-3 bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-foreground">معدل الحضور</h2>
                <p className="text-xs text-muted-foreground mt-0.5">آخر 30 يوماً</p>
              </div>
              {chartData.length >= 14 && (
                <div className={`flex items-center gap-2 text-xs px-2.5 py-1 rounded-full ${
                  rateDelta >= 0
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                    : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30"
                }`}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{rateDelta >= 0 ? `+${rateDelta}٪` : `${rateDelta}٪`} عن الأسبوع الماضي</span>
                </div>
              )}
            </div>

            {chartQuery.isLoading ? (
              <div className="flex items-center justify-center" style={{ height: 180 }}>
                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height: 180 }}>
                لا توجد بيانات بعد
              </div>
            ) : (
              <div className="relative" style={{ height: 180 }}>
                <svg width="100%" height="100%" viewBox={`0 0 ${chartData.length * 18} 180`} preserveAspectRatio="none">
                  {[0, 25, 50, 75, 100].map((pct) => {
                    const y = 160 - (pct / 100) * 140;
                    return (
                      <line key={pct} x1="0" y1={y} x2={chartData.length * 18} y2={y}
                        stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" className="text-foreground" />
                    );
                  })}
                  {chartData.map((d, i) => {
                    const barH = (d.rate / 100) * 140;
                    const isToday = i === chartData.length - 1;
                    return (
                      <g key={i}>
                        <rect
                          x={i * 18 + 2} y={160 - barH} width="12" height={Math.max(barH, 2)}
                          rx="3" fill="currentColor"
                          className={isToday ? "text-primary" : "text-primary/50"}
                          opacity={isToday ? 1 : 0.75}
                        />
                        {/* Tooltip-like text on hover via title */}
                        <title>{`${d.date}: ${d.present}/${d.total} (${d.rate}٪)`}</title>
                      </g>
                    );
                  })}
                  {/* X-axis labels — show every 5th day */}
                  {chartData.filter((_, i) => i % 5 === 0).map((d, idx) => {
                    const i = idx * 5;
                    return (
                      <text key={i} x={i * 18 + 8} y="176" textAnchor="middle"
                        fill="currentColor" className="text-muted-foreground" fontSize="9" opacity="0.6">
                        {new Date(d.date).getDate()}
                      </text>
                    );
                  })}
                </svg>
                <div className="absolute top-0 right-0 h-full flex flex-col justify-between text-xs text-muted-foreground pb-4">
                  <span>١٠٠٪</span><span>٧٥٪</span><span>٥٠٪</span><span>٢٥٪</span><span>٠٪</span>
                </div>
              </div>
            )}

            {/* Today's rate highlight */}
            {chartData.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                <span>اليوم: <strong className="text-foreground">{chartData[chartData.length - 1]?.rate ?? 0}٪</strong></span>
                <span>حاضر: <strong className="text-foreground">{chartData[chartData.length - 1]?.present ?? 0}</strong> من <strong className="text-foreground">{chartData[chartData.length - 1]?.total ?? 0}</strong></span>
              </div>
            )}
          </div>

          {/* Recent punches */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">آخر البصمات</h2>
              <button
                onClick={() => setLocation('/attendance-log')}
                className="text-xs text-primary hover:underline"
              >
                عرض الكل
              </button>
            </div>
            {recentQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : recentRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">لا توجد بصمات اليوم</div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-48">
                {recentRecords.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      r.type === 'checkin' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'
                    }`}>
                      {r.type === 'checkin'
                        ? <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        : <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.employeeName ?? `موظف #${r.employeeId}`}</p>
                      <p className="text-xs text-muted-foreground">{r.department ?? ""}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0" dir="ltr">
                      {new Date(r.recordedAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4 text-sm">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "تسجيل بصمة جديدة", icon: Clock, path: "/biometric", color: "bg-primary text-primary-foreground hover:bg-primary/90" },
              { label: "إدارة الموظفين", icon: Users, path: "/employees", color: "bg-card border border-border hover:bg-muted/40 text-foreground" },
              { label: "عرض التقارير", icon: TrendingUp, path: "/reports", color: "bg-card border border-border hover:bg-muted/40 text-foreground" },
            ].map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.path}
                  onClick={() => setLocation(action.path)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${action.color}`}
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

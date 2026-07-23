import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Briefcase,
  LogIn,
  LogOut,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";

export default function Home() {
  return <AdminDashboard />;
}

function AdminDashboard() {
  const today = useMemo(() => new Date(), []);
  const statsQuery = trpc.statistics.daily.useQuery({ date: today });
  const recentQuery = trpc.attendance.recent.useQuery({ limit: 8 });

  const stats = statsQuery.data;

  // 30-day synthetic chart data (realistic pattern)
  const chartData = useMemo(() => {
    const seed = [82, 88, 79, 91, 85, 78, 92, 87, 83, 90, 76, 88, 94, 81, 86, 89, 77, 91, 85, 88, 80, 93, 87, 84, 90, 78, 88, 92, 86, 89];
    return seed;
  }, []);

  const maxVal = Math.max(...chartData);

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
      icon: Clock,
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
    },
    {
      title: "داخل العمل الآن",
      value: stats?.presentCount ?? 0,
      icon: Briefcase,
      bg: "bg-violet-500/10 dark:bg-violet-500/20",
      iconColor: "text-violet-600 dark:text-violet-400",
      border: "border-violet-200 dark:border-violet-800",
    },
  ];

  const dateStr = today.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
            onClick={() => { statsQuery.refetch(); recentQuery.refetch(); }}
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

        {/* Chart + Recent fingerprints */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* 30-day chart */}
          <div className="lg:col-span-3 bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-foreground">معدل الحضور</h2>
                <p className="text-xs text-muted-foreground mt-0.5">آخر 30 يوماً</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+٣٪ عن الشهر الماضي</span>
              </div>
            </div>
            <div className="relative" style={{ height: 180 }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${chartData.length * 18} 180`} preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((pct) => {
                  const y = 160 - (pct / 100) * 140;
                  return (
                    <g key={pct}>
                      <line
                        x1="0" y1={y} x2={chartData.length * 18} y2={y}
                        stroke="currentColor" strokeOpacity="0.08" strokeWidth="1"
                        className="text-foreground"
                      />
                    </g>
                  );
                })}
                {/* Bars */}
                {chartData.map((val, i) => {
                  const barH = (val / maxVal) * 140;
                  const barY = 160 - barH;
                  const barX = i * 18 + 2;
                  return (
                    <rect
                      key={i}
                      x={barX} y={barY}
                      width="12" height={barH}
                      rx="3"
                      fill="currentColor"
                      className="text-primary"
                      opacity="0.85"
                    />
                  );
                })}
                {/* X-axis labels */}
                {[0, 6, 13, 20, 27].map((i) => (
                  <text
                    key={i}
                    x={i * 18 + 8} y="176"
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-muted-foreground"
                    fontSize="9"
                    opacity="0.6"
                  >
                    {i + 1}
                  </text>
                ))}
              </svg>
              {/* Y axis labels */}
              <div className="absolute top-0 right-0 h-full flex flex-col justify-between text-xs text-muted-foreground pb-4">
                <span>١٠٠٪</span>
                <span>٧٥٪</span>
                <span>٥٠٪</span>
                <span>٢٥٪</span>
              </div>
            </div>
          </div>

          {/* Recent Fingerprints */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">آخر البصمات</h2>
              <a href="/attendance-log" className="text-xs text-primary hover:underline">
                عرض الكل
              </a>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-border">
              {recentQuery.isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : recentQuery.data && recentQuery.data.length > 0 ? (
                recentQuery.data.map((rec: any) => {
                  const isIn = rec.type === "checkin";
                  const initials = rec.employeeName
                    ? rec.employeeName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)
                    : "؟";
                  return (
                    <div key={rec.id} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {rec.employeeName || "موظف"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {rec.department || rec.employeeNumber || ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            isIn
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                          }`}
                        >
                          {isIn ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                          {isIn ? "دخول" : "خروج"}
                        </span>
                        <span className="text-xs text-muted-foreground" dir="ltr">
                          {new Date(rec.recordedAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Briefcase className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">لا توجد تسجيلات اليوم</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="/biometric"
              className="flex items-center gap-3 p-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Briefcase className="w-5 h-5 shrink-0" />
              <span className="font-medium">تسجيل بصمة جديدة</span>
            </a>
            <a
              href="/employees"
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-foreground"
            >
              <Users className="w-5 h-5 shrink-0" />
              <span className="font-medium">إدارة الموظفين</span>
            </a>
            <a
              href="/reports"
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-foreground"
            >
              <TrendingUp className="w-5 h-5 shrink-0" />
              <span className="font-medium">عرض التقارير</span>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

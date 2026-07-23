import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  Monitor, 
  FileText, 
  Palmtree, 
  Settings,
  Bell,
  Sun,
  Moon,
  Search,
  ChevronDown
} from "lucide-react";

export function DarkPro() {
  const navItems = [
    { icon: LayoutDashboard, label: "لوحة التحكم", active: true },
    { icon: Users, label: "إدارة الموظفين" },
    { icon: Clock, label: "الحضور والانصراف" },
    { icon: CalendarDays, label: "إدارة الورديات" },
    { icon: Monitor, label: "الأجهزة" },
    { icon: FileText, label: "التقارير" },
    { icon: Palmtree, label: "الإجازات" },
    { icon: Settings, label: "الإعدادات" },
  ];

  const stats = [
    { label: "إجمالي الموظفين", value: "247", color: "text-blue-400" },
    { label: "الحاضرون اليوم", value: "198", color: "text-emerald-400" },
    { label: "الغائبون", value: "32", color: "text-rose-400" },
    { label: "المتأخرون", value: "12", color: "text-amber-400" },
    { label: "داخل العمل الآن", value: "186", color: "text-blue-400" },
  ];

  const chartData = Array.from({ length: 30 }, (_, i) => Math.floor(Math.random() * 40) + 60);

  const tableData = [
    { name: "أحمد محمد", id: "1001", dept: "تقنية المعلومات", action: "دخول", time: "08:00 ص", type: "in" },
    { name: "سارة خالد", id: "1005", dept: "الموارد البشرية", action: "دخول", time: "08:15 ص", type: "in" },
    { name: "محمد علي", id: "1012", dept: "المبيعات", action: "خروج", time: "02:30 م", type: "out" },
    { name: "فاطمة سعد", id: "1020", dept: "التسويق", action: "دخول", time: "09:10 ص", type: "in" },
    { name: "عمر عبدالله", id: "1033", dept: "المالية", action: "خروج", time: "04:00 م", type: "out" },
  ];

  return (
    <div dir="rtl" className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 flex-shrink-0 flex flex-col border-l border-slate-700 shadow-2xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <span className="text-white font-bold text-lg leading-none">ب</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">بصمتي</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <a 
                key={index} 
                href="#"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  item.active 
                    ? "bg-blue-500/10 text-blue-400 border-r-4 border-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]" 
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                }`}
              >
                <Icon size={18} className={item.active ? "text-blue-400" : "text-slate-500"} />
                <span className="font-medium text-sm">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=1e293b" 
              alt="User" 
              className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">مدير النظام</p>
              <p className="text-xs text-slate-500 truncate">admin@company.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0b1120] relative">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">لوحة التحكم</h1>
            <span className="hidden md:flex items-center text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              15 مايو 2024 - 09:41 ص
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="بحث..." 
                className="bg-slate-800 border border-slate-700 text-sm rounded-full pl-4 pr-10 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder-slate-500 w-64"
              />
            </div>
            <button className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-full border border-slate-700">
              <Moon size={18} />
            </button>
            <button className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800 rounded-full border border-slate-700 relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-800"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-8 z-10 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-slate-600 transition-all duration-300 group"
              >
                <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{stat.label}</span>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className={`text-4xl font-bold tracking-tight ${stat.color} drop-shadow-sm`}>
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-slate-800/60 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-6 flex flex-col shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">اتجاه الحضور - 30 يوماً</h2>
                <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  عرض التفاصيل <ChevronDown size={14} />
                </button>
              </div>
              <div className="flex-1 flex items-end gap-1.5 h-64 mt-4">
                {chartData.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col justify-end group">
                    <div 
                      className="w-full bg-blue-500/80 rounded-t-sm hover:bg-blue-400 transition-colors relative"
                      style={{ height: `${val}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-xs text-white px-2 py-1 rounded shadow-lg pointer-events-none transition-opacity whitespace-nowrap z-10 border border-slate-700">
                        {val}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 text-xs text-slate-500 px-1">
                <span>1 مايو</span>
                <span>15 مايو</span>
                <span>30 مايو</span>
              </div>
            </div>

            {/* Table Area */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-6 flex flex-col shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">آخر عمليات البصمة</h2>
                <button className="text-sm text-blue-400 hover:text-blue-300">الكل</button>
              </div>
              
              <div className="flex-1 overflow-auto -mx-2 px-2">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700/50">
                      <th className="pb-3 font-medium">الموظف</th>
                      <th className="pb-3 font-medium">القسم</th>
                      <th className="pb-3 font-medium">الحالة</th>
                      <th className="pb-3 font-medium text-left">الوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-700/20 transition-colors group">
                        <td className="py-3">
                          <div className="font-medium text-slate-200 group-hover:text-white transition-colors">{row.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">#{row.id}</div>
                        </td>
                        <td className="py-3 text-slate-400">{row.dept}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                            row.type === 'in' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {row.action}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300 text-left" dir="ltr">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

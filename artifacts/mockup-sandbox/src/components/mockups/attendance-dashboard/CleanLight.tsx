import React from 'react';
import { 
  Bell, 
  Moon, 
  Search, 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  Briefcase, 
  FileText, 
  Settings, 
  MonitorSmartphone,
  TrendingUp,
  TrendingDown,
  ChevronDown
} from 'lucide-react';

export function CleanLight() {
  const navItems = [
    { name: 'لوحة التحكم', icon: LayoutDashboard, active: true },
    { name: 'إدارة الموظفين', icon: Users, active: false },
    { name: 'الحضور والانصراف', icon: Clock, active: false },
    { name: 'إدارة الورديات', icon: Briefcase, active: false },
    { name: 'الأجهزة', icon: MonitorSmartphone, active: false },
    { name: 'التقارير', icon: FileText, active: false },
    { name: 'الإجازات', icon: Calendar, active: false },
    { name: 'الإعدادات', icon: Settings, active: false },
  ];

  const stats = [
    { label: 'إجمالي الموظفين', value: '247', trend: '+3%', up: true },
    { label: 'الحاضرون اليوم', value: '198', trend: '+5%', up: true },
    { label: 'الغائبون', value: '32', trend: '-2%', up: false },
    { label: 'المتأخرون', value: '12', trend: '+1%', up: true },
    { label: 'داخل العمل الآن', value: '186', trend: 'مستقر', up: true },
  ];

  const recentLogs = [
    { id: '1042', name: 'أحمد محمود', dept: 'تقنية المعلومات', action: 'دخول', time: '08:00 ص' },
    { id: '1085', name: 'سارة خالد', dept: 'الموارد البشرية', action: 'دخول', time: '08:15 ص' },
    { id: '1092', name: 'محمد عبدالله', dept: 'المبيعات', action: 'خروج', time: '12:30 م' },
    { id: '1105', name: 'فاطمة علي', dept: 'التسويق', action: 'دخول', time: '08:45 ص' },
    { id: '1021', name: 'عمر زيد', dept: 'الإدارة', action: 'دخول', time: '09:00 ص' },
  ];

  const chartData = [
    40, 60, 55, 80, 75, 90, 85, 100, 95, 110, 
    105, 120, 115, 130, 125, 140, 135, 150, 145, 160, 
    155, 170, 165, 180, 175, 190, 185, 200, 195, 210
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#f1f5f9] border-l border-slate-200 flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">H</span>
            </div>
            <span className="font-bold text-lg text-slate-900">نظام بصمتي</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <a 
                key={idx} 
                href="#" 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active 
                    ? 'bg-white text-emerald-600 shadow-sm border-r-4 border-emerald-600' 
                    : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={item.active ? 'text-emerald-600' : 'text-slate-400'} />
                {item.name}
              </a>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-xl font-bold text-slate-900 hidden sm:block">لوحة التحكم</h1>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="ابحث عن موظف..." 
                className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg pl-3 pr-9 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-shadow text-slate-900 placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                <Moon size={20} />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="h-8 w-px bg-slate-200 mx-2"></div>
              
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm border border-emerald-200">
                  AM
                </div>
                <div className="hidden sm:block text-right mr-1">
                  <div className="text-sm font-semibold text-slate-900 leading-none">مدير النظام</div>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6 space-y-6">
          
          {/* Top Bar / Date */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <Calendar size={16} />
              الإثنين، 24 أكتوبر 2023 - 09:30 صباحاً
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                تصدير التقرير
              </button>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors shadow-sm">
                إضافة موظف
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="text-slate-500 text-sm font-medium mb-3">{stat.label}</div>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                    stat.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    <span dir="ltr">{stat.trend}</span>
                    {stat.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">معدل الحضور (30 يوم)</h2>
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500">
                  <option>آخر 30 يوم</option>
                  <option>هذا الأسبوع</option>
                  <option>هذا الشهر</option>
                </select>
              </div>
              
              <div className="flex-1 relative min-h-[240px] w-full flex items-end justify-between gap-1 pt-6 border-b border-slate-100">
                {/* Horizontal Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full h-px bg-slate-100 relative">
                      <span className="absolute -right-6 -translate-y-1/2 text-[10px] text-slate-400">
                        {200 - (i * 50)}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Bars */}
                <div className="relative w-full h-full flex items-end justify-between gap-1 px-2 pb-px z-10">
                  {chartData.map((val, idx) => {
                    const heightPercent = (val / 250) * 100;
                    return (
                      <div 
                        key={idx} 
                        className="flex-1 bg-emerald-500 rounded-t-sm hover:bg-emerald-400 transition-colors cursor-pointer relative group"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {val} موظف
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between px-2 mt-3 text-xs text-slate-400">
                <span>1 أكتوبر</span>
                <span>15 أكتوبر</span>
                <span>30 أكتوبر</span>
              </div>
            </div>

            {/* Recent Logs Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">آخر عمليات البصمة</h2>
                <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">عرض الكل</a>
              </div>
              
              <div className="flex-1 overflow-auto">
                <table className="w-full text-right text-sm">
                  <thead className="text-slate-500 border-b border-slate-100 text-xs">
                    <tr>
                      <th className="pb-3 font-medium">الموظف</th>
                      <th className="pb-3 font-medium">القسم</th>
                      <th className="pb-3 font-medium">الحالة</th>
                      <th className="pb-3 font-medium">الوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3">
                          <div className="font-semibold text-slate-900">{log.name}</div>
                          <div className="text-xs text-slate-500">#{log.id}</div>
                        </td>
                        <td className="py-3 text-slate-600">{log.dept}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            log.action === 'دخول' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-slate-700 dir-ltr text-right">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
}

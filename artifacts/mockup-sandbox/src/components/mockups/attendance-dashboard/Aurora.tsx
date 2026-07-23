import React from 'react';
import { 
  Bell, 
  Search, 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  FileText, 
  Settings, 
  LogOut,
  Fingerprint,
  UserCheck,
  UserX,
  Clock,
  Briefcase
} from 'lucide-react';

export function Aurora() {
  const stats = [
    { label: 'إجمالي الموظفين', value: '247', icon: Users, gradient: 'from-blue-500 to-cyan-400' },
    { label: 'الحاضرون اليوم', value: '198', icon: UserCheck, gradient: 'from-emerald-500 to-green-400' },
    { label: 'الغائبون', value: '32', icon: UserX, gradient: 'from-rose-500 to-red-400' },
    { label: 'المتأخرون', value: '12', icon: Clock, gradient: 'from-amber-500 to-orange-400' },
    { label: 'داخل العمل الآن', value: '186', icon: Briefcase, gradient: 'from-teal-500 to-emerald-400' },
  ];

  const recentScans = [
    { id: 1, name: 'أحمد عبد الله', dept: 'تقنية المعلومات', status: 'دخول', time: '08:05 ص', color: 'bg-indigo-100 text-indigo-600' },
    { id: 2, name: 'سارة محمد', dept: 'الموارد البشرية', status: 'خروج', time: '04:30 م', color: 'bg-pink-100 text-pink-600' },
    { id: 3, name: 'خالد الغامدي', dept: 'المبيعات', status: 'دخول', time: '08:15 ص', color: 'bg-blue-100 text-blue-600' },
    { id: 4, name: 'فاطمة علي', dept: 'التسويق', status: 'دخول', time: '08:22 ص', color: 'bg-purple-100 text-purple-600' },
    { id: 5, name: 'عمر محمود', dept: 'الهندسة', status: 'دخول', time: '08:45 ص', color: 'bg-amber-100 text-amber-600' },
  ];

  const generateBars = () => {
    return Array.from({ length: 30 }).map((_, i) => {
      const height = 40 + Math.random() * 180; // random height between 40 and 220
      return (
        <g key={i}>
          <rect 
            x={i * 31 + 40} 
            y={240 - height} 
            width="16" 
            height={height} 
            rx="4"
            fill="url(#bar-gradient)"
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
          <text x={i * 31 + 48} y="265" fontSize="10" fill="#64748b" textAnchor="middle">{i + 1}</text>
        </g>
      );
    });
  };

  return (
    <div dir="rtl" className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-indigo-600 to-purple-700 text-white flex flex-col shrink-0 rounded-l-3xl shadow-2xl z-10 relative">
        <div className="h-20 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-inner">
              <Fingerprint className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-2xl font-bold tracking-tight">بصمتي</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white text-indigo-700 rounded-xl font-medium shadow-md">
            <LayoutDashboard className="w-5 h-5" />
            <span>لوحة القيادة</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-white/10 rounded-xl font-medium transition-colors">
            <Users className="w-5 h-5" />
            <span>الموظفين</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-white/10 rounded-xl font-medium transition-colors">
            <CalendarDays className="w-5 h-5" />
            <span>الجدول الزمني</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-white/10 rounded-xl font-medium transition-colors">
            <FileText className="w-5 h-5" />
            <span>التقارير</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-white/10 rounded-xl font-medium transition-colors">
            <Settings className="w-5 h-5" />
            <span>الإعدادات</span>
          </a>
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 bg-black/20 rounded-xl backdrop-blur-sm cursor-pointer hover:bg-black/30 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white/20 shrink-0">
              <span className="font-bold text-sm">م.ع</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">مدير النظام</p>
              <p className="text-xs text-indigo-200 truncate" dir="ltr">admin@besmati.com</p>
            </div>
            <LogOut className="w-5 h-5 text-indigo-200 hover:text-white shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4 bg-slate-100/80 px-4 py-2.5 rounded-2xl w-96 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <Search className="w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث عن موظف، قسم..." 
              className="bg-transparent border-none outline-none w-full text-sm text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-indigo-50 rounded-full border border-slate-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="flex items-center gap-3 border-r border-slate-200 pr-6">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-slate-700">عبد الرحمن</p>
                <p className="text-xs text-slate-500">مسؤول الموارد البشرية</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border-2 border-indigo-200 shrink-0">
                ع.ر
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">نظرة عامة على الحضور</h1>
              <p className="text-slate-500 text-sm mt-1">إحصائيات اليوم: {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>تصدير التقرير</span>
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group`}>
                <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-bold">{stat.value}</h3>
                  </div>
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm shadow-inner">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart & Table Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Chart */}
            <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">معدل الحضور (آخر 30 يوم)</h2>
                  <p className="text-sm text-slate-500">متوسط الحضور 94%</p>
                </div>
                <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-100">
                  <option>هذا الشهر</option>
                  <option>الشهر الماضي</option>
                  <option>هذا العام</option>
                </select>
              </div>
              <div className="w-full overflow-x-auto flex-1 flex items-end">
                <svg viewBox="0 0 1000 300" className="w-full h-[300px] min-w-[800px]">
                  <defs>
                    <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <line x1="0" y1="40" x2="1000" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="90" x2="1000" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="140" x2="1000" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="190" x2="1000" y2="190" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="240" x2="1000" y2="240" stroke="#e2e8f0" strokeWidth="1" />
                  
                  {/* Y-axis Labels */}
                  <text x="25" y="45" fontSize="11" fill="#94a3b8" textAnchor="end">250</text>
                  <text x="25" y="95" fontSize="11" fill="#94a3b8" textAnchor="end">200</text>
                  <text x="25" y="145" fontSize="11" fill="#94a3b8" textAnchor="end">150</text>
                  <text x="25" y="195" fontSize="11" fill="#94a3b8" textAnchor="end">100</text>
                  <text x="25" y="245" fontSize="11" fill="#94a3b8" textAnchor="end">0</text>
                  
                  {/* Bars */}
                  {generateBars()}
                </svg>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">أحدث البصمات</h2>
                <button className="text-indigo-600 text-sm font-medium hover:underline">عرض الكل</button>
              </div>
              <div className="flex-1 p-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-100">
                        <th className="font-medium p-4 pt-2">الموظف</th>
                        <th className="font-medium p-4 pt-2">القسم</th>
                        <th className="font-medium p-4 pt-2">الحالة</th>
                        <th className="font-medium p-4 pt-2">الوقت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentScans.map((scan) => (
                        <tr key={scan.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0 group">
                          <td className="p-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${scan.color}`}>
                                {scan.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">{scan.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 whitespace-nowrap">{scan.dept}</td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              scan.status === 'دخول' 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}>
                              {scan.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-medium whitespace-nowrap" dir="ltr">{scan.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

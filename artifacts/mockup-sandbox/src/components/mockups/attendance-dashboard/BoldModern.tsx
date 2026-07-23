import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Fingerprint, 
  Activity, 
  Monitor, 
  FileText, 
  Calendar, 
  Settings,
  Bell,
  Sun,
  Search,
  UserCheck,
  UserMinus,
  Clock,
  MapPin,
  ChevronDown
} from 'lucide-react';

export function BoldModern() {
  return (
    <div dir="rtl" className="flex min-h-screen bg-[#f5f3ff] font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-[#4f46e5] to-[#7c3aed] text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
            <Fingerprint className="text-white w-7 h-7" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight block leading-none">بصمة<span className="text-indigo-200">برو</span></span>
            <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mt-1 block">Enterprise</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="text-xs font-black text-indigo-200/70 uppercase tracking-widest mb-3 px-4 mt-2">القائمة الرئيسية</div>
          {[
            { name: 'لوحة التحكم', icon: LayoutDashboard, active: true },
            { name: 'إدارة الموظفين', icon: Users },
            { name: 'الحضور والانصراف', icon: Fingerprint },
            { name: 'إدارة الورديات', icon: Activity },
            { name: 'الأجهزة', icon: Monitor },
            { name: 'التقارير', icon: FileText },
            { name: 'الإجازات', icon: Calendar },
            { name: 'الإعدادات', icon: Settings },
          ].map((item, i) => (
            <a 
              key={i} 
              href="#" 
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${
                item.active 
                  ? 'bg-white text-[#4f46e5] shadow-lg shadow-indigo-900/20' 
                  : 'text-indigo-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.active ? 'text-[#4f46e5]' : 'text-indigo-200 opacity-80'}`} />
              <span className="text-[15px]">{item.name}</span>
            </a>
          ))}
        </nav>
        
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-violet-100 shrink-0 relative z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col">
          {/* Top Banner Wave */}
          <div className="h-12 w-full bg-gradient-to-l from-[#4f46e5] via-[#6366f1] to-[#7c3aed] text-white flex items-center justify-between px-8 relative overflow-hidden">
            {/* Subtle wave SVG background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
               <svg className="w-full h-full object-cover" preserveAspectRatio="none" viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M0 48V24.5C240 -12.5 480 34.5 720 24.5C960 14.5 1200 -12.5 1440 24.5V48H0Z" fill="currentColor"/>
               </svg>
            </div>
            <div className="relative z-10 flex items-center gap-3 text-sm font-bold tracking-wide">
              <span>صباح الخير، عبدالله 👋</span>
              <span className="opacity-40">|</span>
              <span className="text-indigo-100">الأربعاء، 15 مايو 2024</span>
            </div>
            <div className="relative z-10 text-xs font-bold bg-white/20 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
              نسبة الحضور اليوم: 80%
            </div>
          </div>
          
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <h1 className="text-2xl font-black text-slate-800">نظرة عامة</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ابحث عن موظف أو جهاز..." 
                  className="pl-4 pr-11 py-3 bg-[#f5f3ff] border-2 border-transparent rounded-full text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white w-72 transition-all text-slate-700 placeholder-slate-400"
                />
              </div>
              
              <button className="w-12 h-12 rounded-full bg-[#f5f3ff] border-2 border-transparent flex items-center justify-center text-slate-600 hover:border-indigo-200 transition-colors">
                <Sun className="w-5 h-5" />
              </button>
              
              <button className="relative w-12 h-12 rounded-full bg-[#f5f3ff] border-2 border-transparent flex items-center justify-center text-slate-600 hover:border-indigo-200 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>

              <div className="h-8 w-px bg-slate-200 mx-2"></div>

              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-left hidden md:block">
                  <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">عبدالله سعيد</div>
                  <div className="text-slate-500 text-xs font-bold">مدير النظام</div>
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-100 group-hover:border-indigo-400 transition-colors p-0.5">
                  <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-full h-full object-cover rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-8 bg-[#f5f3ff]">
          <div className="max-w-[1600px] mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              {[
                { label: 'إجمالي الموظفين', value: '247', icon: Users, border: 'border-t-[#4f46e5]', text: 'text-[#4f46e5]', bg: 'bg-indigo-50' },
                { label: 'الحاضرون اليوم', value: '198', icon: UserCheck, border: 'border-t-[#7c3aed]', text: 'text-[#7c3aed]', bg: 'bg-violet-50' },
                { label: 'الغائبون', value: '32', icon: UserMinus, border: 'border-t-rose-500', text: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'المتأخرون', value: '12', icon: Clock, border: 'border-t-amber-500', text: 'text-amber-500', bg: 'bg-amber-50' },
                { label: 'داخل العمل الآن', value: '186', icon: MapPin, border: 'border-t-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-50' },
              ].map((stat, i) => (
                <div key={i} className={`bg-white rounded-2xl shadow-sm border-t-4 ${stat.border} p-6 relative group hover:shadow-md transition-shadow`}>
                  <div className="flex justify-between items-center">
                    <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                      <stat.icon className={`w-7 h-7 ${stat.text}`} />
                    </div>
                    <div className="text-left">
                      <div className={`text-4xl font-black ${stat.text} mb-1 tracking-tight`}>{stat.value}</div>
                      <div className="text-slate-500 font-bold text-[13px]">{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Charts & Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Chart Section */}
              <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border border-violet-100/50 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-800">معدل الحضور خلال 30 يوم</h2>
                    <p className="text-slate-500 text-sm font-bold mt-2">نظرة عامة على نسبة الحضور اليومية مقارنة بإجمالي الموظفين</p>
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-[#f5f3ff] text-[#4f46e5] font-bold rounded-xl text-sm hover:bg-indigo-100 transition-colors">
                    <span>هذا الشهر</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 flex items-end gap-2.5 h-[300px] pt-8">
                  {/* Simulated Chart Bars */}
                  {Array.from({ length: 30 }).map((_, i) => {
                    const height = 40 + Math.random() * 60; // 40-100%
                    const isWeekend = i % 7 === 5 || i % 7 === 6;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        {/* Tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-lg pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-xl">
                          {Math.floor(height * 2.4)} موظف
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                        </div>
                        <div 
                          className={`w-full rounded-t-md transition-all duration-300 group-hover:brightness-110 ${
                            isWeekend 
                              ? 'bg-[#f5f3ff] h-[15%]' 
                              : 'bg-gradient-to-t from-[#4f46e5] to-[#7c3aed]'
                          }`}
                          style={{ height: isWeekend ? '15%' : `${height}%` }}
                        ></div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-6 text-sm font-bold text-slate-400 px-2 border-t border-slate-100 pt-4">
                  <span>1 مايو</span>
                  <span>15 مايو</span>
                  <span>30 مايو</span>
                </div>
              </div>

              {/* Recent Activity Table */}
              <div className="xl:col-span-1 bg-white rounded-3xl shadow-sm border border-violet-100/50 overflow-hidden flex flex-col">
                <div className="p-8 pb-6 flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-800">آخر عمليات البصمة</h2>
                  <a href="#" className="text-[#4f46e5] text-sm font-bold hover:underline bg-indigo-50 px-4 py-2 rounded-xl">عرض الكل</a>
                </div>
                
                <div className="flex-1 overflow-auto px-4 pb-4">
                  <table className="w-full text-right border-separate border-spacing-y-2">
                    <thead className="text-sm font-bold text-slate-400">
                      <tr>
                        <th className="px-4 py-2 font-bold">الموظف</th>
                        <th className="px-4 py-2 font-bold">القسم</th>
                        <th className="px-4 py-2 font-bold text-center">الحالة</th>
                        <th className="px-4 py-2 font-bold text-left">الوقت</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-bold text-slate-700">
                      {[
                        { name: 'احمد سالم', id: '1001', dept: 'المبيعات', type: 'دخول', time: '08:00 ص', img: '13' },
                        { name: 'سارة محمد', id: '1002', dept: 'التسويق', type: 'خروج', time: '04:30 م', img: '5' },
                        { name: 'محمد علي', id: '1003', dept: 'تقنية المعلومات', type: 'دخول', time: '08:15 ص', img: '11' },
                        { name: 'فاطمة حسن', id: '1004', dept: 'الموارد البشرية', type: 'دخول', time: '08:05 ص', img: '9' },
                        { name: 'خالد عبدالله', id: '1005', dept: 'المالية', type: 'خروج', time: '05:00 م', img: '33' },
                        { name: 'نورة سعد', id: '1006', dept: 'خدمة العملاء', type: 'دخول', time: '08:22 ص', img: '22' },
                      ].map((row, i) => (
                        <tr key={i} className="bg-slate-50/50 hover:bg-[#f5f3ff] transition-colors rounded-2xl group">
                          <td className="px-4 py-3.5 rounded-r-2xl">
                            <div className="flex items-center gap-3">
                              <img src={`https://i.pravatar.cc/150?img=${row.img}`} alt={row.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                              <div>
                                <div className="font-black text-slate-800">{row.name}</div>
                                <div className="text-xs text-slate-400 font-bold mt-0.5">#{row.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">{row.dept}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-black tracking-wide ${
                              row.type === 'دخول' 
                                ? 'bg-[#4f46e5] text-white shadow-sm' 
                                : 'bg-rose-500 text-white shadow-sm'
                            }`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 text-left rounded-l-2xl">
                            <div className="flex items-center justify-end gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span>{row.time}</span>
                            </div>
                          </td>
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

import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CalendarDays, 
  FileText, 
  Settings, 
  Search, 
  Bell, 
  Moon, 
  Fingerprint, 
  TrendingUp, 
  TrendingDown,
  ChevronDown
} from "lucide-react";

const recentRecords = [
  { id: "EMP-1042", name: "أحمد محمد", department: "تقنية المعلومات", status: "دخول", time: "08:15 ص", date: "اليوم" },
  { id: "EMP-1089", name: "فاطمة علي", department: "الموارد البشرية", status: "دخول", time: "08:22 ص", date: "اليوم" },
  { id: "EMP-2031", name: "محمود خالد", department: "المالية", status: "خروج", time: "04:30 م", date: "أمس" },
  { id: "EMP-1015", name: "سارة سعيد", department: "التسويق", status: "دخول", time: "08:45 ص", date: "اليوم" },
  { id: "EMP-3044", name: "عمر عبدالله", department: "المبيعات", status: "دخول", time: "09:05 ص", date: "اليوم" },
  { id: "EMP-1092", name: "نورة حسن", department: "العمليات", status: "خروج", time: "05:15 م", date: "أمس" },
  { id: "EMP-4012", name: "ياسر سعد", department: "تقنية المعلومات", status: "دخول", time: "08:10 ص", date: "اليوم" },
  { id: "EMP-2055", name: "منى طارق", department: "المالية", status: "دخول", time: "08:27 ص", date: "اليوم" },
];

const stats = [
  { label: "إجمالي الموظفين", value: "247", trend: "+2", isUp: true, icon: Users, color: "text-blue-400" },
  { label: "الحاضرون اليوم", value: "198", trend: "+5%", isUp: true, icon: Fingerprint, color: "text-emerald-400" },
  { label: "الغائبون", value: "32", trend: "-2", isUp: false, icon: CalendarDays, color: "text-red-400" },
  { label: "المتأخرون", value: "12", trend: "+3", isUp: false, icon: Clock, color: "text-amber-400" },
  { label: "داخل العمل الآن", value: "186", trend: "مستقر", isUp: true, icon: LayoutDashboard, color: "text-indigo-400" },
];

// Generate chart data
const chartData = Array.from({ length: 30 }, (_, i) => {
  // Random height between 60% and 100%
  const heightStr = (60 + Math.random() * 40).toFixed(1);
  return { day: i + 1, value: parseFloat(heightStr) };
});

export function SlatePro() {
  return (
    <div dir="rtl" className="flex h-screen w-full bg-slate-900 text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar - Naturally on the right in RTL */}
      <aside className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <Fingerprint className="w-8 h-8 text-indigo-500 ml-3" />
            <span className="text-xl font-bold text-white tracking-wide">بصمتي</span>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1 text-sm font-medium">
            <a href="#" className="flex items-center px-3 py-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <LayoutDashboard className="w-5 h-5 ml-3" />
              لوحة القيادة
            </a>
            <a href="#" className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <Users className="w-5 h-5 ml-3" />
              الموظفين
            </a>
            <a href="#" className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <Clock className="w-5 h-5 ml-3" />
              الحضور والانصراف
            </a>
            <a href="#" className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <CalendarDays className="w-5 h-5 ml-3" />
              الإجازات والغياب
            </a>
            <a href="#" className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <FileText className="w-5 h-5 ml-3" />
              التقارير
            </a>
          </nav>
        </div>

        {/* Bottom Sidebar */}
        <div className="p-4 border-t border-slate-800">
          <a href="#" className="flex items-center px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors mb-4">
            <Settings className="w-5 h-5 ml-3" />
            الإعدادات
          </a>
          
          <div className="flex items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
              م م
            </div>
            <div className="mr-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">مدير النظام</p>
              <p className="text-xs text-slate-400 truncate">admin@basmati.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-800 min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
          {/* Search */}
          <div className="relative w-96">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder="البحث عن موظف، قسم، أو سجل..." 
              className="block w-full bg-slate-800 border-0 rounded-md py-2 pr-10 pl-3 text-sm placeholder-slate-500 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Moon className="w-5 h-5" />
            </button>
            <button className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-slate-700 mx-2"></div>
            <button className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-slate-300 hover:text-white transition-colors">
              <span>مدير النظام</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-8">
          
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Page Title */}
            <div>
              <h1 className="text-2xl font-bold text-white">نظرة عامة</h1>
              <p className="text-slate-400 mt-1 text-sm">ملخص الحضور والانصراف ليوم {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="bg-slate-800 p-2.5 rounded-lg">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className={`flex items-center text-xs font-medium ${stat.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      <span className="mr-1">{stat.trend}</span>
                      {stat.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h3>
                    <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">معدل الحضور خلال 30 يوماً</h2>
                <div className="flex items-center space-x-4 space-x-reverse text-sm">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 ml-2"></span>
                    <span className="text-slate-400">نسبة الحضور</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full h-[250px] relative">
                <svg width="100%" height="100%" viewBox="0 0 1000 250" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((tick, i) => {
                    const y = 200 - (tick * 2);
                    return (
                      <g key={i}>
                        <line x1="50" y1={y} x2="980" y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                        <text x="40" y={y + 4} fill="#64748b" fontSize="12" textAnchor="end">{tick}%</text>
                      </g>
                    );
                  })}
                  
                  {/* Bars */}
                  {chartData.map((d, i) => {
                    const barWidth = 18;
                    const spacing = (930 / 30);
                    const x = 60 + (i * spacing);
                    const barHeight = d.value * 2;
                    const y = 200 - barHeight;
                    
                    return (
                      <g key={i} className="group">
                        <rect 
                          x={x} 
                          y={y} 
                          width={barWidth} 
                          height={barHeight} 
                          fill="#6366f1" 
                          rx="4" 
                          ry="4"
                          className="transition-all duration-300 hover:fill-indigo-400"
                        />
                        <rect 
                          x={x} 
                          y={200} 
                          width={barWidth} 
                          height={0} 
                          fill="#6366f1" 
                        />
                        {/* Hover Tooltip (Simulated with simple SVG text hidden by default) */}
                        <text x={x + barWidth/2} y={y - 10} fill="#f1f5f9" fontSize="11" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.value}%
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* X Axis Labels */}
                  {[1, 5, 10, 15, 20, 25, 30].map(day => {
                    const spacing = (930 / 30);
                    const x = 60 + ((day - 1) * spacing) + 9;
                    return (
                      <text key={day} x={x} y="225" fill="#64748b" fontSize="12" textAnchor="middle">
                        يوم {day}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Table Area */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">أحدث السجلات</h2>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">عرض الكل</button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-medium">الموظف</th>
                      <th className="px-6 py-4 font-medium">الرقم الوظيفي</th>
                      <th className="px-6 py-4 font-medium">القسم</th>
                      <th className="px-6 py-4 font-medium">الحالة</th>
                      <th className="px-6 py-4 font-medium">الوقت</th>
                      <th className="px-6 py-4 font-medium">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {recentRecords.map((record, i) => (
                      <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold ml-3 shrink-0">
                              {record.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium text-slate-200">{record.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{record.id}</td>
                        <td className="px-6 py-4 text-slate-400">{record.department}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === "دخول" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {record.status === "دخول" ? <LogIn className="w-3 h-3 ml-1" /> : <LogOut className="w-3 h-3 ml-1" />}
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-300">{record.time}</td>
                        <td className="px-6 py-4 text-slate-400">{record.date}</td>
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

// Add these to imports at the top
import { LogIn, LogOut } from "lucide-react";

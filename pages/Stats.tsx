
import React, { useMemo, useState } from 'react';
import { User, DailyTask } from '../types';
import { db } from '../services/db';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, LineChart, Line, Legend
} from 'recharts';
import { Calendar, TrendingUp, Award, Zap, Target, ChevronLeft, ChevronRight, Activity, CalendarDays } from 'lucide-react';

const Stats: React.FC<{ user: User }> = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const allTasks = db.getAllDailyTasks(user.id);

  const monthStr = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calculate Month Data
  const monthlyData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const data = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayTasks = allTasks.filter(t => t.date === dateStr);
      data.push({
        day: i,
        date: dateStr,
        points: dayTasks.reduce((acc, t) => acc + (t.completed ? t.pointsEarned : 0), 0),
        completions: dayTasks.filter(t => t.completed).length,
        totalTasks: dayTasks.length,
        active: dayTasks.some(t => t.completed)
      });
    }
    return data;
  }, [allTasks, selectedDate]);

  // Calculate Weekly Breakdown
  const weeklyBreakdown = useMemo(() => {
    const weeks = [];
    let currentWeek: any = { weekNum: 1, points: 0, completions: 0, activeDays: 0, days: [] };
    
    monthlyData.forEach((day, index) => {
      const dateObj = new Date(day.date);
      currentWeek.points += day.points;
      currentWeek.completions += day.completions;
      if (day.active) currentWeek.activeDays++;
      currentWeek.days.push(day);

      // If Sunday or last day of month, start new week
      if (dateObj.getDay() === 0 || index === monthlyData.length - 1) {
        weeks.push({ ...currentWeek });
        currentWeek = { weekNum: weeks.length + 1, points: 0, completions: 0, activeDays: 0, days: [] };
      }
    });
    return weeks;
  }, [monthlyData]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalPoints = monthlyData.reduce((acc, d) => acc + d.points, 0);
    const activeDays = monthlyData.filter(d => d.active).length;
    const avgScore = monthlyData.length ? Math.round(totalPoints / monthlyData.length) : 0;
    const sortedByPoints = [...monthlyData].sort((a, b) => b.points - a.points);
    const bestDay = sortedByPoints[0];
    const worstDay = sortedByPoints[sortedByPoints.length - 1];

    return { totalPoints, activeDays, avgScore, bestDay, worstDay };
  }, [monthlyData]);

  const shiftMonth = (offset: number) => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + offset);
    setSelectedDate(d);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Dynamic Header & Month Selector */}
      <header className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-50/50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Performance Deep-Dive</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Detailed analysis for {monthStr}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-indigo-50 p-2 rounded-3xl border border-indigo-100">
          <button onClick={() => shiftMonth(-1)} className="p-3 hover:bg-white rounded-2xl transition-all text-indigo-600 shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div className="px-6 flex items-center gap-3 font-black text-indigo-900 min-w-[180px] justify-center">
            <CalendarDays size={18} className="text-indigo-400" />
            <span className="uppercase tracking-widest text-xs">{monthStr}</span>
          </div>
          <button onClick={() => shiftMonth(1)} className="p-3 hover:bg-white rounded-2xl transition-all text-indigo-600 shadow-sm">
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* Monthly Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          icon={<Award className="text-indigo-500" />} 
          label="Monthly Total" 
          value={summary.totalPoints} 
          sub="Total points earned" 
        />
        <MetricCard 
          icon={<Target className="text-emerald-500" />} 
          label="Active Days" 
          value={`${summary.activeDays}/${monthlyData.length}`} 
          sub="Consistency rate" 
        />
        <MetricCard 
          icon={<TrendingUp className="text-indigo-500" />} 
          label="Daily Avg" 
          value={summary.avgScore} 
          sub="Points per day" 
        />
        <MetricCard 
          icon={<Zap className="text-amber-500" />} 
          label="Peak Points" 
          value={summary.bestDay?.points || 0} 
          sub={`On day ${summary.bestDay?.day}`} 
        />
      </section>

      {/* Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Daily Flow Area Chart */}
        <section className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Daily Rhythm</h2>
            <div className="bg-slate-50 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
              Point fluctuations
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="points" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorPoints)" 
                  animationDuration={1500} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Weekly Comparison */}
        <section className="lg:col-span-4 bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
          <h2 className="text-xl font-extrabold mb-8 tracking-tight flex items-center gap-2">
            <Activity size={20} className="text-indigo-400" />
            Weekly Momentum
          </h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBreakdown}>
                <XAxis 
                  dataKey="weekNum" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                  label={{ value: 'Week #', position: 'insideBottom', offset: -5, fill: '#475569', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', color: '#000' }} 
                />
                <Bar dataKey="points" radius={[10, 10, 10, 10]} barSize={20}>
                  {weeklyBreakdown.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.points === Math.max(...weeklyBreakdown.map(w => w.points)) ? '#10b981' : '#6366f1'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-6 text-xs text-slate-400 font-medium leading-relaxed italic text-center">
            Green highlights your peak performance week.
          </p>
        </section>
      </div>

      {/* Interactive Weekly Deep-Dive List */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <Activity className="text-indigo-600" size={24} />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Weekly Breakdown</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weeklyBreakdown.map((week, idx) => (
            <div 
              key={idx} 
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-default"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 text-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs">
                  W{week.weekNum}
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Zap size={12} fill="currentColor" />
                  {week.activeDays} Days Active
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Accumulated</p>
                  <p className="text-3xl font-black text-slate-900">{week.points} <span className="text-xs text-slate-300 font-bold uppercase">Points</span></p>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Consistency Flow</span>
                    <span className="text-indigo-600 font-black">{Math.round((week.activeDays / week.days.length) * 100)}%</span>
                  </div>
                  <div className="flex gap-1.5 h-2">
                    {week.days.map((day: any, i: number) => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-full transition-all duration-500 ${day.active ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'bg-slate-100'}`}
                        title={`${day.date}: ${day.points} pts`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub: string }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:scale-[1.02] hover:shadow-xl transition-all duration-500">
    <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-500">
      {icon}
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
    <div>
      <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 mt-2 italic">{sub}</p>
    </div>
  </div>
);

export default Stats;

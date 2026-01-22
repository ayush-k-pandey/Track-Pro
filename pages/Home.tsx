
import React, { useState, useEffect, useMemo } from 'react';
import { User, DailyTask, Activity, Category, ProductivityInsights } from '../types';
import { db } from '../services/db';
// Added Zap to the lucide-react imports to fix 'Cannot find name Zap'
import { CheckCircle2, Circle, Trophy, Plus, TrendingUp, Sparkles, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit3, Target, LayoutGrid, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getProductivityInsights } from '../services/gemini';
import { Link } from 'react-router-dom';

const Home: React.FC<{ user: User }> = ({ user }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isVirtual, setIsVirtual] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [insights, setInsights] = useState<ProductivityInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isAddingExtraTask, setIsAddingExtraTask] = useState(false);
  const [editingPointsId, setEditingPointsId] = useState<string | null>(null);
  const [editPointsValue, setEditPointsValue] = useState<number>(0);

  useEffect(() => {
    const loadData = () => {
      const { tasks: loadedTasks, isFromTemplate } = db.getOrInitDailyTasks(user.id, selectedDate);
      setTasks(loadedTasks);
      setIsVirtual(isFromTemplate);
      setActivities(db.getActivities(user.id));
      setCategories(db.getCategories(user.id));
    };
    loadData();
    setInsights(null);
  }, [user.id, selectedDate]);

  const totalPoints = useMemo(() => {
    return tasks.reduce((acc, task) => acc + (task.completed ? task.pointsEarned : 0), 0);
  }, [tasks]);

  const possiblePoints = useMemo(() => {
    return tasks.reduce((acc, task) => acc + task.pointsEarned, 0);
  }, [tasks]);

  const progressPercent = possiblePoints > 0 ? Math.round((totalPoints / possiblePoints) * 100) : 0;

  const ensureDateIsPersistent = (updatedTasks?: DailyTask[]) => {
    if (isVirtual) {
      const tasksToSave = updatedTasks || tasks;
      db.saveManyDailyTasks(tasksToSave);
      setIsVirtual(false);
      return tasksToSave;
    }
    return updatedTasks || tasks;
  };

  const toggleTask = (taskId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, completed: newStatus } : t);
    
    if (isVirtual) {
      ensureDateIsPersistent(newTasks);
    } else {
      db.updateDailyTask(taskId, newStatus);
    }
    
    setTasks(newTasks);
    
    if (newStatus) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981']
      });
    }
  };

  const removeTask = (taskId: string) => {
    if (isVirtual) {
      const newTasks = tasks.filter(t => t.id !== taskId);
      ensureDateIsPersistent(newTasks);
      setTasks(newTasks);
    } else {
      db.deleteDailyTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleUpdatePoints = (taskId: string) => {
    if (isVirtual) {
      const newTasks = tasks.map(t => t.id === taskId ? { ...t, pointsEarned: editPointsValue } : t);
      ensureDateIsPersistent(newTasks);
      setTasks(newTasks);
    } else {
      db.updateDailyTaskPoints(taskId, editPointsValue);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, pointsEarned: editPointsValue } : t));
    }
    setEditingPointsId(null);
  };

  const fetchInsights = async () => {
    if (tasks.length === 0) return;
    setLoadingInsights(true);
    const completedCount = tasks.filter(t => t.completed).length;
    const desc = `${completedCount} tasks done, ${totalPoints} points earned today on ${selectedDate}.`;
    const data = await getProductivityInsights(desc);
    if (data) setInsights(data);
    setLoadingInsights(false);
  };

  const isToday = selectedDate === todayStr;

  // Group tasks by category for better organization
  const groupedTasks = useMemo(() => {
    const groups: Record<string, DailyTask[]> = {};
    tasks.forEach(task => {
      const activity = activities.find(a => a.id === task.activityId);
      const catId = activity?.categoryId || 'uncategorized';
      if (!groups[catId]) groups[catId] = [];
      groups[catId].push(task);
    });
    return groups;
  }, [tasks, activities]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Date Navigation & Summary Card */}
      <section className="bg-white rounded-[2.5rem] p-1 shadow-2xl shadow-indigo-100/50 border border-slate-100/50 overflow-hidden">
        <div className="bg-gradient-soft p-10 text-white rounded-[2.2rem]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold tracking-tight">
                {isToday ? "Today's Focus" : "Review Session"}
              </h1>
              <div className="flex items-center gap-2 text-indigo-100 font-medium">
                <CalendarIcon size={16} />
                <span>{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 glass p-2 rounded-2xl shadow-xl">
              <button onClick={() => shiftDate(-1)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><ChevronLeft /></button>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold cursor-pointer"
              />
              <button onClick={() => shiftDate(1)} className="p-2 hover:bg-white/20 rounded-xl transition-colors"><ChevronRight /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass rounded-[1.8rem] p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-black">
                {progressPercent}%
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 mb-1">Overall Progress</p>
                <div className="h-2 w-32 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            </div>

            <div className="glass rounded-[1.8rem] p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 mb-1">Points Earned</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{totalPoints}</span>
                <span className="text-indigo-200 text-sm font-bold">/ {possiblePoints} pts</span>
              </div>
            </div>

            <div className="glass rounded-[1.8rem] p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-100 mb-1">Status</p>
              <div className="flex items-center gap-2">
                {isVirtual ? (
                  <div className="flex items-center gap-2 bg-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 bg-indigo-200 rounded-full animate-pulse"></span>
                    ACTIVE TEMPLATE
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold">
                    <Trophy size={14} className="text-emerald-200" />
                    HISTORY LOCKED
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Tasks List */}
        <div className="lg:col-span-8 space-y-12">
          {Object.keys(groupedTasks).length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-slate-200 shadow-sm">
              <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Target className="text-slate-300" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No activities for this day</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">Set up your master habit template to start tracking your daily progress automatically.</p>
              <Link to="/manage" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
                Configure Master Plans
              </Link>
            </div>
          ) : (
            Object.entries(groupedTasks).map(([catId, dayTasks]) => {
              const category = categories.find(c => c.id === catId);
              return (
                <div key={catId} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full" style={{ backgroundColor: category?.color || '#cbd5e1' }}></div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">
                      {category?.name || "Uncategorized"}
                    </h2>
                    <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded-lg text-slate-500">
                      {dayTasks.length} {dayTasks.length === 1 ? 'Task' : 'Tasks'}
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {dayTasks.map(task => {
                      const activity = activities.find(a => a.id === task.activityId);
                      const isEditing = editingPointsId === task.id;
                      return (
                        <div 
                          key={task.id}
                          className={`group relative flex items-center gap-5 p-5 rounded-[1.8rem] border transition-all duration-300 ${
                            task.completed 
                              ? 'bg-slate-50/80 border-slate-100' 
                              : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100'
                          }`}
                        >
                          <button 
                            onClick={() => toggleTask(task.id, task.completed)}
                            className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                              task.completed 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                            }`}
                          >
                            {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} strokeWidth={2.5} />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-lg leading-tight truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                              {activity?.name || "Deleted Activity"}
                            </h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              {isEditing ? (
                                <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg p-1">
                                  <input 
                                    type="number" autoFocus
                                    className="w-12 text-xs font-bold outline-none text-center"
                                    value={editPointsValue}
                                    onChange={(e) => setEditPointsValue(Number(e.target.value))}
                                    onBlur={() => handleUpdatePoints(task.id)}
                                    onKeyDown={e => e.key === 'Enter' && handleUpdatePoints(task.id)}
                                  />
                                </div>
                              ) : (
                                <button 
                                  onClick={() => { setEditingPointsId(task.id); setEditPointsValue(task.pointsEarned); }}
                                  className="text-xs font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 hover:bg-indigo-100"
                                >
                                  {task.pointsEarned} Points
                                  <Edit3 size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          <button 
                            onClick={() => removeTask(task.id)}
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Insights & Actions */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100 space-y-6 sticky top-28">
            <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-500" />
              AI Insights
            </h3>

            {loadingInsights ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                <div className="h-20 bg-slate-100 rounded-3xl w-full"></div>
              </div>
              /* Refined type checking and narrowing for insights object to resolve 'unknown' property access errors in TypeScript */
            ) : (insights && Array.isArray(insights.tips) && (insights.tips as string[]).length > 0) ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <p className="text-slate-600 leading-relaxed italic">"{insights.summary}"</p>
                <div className="space-y-3">
                  {(insights.tips as string[]).map((tip: string, i: number) => (
                    <div key={i} className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex gap-3 items-start">
                      <div className="bg-indigo-500 text-white rounded-full p-1 mt-0.5"><Zap size={10} fill="white" /></div>
                      <p className="text-sm font-semibold text-indigo-900 leading-snug">{tip}</p>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setInsights(null)} 
                  className="w-full py-3 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                >
                  Dismiss Analysis
                </button>
              </div>
            ) : (
              <div className="py-4 space-y-6">
                <p className="text-sm text-slate-500 leading-relaxed">Let Gemini analyze your {isToday ? "current" : "historical"} performance and suggest improvements.</p>
                <button 
                  onClick={fetchInsights}
                  disabled={tasks.length === 0}
                  className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  <Sparkles size={18} />
                  Analyze Progress
                </button>
              </div>
            )}

            <div className="pt-8 border-t border-slate-100 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</p>
              <button 
                onClick={() => setIsAddingExtraTask(true)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-900 transition-all duration-300"
              >
                <span className="font-bold text-slate-700 group-hover:text-white transition-colors">Add Extra Task</span>
                <div className="bg-white w-8 h-8 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Plus size={18} className="text-slate-900" />
                </div>
              </button>
              <Link 
                to="/manage" 
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-indigo-600 transition-all duration-300"
              >
                <span className="font-bold text-slate-700 group-hover:text-white transition-colors">Adjust Template</span>
                <div className="bg-white w-8 h-8 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <LayoutGrid size={18} className="text-indigo-600" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Extra Task Selection Dialog */}
      {isAddingExtraTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Add Override Activity</h3>
              <button onClick={() => setIsAddingExtraTask(false)} className="p-2 hover:bg-white rounded-xl transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-slate-500 mb-4">Choose from your master activities to add as a one-time override for this day.</p>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 font-medium">No master activities found.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {activities.map(activity => {
                    const category = categories.find(c => c.id === activity.categoryId);
                    const exists = tasks.some(t => t.activityId === activity.id);
                    return (
                      <button
                        key={activity.id}
                        onClick={() => {
                          const newTask: DailyTask = {
                            id: `task-${Date.now()}`,
                            activityId: activity.id,
                            userId: user.id,
                            date: selectedDate,
                            completed: false,
                            pointsEarned: activity.points
                          };
                          if (isVirtual) {
                            ensureDateIsPersistent([...tasks, newTask]);
                          } else {
                            db.saveDailyTask(newTask);
                          }
                          setTasks(prev => [...prev, newTask]);
                          setIsAddingExtraTask(false);
                        }}
                        className={`flex items-center justify-between p-5 rounded-3xl border text-left transition-all ${
                          exists ? 'bg-indigo-50 border-indigo-100 opacity-80' : 'bg-slate-50 border-transparent hover:border-indigo-300 hover:bg-white'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-900">{activity.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest" style={{ backgroundColor: `${category?.color || '#000'}15`, color: category?.color || '#000' }}>
                              {category?.name}
                            </span>
                            <span className="text-xs font-bold text-slate-400">• {activity.points} pts</span>
                          </div>
                        </div>
                        <div className="bg-white w-10 h-10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                          <Plus size={20} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50/50 flex justify-center">
              <Link to="/manage" className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-2">
                Create new master activities <Plus size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;

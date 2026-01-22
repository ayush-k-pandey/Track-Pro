
import React, { useState, useMemo, useEffect } from 'react';
import { User, DailyTask } from '../types';
import { db } from '../services/db';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Users, UserPlus, Copy, Check, Share2, ToggleLeft, ToggleRight, 
  TrendingUp, Award, Activity, Trash2, ShieldCheck, ShieldAlert
} from 'lucide-react';

const Social: React.FC<{ user: User }> = ({ user: initialUser }) => {
  const [user, setUser] = useState(initialUser);
  const [friendShareId, setFriendShareId] = useState('');
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState('');
  const [activeComparison, setActiveComparison] = useState<User | null>(null);

  useEffect(() => {
    // Refresh local user state if changed in db
    const current = db.getSession();
    if (current) setUser(current);
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.shareId);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleToggleSharing = () => {
    const updated = { ...user, isSharingEnabled: !user.isSharingEnabled };
    db.updateUser(updated);
    setUser(updated);
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const shareId = friendShareId.trim().toUpperCase();
    
    if (shareId === user.shareId) {
      setError("You can't add yourself as a friend.");
      return;
    }

    if (user.friends.includes(shareId)) {
      setError("This friend is already on your list.");
      return;
    }

    const friend = db.getUserByShareId(shareId);
    if (!friend) {
      setError("User ID not found. Check and try again.");
      return;
    }

    const updated = { ...user, friends: [...user.friends, shareId] };
    db.updateUser(updated);
    setUser(updated);
    setFriendShareId('');
  };

  const handleRemoveFriend = (shareId: string) => {
    const updated = { ...user, friends: user.friends.filter(f => f !== shareId) };
    db.updateUser(updated);
    setUser(updated);
    if (activeComparison?.shareId === shareId) setActiveComparison(null);
  };

  const comparisonData = useMemo(() => {
    if (!activeComparison) return [];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const myTasks = db.getAllDailyTasks(user.id);
    const friendTasks = db.getAllDailyTasks(activeComparison.id);

    return last7Days.map(date => {
      const myDayPoints = myTasks
        .filter(t => t.date === date && t.completed)
        .reduce((sum, t) => sum + t.pointsEarned, 0);
      
      const friendDayPoints = friendTasks
        .filter(t => t.date === date && t.completed)
        .reduce((sum, t) => sum + t.pointsEarned, 0);

      return {
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        "You": myDayPoints,
        [activeComparison.username]: friendDayPoints
      };
    });
  }, [user, activeComparison]);

  const statsComparison = useMemo(() => {
    if (!activeComparison) return null;
    
    const myTasks = db.getAllDailyTasks(user.id);
    const friendTasks = db.getAllDailyTasks(activeComparison.id);

    const getStreak = (tasks: DailyTask[]) => {
      const dates = [...new Set(tasks.filter(t => t.completed).map(t => t.date))].sort();
      if (dates.length === 0) return 0;
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date(today);

      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (dates.includes(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    };

    const myPts = myTasks.filter(t => t.completed).reduce((s, t) => s + t.pointsEarned, 0);
    const friendPts = friendTasks.filter(t => t.completed).reduce((s, t) => s + t.pointsEarned, 0);

    return {
      myPoints: myPts,
      friendPoints: friendPts,
      myStreak: getStreak(myTasks),
      friendStreak: getStreak(friendTasks),
      diff: myPts - friendPts
    };
  }, [user, activeComparison]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-indigo-50/50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Social Network</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Compete, compare, and stay consistent together.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 flex items-center gap-4 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Your Share ID</span>
              <span className="text-xl font-black text-indigo-900 tracking-tighter">{user.shareId}</span>
            </div>
            <button 
              onClick={handleCopyId}
              className={`p-3 rounded-2xl transition-all ${copying ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'}`}
            >
              {copying ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>

          <button 
            onClick={handleToggleSharing}
            className={`flex items-center gap-3 px-6 py-4 rounded-3xl font-bold transition-all ${
              user.isSharingEnabled 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            {user.isSharingEnabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            {user.isSharingEnabled ? "Public Profile" : "Private Profile"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Friend List & Add Section */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-indigo-600" />
              Add Connection
            </h3>
            <form onSubmit={handleAddFriend} className="space-y-4">
              <div className="relative group">
                <input 
                  type="text" 
                  maxLength={8}
                  placeholder="Enter Share ID..." 
                  value={friendShareId}
                  onChange={e => setFriendShareId(e.target.value.toUpperCase())}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold placeholder:text-slate-300"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {error && <p className="text-xs font-bold text-red-500 px-2 animate-in slide-in-from-top-2">{error}</p>}
            </form>
          </section>

          <section className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100">
            <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" />
              Your Connections
            </h3>
            
            <div className="space-y-3">
              {user.friends.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-sm font-medium">No friends added yet.</p>
                </div>
              ) : (
                user.friends.map(friendId => {
                  const friend = db.getUserByShareId(friendId);
                  const isSelected = activeComparison?.shareId === friendId;
                  
                  return (
                    <div 
                      key={friendId}
                      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-50 border-indigo-200' 
                          : 'bg-slate-50/50 border-transparent hover:border-indigo-100 hover:bg-white'
                      }`}
                      onClick={() => friend?.isSharingEnabled ? setActiveComparison(friend) : null}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                          {friend ? friend.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 leading-tight">
                            {friend ? friend.username : 'Unknown User'}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {friend?.isSharingEnabled ? 'Tap to Compare' : 'Profile Private'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveFriend(friendId); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Comparison Dashboard */}
        <div className="lg:col-span-8">
          {!activeComparison ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-12 text-center">
              <div className="bg-slate-50 p-6 rounded-[2rem] mb-6">
                <Share2 size={48} className="text-slate-200" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Compare Progress</h3>
              <p className="text-slate-500 max-w-sm">Select a public connection from the list to see how your productivity metrics stack up side-by-side.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
              <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="bg-white/20 p-4 rounded-[2rem] backdrop-blur-md">
                      <TrendingUp size={32} />
                    </div>
                    <div>
                      <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">Active Battle</p>
                      <h2 className="text-3xl font-extrabold">You vs {activeComparison.username}</h2>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-md border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Difference</p>
                      <p className="text-xl font-black">
                        {statsComparison ? (statsComparison.diff > 0 ? `+${statsComparison.diff}` : statsComparison.diff) : 0} pts
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                   <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                    <Award size={24} />
                   </div>
                   <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Streak Lead</p>
                    <p className="text-xl font-black text-slate-900">
                      {statsComparison?.myStreak || 0}d <span className="text-slate-300 mx-1">vs</span> {statsComparison?.friendStreak || 0}d
                    </p>
                   </div>
                </div>
                <div className="bg-white p-8 rounded-[2.2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                   <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Activity size={24} />
                   </div>
                   <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Life-Time Points</p>
                    <p className="text-xl font-black text-slate-900">
                      {statsComparison?.myPoints || 0} <span className="text-slate-300 mx-1">vs</span> {statsComparison?.friendPoints || 0}
                    </p>
                   </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-100/50 border border-slate-100">
                <h3 className="text-xl font-extrabold text-slate-900 mb-10 tracking-tight">Productivity Pulse (Last 7 Days)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} 
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                      />
                      <Legend 
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="You" 
                        stroke="#6366f1" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                        activeDot={{ r: 8 }}
                        animationDuration={1500}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={activeComparison.username} 
                        stroke="#ec4899" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#ec4899', strokeWidth: 3, stroke: '#fff' }}
                        activeDot={{ r: 8 }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <h4 className="font-extrabold text-indigo-900">
                    {statsComparison?.diff && statsComparison.diff > 0 
                      ? "Keep it up! You're dominating the leaderboards." 
                      : `Challenge yourself! You're only ${Math.abs(statsComparison?.diff || 0)} points away from catching up.`}
                  </h4>
                  <p className="text-sm text-indigo-700/70 font-medium">Friendship thrives on healthy competition.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Social;


import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { User } from './types';
import { db } from './services/db';
import Home from './pages/Home';
import Management from './pages/Management';
import Stats from './pages/Stats';
import Social from './pages/Social';
import Auth from './pages/Auth';
import { LayoutDashboard, ListChecks, BarChart3, LogOut, User as UserIcon, Zap, Users } from 'lucide-react';

const Navbar = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-slate-200/50 px-6 py-3 md:top-0 md:bottom-auto md:border-t-0 md:border-b flex justify-between items-center z-50">
      <div className="hidden md:flex items-center gap-2 group cursor-pointer mr-8">
        <div className="bg-gradient-soft p-1.5 rounded-xl shadow-lg shadow-indigo-100 group-hover:rotate-12 transition-transform">
          <Zap className="text-white" size={20} fill="white" />
        </div>
        <span className="font-extrabold text-xl tracking-tight text-slate-900">Track<span className="text-indigo-600">Pro</span></span>
      </div>
      
      <div className="flex flex-1 justify-around md:justify-start md:gap-4 items-center max-w-lg">
        <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Focus" active={isActive('/')} />
        <NavLink to="/manage" icon={<ListChecks size={20} />} label="Plans" active={isActive('/manage')} />
        <NavLink to="/stats" icon={<BarChart3 size={20} />} label="Trends" active={isActive('/stats')} />
        <NavLink to="/social" icon={<Users size={20} />} label="Social" active={isActive('/social')} />
      </div>

      <div className="hidden md:flex items-center gap-6 ml-auto">
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-2xl border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-slate-700">{user.username}</span>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) => (
  <Link 
    to={to} 
    className={`flex flex-col md:flex-row items-center gap-1.5 md:gap-2.5 px-4 py-2 rounded-2xl transition-all duration-300 ${
      active 
        ? 'text-indigo-600 bg-indigo-50/80 shadow-sm scale-105' 
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
    }`}
  >
    <div className={`${active ? 'scale-110' : ''} transition-transform`}>{icon}</div>
    <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider md:normal-case md:tracking-normal">{label}</span>
  </Link>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(db.getSession());

  const handleLogin = (u: User) => {
    db.setSession(u);
    setUser(u);
  };

  const handleLogout = () => {
    db.setSession(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen">
        {user && <Navbar user={user} onLogout={handleLogout} />}
        <main className={`${user ? 'md:pt-24 pt-4 pb-24 md:pb-12' : ''}`}>
          <div className="max-w-5xl mx-auto px-6">
            <Routes>
              {!user ? (
                <>
                  <Route path="/auth" element={<Auth onLogin={handleLogin} />} />
                  <Route path="*" element={<Navigate to="/auth" />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Home user={user} />} />
                  <Route path="/manage" element={<Management user={user} />} />
                  <Route path="/stats" element={<Stats user={user} />} />
                  <Route path="/social" element={<Social user={user} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              )}
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;

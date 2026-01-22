
import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/db';
import { Mail, Lock, User as UserIcon, ArrowRight, Zap } from 'lucide-react';

const generateShareId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const Auth: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = db.getUsers();
    if (isLogin) {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) onLogin(user);
      else setError('Invalid email or password');
    } else {
      if (users.some(u => u.email === email)) {
        setError('Email already exists');
        return;
      }
      
      const newUser: User = {
        id: `user-${Date.now()}`,
        shareId: generateShareId(),
        username,
        email,
        password,
        joinedAt: new Date().toISOString(),
        friends: [],
        isSharingEnabled: true
      };
      db.saveUsers([...users, newUser]);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in duration-1000">
      <div className="w-full max-w-lg">
        {/* Brand Hero */}
        <div className="text-center mb-12 space-y-4">
           <div className="inline-flex items-center justify-center bg-gradient-soft p-5 rounded-[2rem] shadow-2xl shadow-indigo-200 mb-6">
              <Zap className="text-white" size={40} fill="white" />
           </div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tight">Track<span className="text-indigo-600">Pro</span></h1>
           <p className="text-slate-500 font-medium text-lg max-w-sm mx-auto">Master your daily flow with high-performance tracking.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 p-12 border border-slate-100">
          <div className="flex justify-center mb-8 bg-slate-50 p-1.5 rounded-2xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-[1.2rem] font-bold text-sm transition-all ${isLogin ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-[1.2rem] font-bold text-sm transition-all ${!isLogin ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="relative group">
                <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="text" required placeholder="Full Name"
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 transition-all"
                  value={username} onChange={e => setUsername(e.target.value)}
                />
              </div>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="email" required placeholder="Email Address"
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 transition-all"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input 
                type="password" required placeholder="Password"
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 transition-all"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-3 rounded-2xl border border-red-100">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-[1.02] active:scale-95"
            >
              {isLogin ? 'Enter Flow' : 'Create Account'}
              <ArrowRight size={22} />
            </button>
          </form>
        </div>

        <p className="mt-12 text-center text-slate-400 font-bold text-sm tracking-widest uppercase">
          Empowering Consistency Since 2025
        </p>
      </div>
    </div>
  );
};

export default Auth;

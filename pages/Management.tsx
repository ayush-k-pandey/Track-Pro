
import React, { useState, useEffect } from 'react';
import { User, Category, Activity } from '../types';
import { db } from '../services/db';
import { Plus, FolderPlus, Activity as ActivityIcon, Edit2, Trash2, Save, X, Info } from 'lucide-react';
import { COLORS } from '../constants';

const Management: React.FC<{ user: User }> = ({ user }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);
  const [newActName, setNewActName] = useState('');
  const [newActPoints, setNewActPoints] = useState(10);
  const [selectedCatId, setSelectedCatId] = useState('');

  useEffect(() => {
    setCategories(db.getCategories(user.id));
    setActivities(db.getActivities(user.id));
  }, [user.id]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const newCat: Category = { id: `cat-${Date.now()}`, userId: user.id, name: newCatName, color: newCatColor };
    db.saveCategory(newCat);
    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
    setIsAddingCategory(false);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActName || !selectedCatId) return;
    const newAct: Activity = { id: `act-${Date.now()}`, userId: user.id, categoryId: selectedCatId, name: newActName, points: newActPoints };
    db.saveActivity(newAct);
    setActivities(prev => [...prev, newAct]);
    setNewActName('');
    setNewActPoints(10);
    setIsAddingActivity(false);
  };

  const handleUpdateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    db.updateActivity(editingActivity);
    setActivities(prev => prev.map(a => a.id === editingActivity.id ? editingActivity : a));
    setEditingActivity(null);
  };

  const handleDeleteActivity = (id: string) => {
    if (confirm("Remove this from your Daily Master Plan? History remains safe.")) {
      db.deleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-indigo-50/50 border border-slate-100">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Master Plans</h1>
          <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
            <Info size={16} className="text-indigo-400" />
            Activities defined here repeat every single day.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsAddingCategory(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 text-slate-700 rounded-[1.5rem] font-bold hover:bg-slate-100 transition-all border border-slate-100"
          >
            <FolderPlus size={20} className="text-indigo-500" />
            Category
          </button>
          <button 
            onClick={() => setIsAddingActivity(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-lg shadow-indigo-200 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            Activity
          </button>
        </div>
      </header>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map(category => {
          const catActivities = activities.filter(a => a.categoryId === category.id);
          return (
            <section key={category.id} className="bg-white rounded-[2.2rem] p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-12 rounded-2xl" style={{ backgroundColor: category.color }}></div>
                  <div>
                    <h3 className="font-extrabold text-2xl text-slate-900 leading-none">{category.name}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">{catActivities.length} Recurring</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedCatId(category.id); setIsAddingActivity(true); }}
                  className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              <div className="space-y-3">
                {catActivities.map(activity => (
                  <div key={activity.id} className="flex justify-between items-center p-5 bg-slate-50/50 rounded-2xl group/item hover:bg-white border border-transparent hover:border-indigo-100 transition-all">
                    <div>
                      <h4 className="font-bold text-slate-800">{activity.name}</h4>
                      <p className="text-xs font-black text-indigo-500 uppercase tracking-tighter mt-1">{activity.points} points daily</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-item-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingActivity(activity)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteActivity(activity.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {catActivities.length === 0 && (
                  <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                    <p className="text-slate-400 text-sm font-medium italic">Empty category</p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Modals remain similar but with better styling */}
      {isAddingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <form onSubmit={handleAddCategory} className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-3xl font-extrabold mb-8 tracking-tight">New Category</h2>
            <div className="space-y-6">
              <input autoFocus className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category Name" />
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setNewCatColor(c)} className={`w-9 h-9 rounded-2xl border-4 transition-all ${newCatColor === c ? 'scale-110 border-slate-900 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => setIsAddingCategory(false)} className="flex-1 py-4 font-bold text-slate-400">Cancel</button>
              <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg">Create</button>
            </div>
          </form>
        </div>
      )}

      {(isAddingActivity || editingActivity) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <form onSubmit={editingActivity ? handleUpdateActivity : handleAddActivity} className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-3xl font-extrabold mb-8 tracking-tight">{editingActivity ? 'Edit Activity' : 'New Activity'}</h2>
            <div className="space-y-6">
              <input autoFocus className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold" value={editingActivity ? editingActivity.name : newActName} onChange={e => editingActivity ? setEditingActivity({...editingActivity, name: e.target.value}) : setNewActName(e.target.value)} placeholder="Activity Name" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Points</label>
                  <input type="number" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold" value={editingActivity ? editingActivity.points : newActPoints} onChange={e => editingActivity ? setEditingActivity({...editingActivity, points: Number(e.target.value)}) : setNewActPoints(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 px-1 tracking-widest">Category</label>
                  <select className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-bold" value={editingActivity ? editingActivity.categoryId : selectedCatId} onChange={e => editingActivity ? setEditingActivity({...editingActivity, categoryId: e.target.value}) : setSelectedCatId(e.target.value)} required>
                    <option value="">Select...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-10">
              <button type="button" onClick={() => { setIsAddingActivity(false); setEditingActivity(null); }} className="flex-1 py-4 font-bold text-slate-400">Cancel</button>
              <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg">{editingActivity ? 'Save Changes' : 'Add to Plan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Management;


import { User, Category, Activity, DailyTask } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

const DB_KEYS = {
  USERS: 'protrack_users',
  CATEGORIES: 'protrack_categories',
  ACTIVITIES: 'protrack_activities',
  DAILY_TASKS: 'protrack_daily_tasks',
  SESSION: 'protrack_session'
};

export const db = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]'),
  saveUsers: (users: User[]) => localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users)),
  
  getCategories: (userId: string): Category[] => {
    const userCats = JSON.parse(localStorage.getItem(DB_KEYS.CATEGORIES) || '[]');
    return [...DEFAULT_CATEGORIES, ...userCats.filter((c: Category) => c.userId === userId)];
  },
  saveCategory: (category: Category) => {
    const cats = JSON.parse(localStorage.getItem(DB_KEYS.CATEGORIES) || '[]');
    cats.push(category);
    localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(cats));
  },

  getActivities: (userId: string): Activity[] => {
    const acts = JSON.parse(localStorage.getItem(DB_KEYS.ACTIVITIES) || '[]');
    return acts.filter((a: Activity) => a.userId === userId);
  },
  saveActivity: (activity: Activity) => {
    const acts = JSON.parse(localStorage.getItem(DB_KEYS.ACTIVITIES) || '[]');
    acts.push(activity);
    localStorage.setItem(DB_KEYS.ACTIVITIES, JSON.stringify(acts));
  },
  updateActivity: (activity: Activity) => {
    const acts = JSON.parse(localStorage.getItem(DB_KEYS.ACTIVITIES) || '[]');
    const index = acts.findIndex((a: Activity) => a.id === activity.id);
    if (index !== -1) {
      acts[index] = activity;
      localStorage.setItem(DB_KEYS.ACTIVITIES, JSON.stringify(acts));
    }
  },
  deleteActivity: (activityId: string) => {
    const acts = JSON.parse(localStorage.getItem(DB_KEYS.ACTIVITIES) || '[]');
    const filtered = acts.filter((a: Activity) => a.id !== activityId);
    localStorage.setItem(DB_KEYS.ACTIVITIES, JSON.stringify(filtered));
  },

  getDailyTasks: (userId: string, date: string): DailyTask[] => {
    const tasks = JSON.parse(localStorage.getItem(DB_KEYS.DAILY_TASKS) || '[]');
    return tasks.filter((t: DailyTask) => t.userId === userId && t.date === date);
  },

  getOrInitDailyTasks: (userId: string, date: string): { tasks: DailyTask[], isFromTemplate: boolean } => {
    const existing = db.getDailyTasks(userId, date);
    if (existing.length > 0) {
      return { tasks: existing, isFromTemplate: false };
    }
    
    const activities = db.getActivities(userId);
    const synthesized = activities.map(act => ({
      id: `task-${date}-${act.id}`,
      activityId: act.id,
      userId: userId,
      date: date,
      completed: false,
      pointsEarned: act.points
    }));
    
    return { tasks: synthesized, isFromTemplate: true };
  },

  saveDailyTask: (task: DailyTask) => {
    const tasks = JSON.parse(localStorage.getItem(DB_KEYS.DAILY_TASKS) || '[]');
    tasks.push(task);
    localStorage.setItem(DB_KEYS.DAILY_TASKS, JSON.stringify(tasks));
  },

  saveManyDailyTasks: (newTasks: DailyTask[]) => {
    const tasks = JSON.parse(localStorage.getItem(DB_KEYS.DAILY_TASKS) || '[]');
    localStorage.setItem(DB_KEYS.DAILY_TASKS, JSON.stringify([...tasks, ...newTasks]));
  },

  updateDailyTask: (taskId: string, completed: boolean) => {
    const tasks = JSON.parse(localStorage.getItem(DB_KEYS.DAILY_TASKS) || '[]');
    const index = tasks.findIndex((t: DailyTask) => t.id === taskId);
    if (index !== -1) {
      tasks[index].completed = completed;
      localStorage.setItem(DB_KEYS.DAILY_TASKS, JSON.stringify(tasks));
    }
  },

  updateDailyTaskPoints: (taskId: string, points: number) => {
    const tasks = JSON.parse(localStorage.getItem(DB_KEYS.DAILY_TASKS) || '[]');
    const index = tasks.findIndex((t: DailyTask) => t.id === taskId);
    if (index !== -1) {
      tasks[index].pointsEarned = points;
      localStorage.setItem(DB_KEYS.DAILY_TASKS, JSON.stringify(tasks));
    }
  },

  deleteDailyTask: (taskId: string) => {
    const tasks = JSON.parse(localStorage.getItem(DB_KEYS.DAILY_TASKS) || '[]');
    const filtered = tasks.filter((t: DailyTask) => t.id !== taskId);
    localStorage.setItem(DB_KEYS.DAILY_TASKS, JSON.stringify(filtered));
  },
  
  getAllDailyTasks: (userId: string): DailyTask[] => {
    const tasks = JSON.parse(localStorage.getItem(DB_KEYS.DAILY_TASKS) || '[]');
    return tasks.filter((t: DailyTask) => t.userId === userId);
  },

  // Social Methods
  getUserByShareId: (shareId: string): User | null => {
    const users = db.getUsers();
    return users.find(u => u.shareId === shareId.toUpperCase()) || null;
  },

  updateUser: (user: User) => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      db.saveUsers(users);
      // If updating current session user
      const session = db.getSession();
      if (session && session.id === user.id) db.setSession(user);
    }
  },

  setSession: (user: User | null) => {
    if (user) localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
    else localStorage.removeItem(DB_KEYS.SESSION);
  },
  getSession: (): User | null => JSON.parse(localStorage.getItem(DB_KEYS.SESSION) || 'null'),
};

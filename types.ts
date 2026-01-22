
export interface User {
  id: string;
  shareId: string;
  username: string;
  email: string;
  password?: string;
  joinedAt: string;
  friends: string[]; // array of shareIds
  isSharingEnabled: boolean;
}

export interface Category {
  id: string;
  userId: string | 'default';
  name: string;
  color: string;
}

export interface Activity {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  points: number;
}

export interface DailyTask {
  id: string;
  activityId: string;
  userId: string;
  date: string; // ISO Date YYYY-MM-DD
  completed: boolean;
  pointsEarned: number;
}

export interface DailyStats {
  date: string;
  totalPoints: number;
  completedTasks: number;
}

export interface ProductivityInsights {
  summary: string;
  tips: string[];
}

export interface AppState {
  user: User | null;
  categories: Category[];
  activities: Activity[];
  dailyTasks: DailyTask[];
}

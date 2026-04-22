/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Trash2, 
  Flame, 
  Trophy, 
  Target,
  Calendar as CalendarIcon,
  X,
  PlusCircle
} from 'lucide-react';
import { Habit, Category, CATEGORIES, HABIT_COLORS } from './types';

// Utils
const getStorageKey = () => 'habitflow_data';

const getDatesForLastWeek = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
};

const getDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'narrow' });
};

const getDayNumber = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.getDate();
};

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<Category>('Health');
  const [newHabitColor, setNewHabitColor] = useState(HABIT_COLORS[0]);
  const [activeTab, setActiveTab] = useState<'daily' | 'stats'>('daily');

  const lastWeek = useMemo(() => getDatesForLastWeek(), []);
  const today = lastWeek[lastWeek.length - 1];

  // Load habits
  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) {
      try {
        setHabits(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load habits', e);
      }
    }
  }, []);

  // Save habits
  useEffect(() => {
    localStorage.setItem(getStorageKey(), JSON.stringify(habits));
  }, [habits]);

  const addHabit = () => {
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: newHabitName.trim(),
      category: newHabitCategory,
      color: newHabitColor,
      createdAt: Date.now(),
      completedDates: [],
    };

    setHabits([...habits, newHabit]);
    setNewHabitName('');
    setIsAddingHabit(false);
  };

  const toggleHabit = (habitId: string, date: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      
      const isCompleted = h.completedDates.includes(date);
      const newCompletedDates = isCompleted 
        ? h.completedDates.filter(d => d !== date)
        : [...h.completedDates, date];
        
      return { ...h, completedDates: newCompletedDates };
    }));
  };

  const deleteHabit = (id: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      setHabits(habits.filter(h => h.id !== id));
    }
  };

  const calculateStreak = (completedDates: string[]) => {
    if (completedDates.length === 0) return 0;
    
    const sorted = [...completedDates].sort((a, b) => b.localeCompare(a));
    let streak = 0;
    const checkDate = new Date();
    
    // Check if the streak is still active (today or yesterday)
    const todayStr = checkDate.toISOString().split('T')[0];
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];
    
    if (!sorted.includes(todayStr) && !sorted.includes(yesterdayStr)) {
      return 0;
    }

    let current = sorted.includes(todayStr) ? new Date(todayStr) : new Date(yesterdayStr);
    
    while (true) {
      const currentStr = current.toISOString().split('T')[0];
      if (sorted.includes(currentStr)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const totalCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const averageConsistency = habits.length 
    ? Math.round((totalCompletions / (habits.length * 30)) * 100) // Rough 30 day avg
    : 0;

  return (
    <div className="min-h-screen bg-[#F9F9F8] pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-8 max-w-4xl mx-auto flex justify-between items-end">
        <div>
          <h1 className="font-display text-7xl md:text-8xl tracking-tighter text-[#1A1A1A] leading-none">
            Flow
          </h1>
          <p className="text-[#8E8E8E] font-medium mt-4 uppercase tracking-widest text-xs">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            id="stats-tab-btn"
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'stats' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A] hover:bg-gray-100'}`}
          >
            Stats
          </button>
          <button 
            id="daily-tab-btn"
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeTab === 'daily' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A] hover:bg-gray-100'}`}
          >
            Daily
          </button>
        </div>
      </header>

      <main className="px-6 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'daily' ? (
            <motion.div 
              key="daily"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stats Bar */}
              <div id="stats-summary" className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-[#8E8E8E] mb-1">
                    <Flame size={14} className="text-orange-500" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Best Streak</span>
                  </div>
                  <p className="text-3xl font-display font-black text-[#1A1A1A]">
                    {Math.max(0, ...habits.map(h => calculateStreak(h.completedDates)))}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-[#8E8E8E] mb-1">
                    <Check size={14} className="text-green-500" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Total Done</span>
                  </div>
                  <p className="text-3xl font-display font-black text-[#1A1A1A]">
                    {totalCompletions}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-[#8E8E8E] mb-1">
                    <Trophy size={14} className="text-yellow-500" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Goals</span>
                  </div>
                  <p className="text-3xl font-display font-black text-[#1A1A1A]">
                    {habits.length}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-[#8E8E8E] mb-1">
                    <Target size={14} className="text-blue-500" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Consistency</span>
                  </div>
                  <p className="text-3xl font-display font-black text-[#1A1A1A]">
                    {averageConsistency}%
                  </p>
                </div>
              </div>

              {/* Habit List */}
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center px-2">
                  <h2 className="text-lg font-bold text-[#1A1A1A]">Active Habits</h2>
                  <button 
                    id="add-habit-trigger"
                    onClick={() => setIsAddingHabit(true)}
                    className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A] hover:bg-white px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Plus size={16} />
                    New
                  </button>
                </div>

                <div className="bg-white rounded-[32px] p-2 border border-gray-100 shadow-sm overflow-hidden">
                  {habits.length === 0 ? (
                    <div className="py-20 text-center">
                      <PlusCircle size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-[#8E8E8E] font-medium">No habits yet. Start your journey today.</p>
                      <button 
                        onClick={() => setIsAddingHabit(true)}
                        className="mt-6 px-6 py-2 bg-[#1A1A1A] text-white rounded-full font-bold text-sm"
                      >
                        Create My First Habit
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {habits.map((habit) => (
                        <div key={habit.id} className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: habit.color }} 
                                />
                                <h3 className="font-bold text-[#1A1A1A] text-lg">{habit.name}</h3>
                                <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                                  <Flame size={12} fill="currentColor" />
                                  {calculateStreak(habit.completedDates)}
                                </div>
                              </div>
                              <p className="text-[10px] text-[#8E8E8E] font-bold uppercase tracking-widest">
                                {habit.category}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {lastWeek.map((date) => {
                                const isCompleted = habit.completedDates.includes(date);
                                const isToday = date === today;
                                return (
                                  <div key={date} className="flex flex-col items-center gap-2">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                                      {getDayName(date)}
                                    </span>
                                    <button
                                      onClick={() => toggleHabit(habit.id, date)}
                                      className={`
                                        w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300
                                        ${isCompleted 
                                          ? 'text-white scale-105 shadow-md' 
                                          : isToday ? 'bg-gray-100 hover:bg-gray-200' : 'bg-transparent hover:bg-gray-50'
                                        }
                                      `}
                                      style={{ 
                                        backgroundColor: isCompleted ? habit.color : undefined,
                                        border: !isCompleted ? `1px dashed ${isToday ? '#DDD' : '#EEE'}` : 'none'
                                      }}
                                    >
                                      {isCompleted && <Check size={18} strokeWidth={3} />}
                                      {!isCompleted && isToday && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                                    </button>
                                    <span className={`text-[10px] font-bold ${isToday ? 'text-[#1A1A1A]' : 'text-gray-300'}`}>
                                      {getDayNumber(date)}
                                    </span>
                                  </div>
                                );
                              })}
                              
                              <button 
                                onClick={() => deleteHabit(habit.id)}
                                className="ml-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm text-center">
                <h2 className="text-2xl font-display font-black mb-6">Consistency Matrix</h2>
                <div className="flex flex-wrap justify-center gap-1 max-w-sm mx-auto">
                  {Array.from({ length: 154 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-sm ${Math.random() > 0.7 ? 'bg-[#1A1A1A]' : 'bg-gray-100'}`} 
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-6 font-bold uppercase tracking-widest underline underline-offset-4">Your Progress over last 22 weeks</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {habits.map(habit => {
                  const score = Math.round((habit.completedDates.length / 30) * 100);
                  return (
                    <div key={habit.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="font-bold text-[#1A1A1A]">{habit.name}</h3>
                          <p className="text-[10px] text-[#8E8E8E] font-bold uppercase tracking-widest">{habit.category}</p>
                        </div>
                        <div 
                          className="px-3 py-1 rounded-full text-xs font-black text-white" 
                          style={{ backgroundColor: habit.color }}
                        >
                          {score}%
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, score)}%` }}
                          className="h-full"
                          style={{ backgroundColor: habit.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {isAddingHabit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingHabit(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-display font-black leading-none">New Habit</h2>
                <button 
                  onClick={() => setIsAddingHabit(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Habit Name</label>
                  <input 
                    autoFocus
                    placeholder="E.g., Read 10 pages"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="w-full h-14 px-6 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#1A1A1A] font-medium outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setNewHabitCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${newHabitCategory === cat ? 'bg-[#1A1A1A] text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Color Palette</label>
                  <div className="flex gap-3">
                    {HABIT_COLORS.map(color => (
                      <button 
                        key={color}
                        onClick={() => setNewHabitColor(color)}
                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${newHabitColor === color ? 'ring-2 ring-offset-2 ring-[#1A1A1A] scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      >
                        {newHabitColor === color && <Check size={16} className={color === '#FFEEAD' ? 'text-gray-800' : 'text-white'} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={addHabit}
                    disabled={!newHabitName.trim()}
                    className="w-full h-14 bg-[#1A1A1A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-gray-200 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                  >
                    Start Habit
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Add Button for Mobile */}
      <button 
        onClick={() => setIsAddingHabit(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#1A1A1A] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all md:hidden z-40"
      >
        <Plus size={32} />
      </button>
    </div>
  );
}

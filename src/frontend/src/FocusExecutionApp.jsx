import { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Battery,
  BatteryMedium,
  BatteryLow,
  Award,
  TrendingUp,
  Menu,
  Target,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  X,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import TaskEnergyAssistant from './components/TaskEnergyAssistant';
import BrainDumpView from './components/BrainDumpView';
import FocusHomeButton from './components/FocusHomeButton';

// Storage helpers
const STORAGE_KEYS = {
  CURRENT_TASK: 'current-task',
  TASKS_BACKLOG: 'tasks-backlog',
  CURRENT_ENERGY: 'current-energy',
  USER_STATS: 'user-stats',
  BRAIN_DUMP_DRAFT: 'brain-dump-draft',
  BRAIN_DUMP_ITEMS: 'brain-dump-items',
};

async function getStorageItem(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return null;
  }
}

async function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
  }
}

// Energy levels configuration
const ENERGY_LEVELS = {
  DEEP: {
    key: 'DEEP',
    label: 'Deep Focus',
    description: 'Complex thinking & creativity',
    icon: Zap,
    color: '#E07A5F',
  },
  STEADY: {
    key: 'STEADY',
    label: 'Steady Work',
    description: 'Regular productive work',
    icon: Battery,
    color: '#F2A65A',
  },
  LOW: {
    key: 'LOW',
    label: 'Low Energy',
    description: 'Simple but meaningful tasks',
    icon: BatteryMedium,
    color: '#C89F7E',
  },
  NONE: {
    key: 'NONE',
    label: 'No-Brain',
    description: 'Easy, mindless activities',
    icon: BatteryLow,
    color: '#8B7E74',
  },
};

const FRICTION_REASONS = [
  "Didn't know how to start",
  'Too tired / low energy',
  'Forgot a dependency or tool',
  'Lost motivation / unclear why',
  'Got distracted',
  'Takes longer than expected',
];

// Format time as MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function FocusExecutionApp() {
  const [currentEnergy, setCurrentEnergy] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [backlog, setBacklog] = useState([]);
  const [stats, setStats] = useState({ completed: 0, streak: 0, totalTime: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [view, setView] = useState('main'); // 'main' | 'backlog' | 'brainDump'
  const [showAddTask, setShowAddTask] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showFriction, setShowFriction] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showAssistantInModal, setShowAssistantInModal] = useState(false);
  const [energyFilter, setEnergyFilter] = useState('ALL');

  // Brain Dump state
  const [brainDumpDraft, setBrainDumpDraft] = useState('');
  const [brainDumpItems, setBrainDumpItems] = useState([]);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  // Note editing state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Add task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskWhy, setNewTaskWhy] = useState('');
  const [newTaskEnergy, setNewTaskEnergy] = useState('STEADY');
  const [newTaskSteps, setNewTaskSteps] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState('30');

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      const [energy, task, tasks, userStats, dumpDraft, dumpItems] = await Promise.all([
        getStorageItem(STORAGE_KEYS.CURRENT_ENERGY),
        getStorageItem(STORAGE_KEYS.CURRENT_TASK),
        getStorageItem(STORAGE_KEYS.TASKS_BACKLOG),
        getStorageItem(STORAGE_KEYS.USER_STATS),
        getStorageItem(STORAGE_KEYS.BRAIN_DUMP_DRAFT),
        getStorageItem(STORAGE_KEYS.BRAIN_DUMP_ITEMS),
      ]);

      if (energy) setCurrentEnergy(energy);
      if (task) {
        setCurrentTask(task);
        setNoteText(task.note || '');
      }
      if (tasks) setBacklog(tasks);
      if (userStats) setStats(userStats);
      if (dumpDraft) setBrainDumpDraft(dumpDraft);
      if (dumpItems) setBrainDumpItems(dumpItems);

      setIsLoading(false);
    }
    loadData();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  // Persist current task when it changes
  useEffect(() => {
    if (!isLoading) {
      setStorageItem(STORAGE_KEYS.CURRENT_TASK, currentTask);
    }
  }, [currentTask, isLoading]);

  // Persist backlog when it changes
  useEffect(() => {
    if (!isLoading) {
      setStorageItem(STORAGE_KEYS.TASKS_BACKLOG, backlog);
    }
  }, [backlog, isLoading]);

  // Persist stats when they change
  useEffect(() => {
    if (!isLoading) {
      setStorageItem(STORAGE_KEYS.USER_STATS, stats);
    }
  }, [stats, isLoading]);

  // Persist energy when it changes
  useEffect(() => {
    if (!isLoading && currentEnergy) {
      setStorageItem(STORAGE_KEYS.CURRENT_ENERGY, currentEnergy);
    }
  }, [currentEnergy, isLoading]);

  // Persist brain dump draft
  useEffect(() => {
    if (!isLoading) {
      setStorageItem(STORAGE_KEYS.BRAIN_DUMP_DRAFT, brainDumpDraft);
    }
  }, [brainDumpDraft, isLoading]);

  // Persist brain dump items
  useEffect(() => {
    if (!isLoading) {
      setStorageItem(STORAGE_KEYS.BRAIN_DUMP_ITEMS, brainDumpItems);
    }
  }, [brainDumpItems, isLoading]);

  const handleEnergySelect = (energyKey) => {
    setCurrentEnergy(energyKey);
  };

  const handleSelectTask = (task) => {
    setCurrentTask(task);
    setNoteText(task.note || '');
    setBacklog((prev) => prev.filter((t) => t.id !== task.id));
    setView('main');
    setTimerSeconds(0);
    setIsTimerRunning(false);
  };

  const handleToggleStep = (stepIndex) => {
    if (!currentTask) return;
    const completedSteps = currentTask.completedSteps || [];
    const newCompleted = completedSteps.includes(stepIndex)
      ? completedSteps.filter((i) => i !== stepIndex)
      : [...completedSteps, stepIndex];

    setCurrentTask({ ...currentTask, completedSteps: newCompleted });
  };

  const handleCompleteTask = () => {
    if (!currentTask) return;

    const timeInMinutes = Math.round(timerSeconds / 60);
    setStats((prev) => ({
      completed: prev.completed + 1,
      streak: prev.streak + 1,
      totalTime: prev.totalTime + timeInMinutes,
    }));

    setCurrentTask(null);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setNoteText('');
  };

  const handleSkipTask = () => {
    setShowFriction(true);
  };

  const handleFrictionSelect = (reason) => {
    if (!currentTask) return;

    const updatedTask = {
      ...currentTask,
      lastFriction: { reason, timestamp: Date.now() },
    };

    setBacklog((prev) => [...prev, updatedTask]);
    setStats((prev) => ({ ...prev, streak: 0 }));
    setCurrentTask(null);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setNoteText('');
    setShowFriction(false);
  };

  const handleAddTask = (newTask) => {
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: newTask.title,
      why: newTask.why || '',
      energy: newTask.energy,
      steps: newTask.steps || [],
      estimatedMinutes: newTask.estimatedMinutes || 30,
      completedSteps: [],
      note: '',
      lastFriction: null,
    };
    setBacklog((prev) => [...prev, task]);
    setShowAddTask(false);
    resetAddTaskForm();
  };

  const resetAddTaskForm = () => {
    setNewTaskTitle('');
    setNewTaskWhy('');
    setNewTaskEnergy('STEADY');
    setNewTaskSteps('');
    setNewTaskEstimate('30');
  };

  const handleSaveNote = () => {
    if (!currentTask) return;
    setCurrentTask({ ...currentTask, note: noteText });
    setIsEditingNote(false);
  };

  const handleApplySuggestion = (category) => {
    setNewTaskEnergy(category);
    setShowAssistantInModal(false);
  };

  const handleAddBrainDumpItemsToBacklog = (items) => {
    const newTasks = items.map((item) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: item.text,
      why: '',
      energy: item.selectedCategory,
      steps: [],
      estimatedMinutes: 30,
      completedSteps: [],
      note: '',
      lastFriction: null,
    }));

    setBacklog((prev) => [...prev, ...newTasks]);
  };

  const handleClearBrainDump = () => {
    setBrainDumpDraft('');
    setBrainDumpItems([]);
  };

  // Centralized "go home" handler that closes all modals and returns to main view
  const handleGoHome = () => {
    // Close all modals
    setShowAddTask(false);
    setShowStats(false);
    setShowFriction(false);
    setShowAssistant(false);
    setShowAssistantInModal(false);
    
    // Return to main view
    setView('main');
  };

  const filteredBacklog =
    energyFilter === 'ALL'
      ? backlog
      : backlog.filter((task) => task.energy === energyFilter);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F7F3E9] via-[#FDF8ED] to-[#F7F3E9]">
        <div className="text-[#8B7355] text-xl font-['Work_Sans']">Loading...</div>
      </div>
    );
  }

  // Brain Dump View
  if (view === 'brainDump') {
    return (
      <BrainDumpView
        energyLevels={ENERGY_LEVELS}
        onAddToBacklog={handleAddBrainDumpItemsToBacklog}
        onClose={() => setView('main')}
        onFocusHome={handleGoHome}
        initialDraft={brainDumpDraft}
        initialItems={brainDumpItems}
        onDraftChange={setBrainDumpDraft}
        onItemsChange={setBrainDumpItems}
        onClear={handleClearBrainDump}
      />
    );
  }

  // Energy Selection Screen
  if (!currentEnergy) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F3E9] via-[#FDF8ED] to-[#F7F3E9] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl animate-slide-up">
          <h1 className="text-5xl font-['Crimson_Pro'] text-[#3E3833] text-center mb-4">
            How's your energy?
          </h1>
          <p className="text-[#8B7355] text-center mb-12 font-['Work_Sans']">
            Choose your current energy level to see matching tasks
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(ENERGY_LEVELS).map((level, index) => {
              const Icon = level.icon;
              return (
                <button
                  key={level.key}
                  onClick={() => handleEnergySelect(level.key)}
                  className="p-8 bg-white rounded-2xl shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:scale-105 text-left animate-stagger"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <Icon size={40} style={{ color: level.color }} className="mb-4" />
                  <h3
                    className="text-2xl font-['Crimson_Pro'] mb-2"
                    style={{ color: level.color }}
                  >
                    {level.label}
                  </h3>
                  <p className="text-[#8B7355] font-['Work_Sans']">{level.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Main view (Current Task or Empty State)
  if (view === 'main') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F3E9] via-[#FDF8ED] to-[#F7F3E9]">
        {/* Header */}
        <header className="border-b border-[#8B7355]/10 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Focus</h1>
            <div className="flex items-center gap-4">
              {/* Always show streak, even when 0 */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F2A65A]/10 rounded-full">
                <Award size={18} style={{ color: '#F2A65A' }} />
                <span className="text-sm font-['Work_Sans'] text-[#3E3833]">
                  Current streak: {stats.streak}
                </span>
              </div>
              <button
                onClick={() => setView('brainDump')}
                className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all hover:scale-105"
                title="Brain Dump"
              >
                <Lightbulb size={20} style={{ color: '#E07A5F' }} />
              </button>
              <button
                onClick={() => setShowAssistant(true)}
                className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all hover:scale-105"
                title="Energy Assistant"
              >
                <Sparkles size={20} style={{ color: '#E07A5F' }} />
              </button>
              <button
                onClick={() => setShowStats(true)}
                className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all hover:scale-105"
              >
                <TrendingUp size={20} style={{ color: '#E07A5F' }} />
              </button>
              <button
                onClick={() => setView('backlog')}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all hover:scale-105"
              >
                <Menu size={20} style={{ color: '#E07A5F' }} />
                <span className="text-sm font-['Work_Sans'] text-[#3E3833]">{backlog.length}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-12">
          {!currentTask ? (
            // Empty State
            <div className="text-center py-20 animate-slide-up">
              <div className="text-8xl mb-6">🌿</div>
              <h2 className="text-4xl font-['Crimson_Pro'] text-[#3E3833] mb-4">All clear</h2>
              <p className="text-[#8B7355] mb-8 font-['Work_Sans']">
                Ready to focus on your next task?
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setView('backlog')}
                  className="px-8 py-3 bg-[#E07A5F] text-white rounded-xl font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105"
                >
                  Choose Next Task
                </button>
                <button
                  onClick={() => setView('brainDump')}
                  className="px-8 py-3 bg-white text-[#E07A5F] border-2 border-[#E07A5F] rounded-xl font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Lightbulb size={20} />
                  Brain Dump
                </button>
              </div>
            </div>
          ) : (
            // Current Task View
            <div className="space-y-8 animate-slide-up">
              {/* Timer and Estimated Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-warm">
                  <div className="text-sm text-[#8B7355] mb-2 font-['Work_Sans']">Timer</div>
                  <div
                    className={`text-5xl font-['Crimson_Pro'] text-[#3E3833] mb-4 ${
                      isTimerRunning ? 'animate-pulse-slow' : ''
                    }`}
                  >
                    {formatTime(timerSeconds)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="flex-1 px-4 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
                      {isTimerRunning ? 'Pause' : 'Play'}
                    </button>
                    <button
                      onClick={() => {
                        setTimerSeconds(0);
                        setIsTimerRunning(false);
                      }}
                      className="px-4 py-2 bg-[#8B7E74]/10 text-[#3E3833] rounded-lg hover:scale-105 transition-all"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-warm">
                  <div className="text-sm text-[#8B7355] mb-2 font-['Work_Sans']">Estimated</div>
                  <div className="text-5xl font-['Crimson_Pro'] text-[#3E3833] mb-4">
                    {currentTask.estimatedMinutes}
                    <span className="text-2xl text-[#8B7355]">min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} style={{ color: '#8B7355' }} />
                    <span className="text-sm text-[#8B7355] font-['Work_Sans']">
                      {(() => {
                        const Icon = ENERGY_LEVELS[currentTask.energy].icon;
                        return (
                          <span className="inline-flex items-center gap-1">
                            <Icon size={16} style={{ color: ENERGY_LEVELS[currentTask.energy].color }} />
                            {ENERGY_LEVELS[currentTask.energy].label}
                          </span>
                        );
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Title and Why */}
              <div className="bg-white rounded-2xl p-8 shadow-warm">
                <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833] mb-4">
                  {currentTask.title}
                </h2>
                {currentTask.why && (
                  <p className="text-[#8B7355] font-['Work_Sans'] italic">{currentTask.why}</p>
                )}
              </div>

              {/* Steps */}
              {currentTask.steps && currentTask.steps.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-warm">
                  <h3 className="text-xl font-['Crimson_Pro'] text-[#3E3833] mb-4">Steps</h3>
                  <div className="space-y-3">
                    {currentTask.steps.map((step, index) => {
                      const isCompleted = (currentTask.completedSteps || []).includes(index);
                      return (
                        <button
                          key={index}
                          onClick={() => handleToggleStep(index)}
                          className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-[#F7F3E9] transition-all text-left"
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                              isCompleted
                                ? 'bg-[#E07A5F] border-[#E07A5F]'
                                : 'border-[#8B7355]/30'
                            }`}
                          >
                            {isCompleted && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                          <span
                            className={`font-['Work_Sans'] ${
                              isCompleted
                                ? 'text-[#8B7355] line-through'
                                : 'text-[#3E3833]'
                            }`}
                          >
                            {step}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="bg-white rounded-2xl p-8 shadow-warm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-['Crimson_Pro'] text-[#3E3833]">Notes</h3>
                  {!isEditingNote && (
                    <button
                      onClick={() => setIsEditingNote(true)}
                      className="text-sm text-[#E07A5F] hover:underline font-['Work_Sans']"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {isEditingNote ? (
                  <div className="space-y-3">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full p-3 border border-[#8B7355]/20 rounded-lg font-['Work_Sans'] text-[#3E3833] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50 min-h-[120px]"
                      placeholder="Add notes about this task..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNote}
                        className="px-4 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] hover:scale-105 transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setNoteText(currentTask.note || '');
                          setIsEditingNote(false);
                        }}
                        className="px-4 py-2 bg-[#8B7E74]/10 text-[#3E3833] rounded-lg font-['Work_Sans'] hover:scale-105 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[#8B7355] font-['Work_Sans'] whitespace-pre-wrap">
                    {currentTask.note || 'No notes yet'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleCompleteTask}
                  className="flex-1 px-6 py-4 bg-[#E07A5F] text-white rounded-xl font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Target size={20} />
                  Complete Task
                </button>
                <button
                  onClick={handleSkipTask}
                  className="px-6 py-4 bg-white text-[#8B7355] border-2 border-[#8B7355]/20 rounded-xl font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Backlog View
  if (view === 'backlog') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F3E9] via-[#FDF8ED] to-[#F7F3E9]">
        {/* Header */}
        <header className="border-b border-[#8B7355]/10 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView('main')}
                className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all hover:scale-105"
              >
                <ChevronRight size={20} style={{ color: '#E07A5F', transform: 'rotate(180deg)' }} />
              </button>
              <h1 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Task Backlog</h1>
            </div>
            <div className="flex items-center gap-4">
              <FocusHomeButton onActivate={handleGoHome} />
              <button
                onClick={() => setShowAddTask(true)}
                className="px-4 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105 flex items-center gap-2"
              >
                <Plus size={18} />
                Add Task
              </button>
            </div>
          </div>
        </header>

        {/* Energy Filter */}
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setEnergyFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-['Work_Sans'] whitespace-nowrap transition-all ${
                energyFilter === 'ALL'
                  ? 'bg-[#E07A5F] text-white shadow-warm'
                  : 'bg-white text-[#8B7355] hover:bg-[#F7F3E9]'
              }`}
            >
              All Tasks
            </button>
            {Object.values(ENERGY_LEVELS).map((level) => {
              const Icon = level.icon;
              return (
                <button
                  key={level.key}
                  onClick={() => setEnergyFilter(level.key)}
                  className={`px-4 py-2 rounded-lg font-['Work_Sans'] whitespace-nowrap transition-all flex items-center gap-2 ${
                    energyFilter === level.key
                      ? 'bg-[#E07A5F] text-white shadow-warm'
                      : 'bg-white text-[#8B7355] hover:bg-[#F7F3E9]'
                  }`}
                >
                  <Icon size={16} style={{ color: energyFilter === level.key ? 'white' : level.color }} />
                  {level.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Task List */}
        <main className="max-w-5xl mx-auto px-4 pb-12">
          {filteredBacklog.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-[#8B7355] font-['Work_Sans']">
                {energyFilter === 'ALL'
                  ? 'No tasks in backlog. Add one to get started!'
                  : `No ${ENERGY_LEVELS[energyFilter].label} tasks`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBacklog.map((task) => {
                const Icon = ENERGY_LEVELS[task.energy].icon;
                return (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className="w-full bg-white rounded-2xl p-6 shadow-warm hover:shadow-warm-lg transition-all hover:scale-[1.02] text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-['Crimson_Pro'] text-[#3E3833] mb-2">
                          {task.title}
                        </h3>
                        {task.why && (
                          <p className="text-sm text-[#8B7355] font-['Work_Sans'] italic mb-3">
                            {task.why}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-[#8B7355] font-['Work_Sans']">
                          <span className="flex items-center gap-1">
                            <Icon size={16} style={{ color: ENERGY_LEVELS[task.energy].color }} />
                            {ENERGY_LEVELS[task.energy].label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={16} />
                            {task.estimatedMinutes} min
                          </span>
                          {task.steps && task.steps.length > 0 && (
                            <span>{task.steps.length} steps</span>
                          )}
                        </div>
                        {task.lastFriction && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-[#E07A5F] font-['Work_Sans']">
                            <AlertCircle size={16} />
                            Last friction: {task.lastFriction.reason}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={24} style={{ color: '#8B7355' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Modals
  return (
    <>
      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-warm-lg animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Add New Task</h2>
              <div className="flex items-center gap-2">
                <FocusHomeButton onActivate={handleGoHome} />
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    resetAddTaskForm();
                  }}
                  className="p-2 hover:bg-[#8B7E74]/10 rounded-lg transition-all"
                >
                  <X size={24} style={{ color: '#8B7355' }} />
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTask({
                  title: newTaskTitle,
                  why: newTaskWhy,
                  energy: newTaskEnergy,
                  steps: newTaskSteps
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                  estimatedMinutes: parseInt(newTaskEstimate) || 30,
                });
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-['Work_Sans'] text-[#3E3833] mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-3 border border-[#8B7355]/20 rounded-lg font-['Work_Sans'] text-[#3E3833] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50"
                  placeholder="What do you need to do?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-['Work_Sans'] text-[#3E3833] mb-2">
                  Why is this important?
                </label>
                <input
                  type="text"
                  value={newTaskWhy}
                  onChange={(e) => setNewTaskWhy(e.target.value)}
                  className="w-full p-3 border border-[#8B7355]/20 rounded-lg font-['Work_Sans'] text-[#3E3833] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50"
                  placeholder="Connect to your goals..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-['Work_Sans'] text-[#3E3833]">
                    Energy Level *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAssistantInModal(true)}
                    className="text-sm text-[#E07A5F] hover:underline font-['Work_Sans'] flex items-center gap-1"
                  >
                    <Sparkles size={14} />
                    Get suggestion
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(ENERGY_LEVELS).map((level) => {
                    const Icon = level.icon;
                    return (
                      <button
                        key={level.key}
                        type="button"
                        onClick={() => setNewTaskEnergy(level.key)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          newTaskEnergy === level.key
                            ? 'border-[#E07A5F] bg-[#E07A5F]/5'
                            : 'border-[#8B7355]/20 hover:border-[#8B7355]/40'
                        }`}
                      >
                        <Icon size={24} style={{ color: level.color }} className="mb-2" />
                        <div className="text-sm font-['Work_Sans'] text-[#3E3833]">
                          {level.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-['Work_Sans'] text-[#3E3833] mb-2">
                  Steps (one per line)
                </label>
                <textarea
                  value={newTaskSteps}
                  onChange={(e) => setNewTaskSteps(e.target.value)}
                  className="w-full p-3 border border-[#8B7355]/20 rounded-lg font-['Work_Sans'] text-[#3E3833] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50 min-h-[120px]"
                  placeholder="Break it down into steps..."
                />
              </div>

              <div>
                <label className="block text-sm font-['Work_Sans'] text-[#3E3833] mb-2">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={newTaskEstimate}
                  onChange={(e) => setNewTaskEstimate(e.target.value)}
                  className="w-full p-3 border border-[#8B7355]/20 rounded-lg font-['Work_Sans'] text-[#3E3833] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50"
                  min="1"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTask(false);
                    resetAddTaskForm();
                  }}
                  className="px-6 py-3 bg-[#8B7E74]/10 text-[#3E3833] rounded-lg font-['Work_Sans'] hover:scale-105 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-warm-lg animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Your Stats</h2>
              <div className="flex items-center gap-2">
                <FocusHomeButton onActivate={handleGoHome} />
                <button
                  onClick={() => setShowStats(false)}
                  className="p-2 hover:bg-[#8B7E74]/10 rounded-lg transition-all"
                >
                  <X size={24} style={{ color: '#8B7355' }} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#F7F3E9] rounded-xl p-6">
                <div className="text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                  Tasks Completed
                </div>
                <div className="text-4xl font-['Crimson_Pro'] text-[#3E3833]">
                  {stats.completed}
                </div>
              </div>

              <div className="bg-[#F7F3E9] rounded-xl p-6">
                <div className="text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                  Current Streak
                </div>
                <div className="text-4xl font-['Crimson_Pro'] text-[#3E3833] flex items-center gap-2">
                  {stats.streak}
                  <Award size={32} style={{ color: '#F2A65A' }} />
                </div>
              </div>

              <div className="bg-[#F7F3E9] rounded-xl p-6">
                <div className="text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                  Total Focus Time
                </div>
                <div className="text-4xl font-['Crimson_Pro'] text-[#3E3833]">
                  {stats.totalTime}
                  <span className="text-xl text-[#8B7355]">min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Friction Modal */}
      {showFriction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-warm-lg animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">What happened?</h2>
              <div className="flex items-center gap-2">
                <FocusHomeButton onActivate={handleGoHome} />
                <button
                  onClick={() => setShowFriction(false)}
                  className="p-2 hover:bg-[#8B7E74]/10 rounded-lg transition-all"
                >
                  <X size={24} style={{ color: '#8B7355' }} />
                </button>
              </div>
            </div>

            <p className="text-[#8B7355] mb-6 font-['Work_Sans']">
              Understanding friction helps you improve. Select what got in the way:
            </p>

            <div className="space-y-3">
              {FRICTION_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleFrictionSelect(reason)}
                  className="w-full p-4 bg-[#F7F3E9] hover:bg-[#E07A5F]/10 rounded-lg text-left font-['Work_Sans'] text-[#3E3833] transition-all hover:scale-105"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assistant Modal (standalone) */}
      {showAssistant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-warm-lg animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Energy Assistant</h2>
              <div className="flex items-center gap-2">
                <FocusHomeButton onActivate={handleGoHome} />
                <button
                  onClick={() => setShowAssistant(false)}
                  className="p-2 hover:bg-[#8B7E74]/10 rounded-lg transition-all"
                >
                  <X size={24} style={{ color: '#8B7355' }} />
                </button>
              </div>
            </div>
            <TaskEnergyAssistant energyLevels={ENERGY_LEVELS} />
          </div>
        </div>
      )}

      {/* Assistant Modal (in Add Task) */}
      {showAssistantInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-warm-lg animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Energy Assistant</h2>
              <button
                onClick={() => setShowAssistantInModal(false)}
                className="p-2 hover:bg-[#8B7E74]/10 rounded-lg transition-all"
              >
                <X size={24} style={{ color: '#8B7355' }} />
              </button>
            </div>
            <TaskEnergyAssistant
              energyLevels={ENERGY_LEVELS}
              initialText={newTaskTitle}
              onApply={handleApplySuggestion}
            />
          </div>
        </div>
      )}
    </>
  );
}

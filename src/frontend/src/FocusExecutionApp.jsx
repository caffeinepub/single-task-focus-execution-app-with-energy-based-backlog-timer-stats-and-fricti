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
              {stats.streak > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F2A65A]/10 rounded-full">
                  <Award size={18} style={{ color: '#F2A65A' }} />
                  <span className="text-sm font-['Work_Sans'] text-[#3E3833]">
                    {stats.streak} streak
                  </span>
                </div>
              )}
              {currentEnergy && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-warm">
                  {(() => {
                    const Icon = ENERGY_LEVELS[currentEnergy].icon;
                    return <Icon size={18} style={{ color: ENERGY_LEVELS[currentEnergy].color }} />;
                  })()}
                  <span className="text-sm font-['Work_Sans'] text-[#3E3833]">
                    {ENERGY_LEVELS[currentEnergy].label}
                  </span>
                </div>
              )}
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
                  <div className="text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                    Estimated Time
                  </div>
                  <div className="text-5xl font-['Crimson_Pro'] text-[#3E3833]">
                    {currentTask.estimatedMinutes}
                    <span className="text-2xl text-[#8B7355] ml-2">min</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white rounded-2xl p-4 shadow-warm">
                <div className="flex justify-between text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                  <span>Progress</span>
                  <span>
                    {currentTask.completedSteps?.length || 0} / {currentTask.steps.length} steps
                  </span>
                </div>
                <div className="h-3 bg-[#8B7355]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#E07A5F] to-[#F2A65A] transition-all duration-500 ease-out"
                    style={{
                      width: `${
                        currentTask.steps.length > 0
                          ? ((currentTask.completedSteps?.length || 0) / currentTask.steps.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Why This Matters */}
              {currentTask.why && (
                <div className="bg-white rounded-2xl p-6 shadow-warm border-l-4 border-[#E07A5F]">
                  <div className="text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                    Why this matters
                  </div>
                  <p className="text-[#3E3833] font-['Work_Sans']">{currentTask.why}</p>
                </div>
              )}

              {/* Task Title */}
              <div className="text-center py-8">
                <h2 className="text-5xl font-['Crimson_Pro'] text-[#3E3833] leading-tight">
                  {currentTask.title}
                </h2>
              </div>

              {/* Quick Note */}
              <div className="bg-white rounded-2xl p-6 shadow-warm">
                {!isEditingNote && !currentTask.note ? (
                  <button
                    onClick={() => setIsEditingNote(true)}
                    className="text-[#8B7355] font-['Work_Sans'] hover:text-[#E07A5F] transition-colors"
                  >
                    + Add a quick note
                  </button>
                ) : !isEditingNote ? (
                  <div>
                    <div className="text-sm text-[#8B7355] mb-2 font-['Work_Sans']">Note</div>
                    <p className="text-[#3E3833] font-['Work_Sans'] mb-3">{currentTask.note}</p>
                    <button
                      onClick={() => {
                        setIsEditingNote(true);
                        setNoteText(currentTask.note);
                      }}
                      className="text-sm text-[#E07A5F] hover:underline font-['Work_Sans']"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-[#8B7355] mb-2 font-['Work_Sans']">Note</div>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full px-3 py-2 border border-[#8B7355]/20 rounded-lg font-['Work_Sans'] text-[#3E3833] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30 mb-3"
                      rows={3}
                      placeholder="Add a note about this task..."
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
                          setIsEditingNote(false);
                          setNoteText(currentTask.note || '');
                        }}
                        className="px-4 py-2 bg-[#8B7E74]/10 text-[#3E3833] rounded-lg hover:scale-105 transition-all font-['Work_Sans']"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Steps */}
              {currentTask.steps.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-warm">
                  <div className="text-sm text-[#8B7355] mb-4 font-['Work_Sans']">Steps</div>
                  <div className="space-y-3">
                    {currentTask.steps.map((step, index) => {
                      const isCompleted = currentTask.completedSteps?.includes(index);
                      return (
                        <button
                          key={index}
                          onClick={() => handleToggleStep(index)}
                          className="w-full flex items-start gap-3 text-left hover:bg-[#8B7355]/5 p-2 rounded-lg transition-all"
                        >
                          <div
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-[#E07A5F] border-[#E07A5F]'
                                : 'border-[#8B7355]/30'
                            }`}
                          >
                            {isCompleted && (
                              <svg
                                width="12"
                                height="10"
                                viewBox="0 0 12 10"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M1 5L4.5 8.5L11 1.5"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`flex-1 font-['Work_Sans'] ${
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

              {/* Last Friction */}
              {currentTask.lastFriction && (
                <div className="bg-[#FFF4E6] rounded-2xl p-6 border-l-4 border-[#F2A65A]">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} style={{ color: '#F2A65A' }} className="mt-0.5" />
                    <div>
                      <div className="text-sm text-[#8B7355] mb-1 font-['Work_Sans']">
                        Last friction point
                      </div>
                      <p className="text-[#3E3833] font-['Work_Sans']">
                        {currentTask.lastFriction.reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleCompleteTask}
                  className="flex-1 px-6 py-4 bg-[#E07A5F] text-white rounded-xl font-['Work_Sans'] text-lg shadow-warm hover:shadow-warm-lg transition-all hover:scale-105"
                >
                  Complete Task
                </button>
                <button
                  onClick={handleSkipTask}
                  className="px-6 py-4 bg-white border-2 border-[#8B7355]/20 text-[#3E3833] rounded-xl font-['Work_Sans'] text-lg hover:border-[#E07A5F] hover:text-[#E07A5F] transition-all hover:scale-105"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Stats Modal */}
        {showStats && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-warm-lg animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Your Stats</h2>
                <button
                  onClick={() => setShowStats(false)}
                  className="p-2 hover:bg-[#8B7355]/10 rounded-lg transition-all"
                >
                  <X size={24} style={{ color: '#8B7355' }} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[#F7F3E9] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Target size={24} style={{ color: '#E07A5F' }} />
                    <span className="font-['Work_Sans'] text-[#3E3833]">Completed</span>
                  </div>
                  <span className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                    {stats.completed}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F7F3E9] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Award size={24} style={{ color: '#F2A65A' }} />
                    <span className="font-['Work_Sans'] text-[#3E3833]">Current Streak</span>
                  </div>
                  <span className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                    {stats.streak}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F7F3E9] rounded-xl">
                  <div className="flex items-center gap-3">
                    <Clock size={24} style={{ color: '#C89F7E' }} />
                    <span className="font-['Work_Sans'] text-[#3E3833]">Total Time</span>
                  </div>
                  <span className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                    {stats.totalTime}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Friction Modal */}
        {showFriction && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-warm-lg animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">
                  What got in the way?
                </h2>
                <button
                  onClick={() => setShowFriction(false)}
                  className="p-2 hover:bg-[#8B7355]/10 rounded-lg transition-all"
                >
                  <X size={24} style={{ color: '#8B7355' }} />
                </button>
              </div>
              <p className="text-[#8B7355] mb-6 font-['Work_Sans']">
                Understanding friction helps you improve
              </p>
              <div className="space-y-3">
                {FRICTION_REASONS.map((reason, index) => (
                  <button
                    key={index}
                    onClick={() => handleFrictionSelect(reason)}
                    className="w-full p-4 text-left bg-[#F7F3E9] hover:bg-[#E07A5F]/10 rounded-xl font-['Work_Sans'] text-[#3E3833] transition-all hover:scale-105 animate-stagger"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assistant Modal */}
        {showAssistant && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-warm-lg animate-scale-in flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                  Energy Assistant
                </h2>
                <button
                  onClick={() => setShowAssistant(false)}
                  className="p-2 hover:bg-[#8B7355]/10 rounded-lg transition-all"
                >
                  <X size={24} style={{ color: '#8B7355' }} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <TaskEnergyAssistant />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Backlog View
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F3E9] via-[#FDF8ED] to-[#F7F3E9]">
      {/* Header */}
      <header className="border-b border-[#8B7355]/10 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('main')}
              className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.5 5L7.5 10L12.5 15"
                  stroke="#E07A5F"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Task Backlog</h1>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105"
          >
            <Plus size={20} />
            Add Task
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Energy Filter */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setEnergyFilter('ALL')}
            className={`px-4 py-2 rounded-lg font-['Work_Sans'] whitespace-nowrap transition-all ${
              energyFilter === 'ALL'
                ? 'bg-[#E07A5F] text-white shadow-warm'
                : 'bg-white text-[#3E3833] hover:bg-[#8B7355]/5'
            }`}
          >
            All ({backlog.length})
          </button>
          {Object.values(ENERGY_LEVELS).map((level) => {
            const count = backlog.filter((task) => task.energy === level.key).length;
            return (
              <button
                key={level.key}
                onClick={() => setEnergyFilter(level.key)}
                className={`px-4 py-2 rounded-lg font-['Work_Sans'] whitespace-nowrap transition-all ${
                  energyFilter === level.key
                    ? 'text-white shadow-warm'
                    : 'bg-white hover:bg-[#8B7355]/5'
                }`}
                style={{
                  backgroundColor: energyFilter === level.key ? level.color : undefined,
                  color: energyFilter === level.key ? 'white' : level.color,
                }}
              >
                {level.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Tasks List */}
        {filteredBacklog.length === 0 ? (
          <div className="text-center py-20 animate-slide-up">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833] mb-2">No tasks yet</h2>
            <p className="text-[#8B7355] mb-6 font-['Work_Sans']">
              {energyFilter === 'ALL'
                ? 'Add your first task to get started'
                : `No ${ENERGY_LEVELS[energyFilter].label} tasks`}
            </p>
            {energyFilter === 'ALL' && (
              <button
                onClick={() => setShowAddTask(true)}
                className="px-8 py-3 bg-[#E07A5F] text-white rounded-xl font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105"
              >
                Add Your First Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBacklog.map((task, index) => {
              const energyLevel = ENERGY_LEVELS[task.energy];
              const Icon = energyLevel.icon;
              return (
                <button
                  key={task.id}
                  onClick={() => handleSelectTask(task)}
                  className="w-full bg-white rounded-xl p-6 shadow-warm hover:shadow-warm-lg transition-all hover:scale-[1.02] text-left animate-stagger"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    <Icon size={24} style={{ color: energyLevel.color }} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-['Crimson_Pro'] text-[#3E3833] mb-2">
                        {task.title}
                      </h3>
                      {task.why && (
                        <p className="text-sm text-[#8B7355] mb-3 font-['Work_Sans']">
                          {task.why}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-[#8B7355] font-['Work_Sans']">
                        <span
                          className="px-2 py-1 rounded"
                          style={{ backgroundColor: `${energyLevel.color}15`, color: energyLevel.color }}
                        >
                          {energyLevel.label}
                        </span>
                        {task.steps.length > 0 && <span>{task.steps.length} steps</span>}
                        <span>{task.estimatedMinutes} min</span>
                      </div>
                      {task.lastFriction && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-[#F2A65A]">
                          <AlertCircle size={16} />
                          <span className="font-['Work_Sans']">Had friction last time</span>
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

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-warm-lg animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Add New Task</h2>
              <button
                onClick={() => {
                  setShowAddTask(false);
                  resetAddTaskForm();
                }}
                className="p-2 hover:bg-[#8B7355]/10 rounded-lg transition-all"
              >
                <X size={24} style={{ color: '#8B7355' }} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Task Title */}
              <div>
                <label className="block text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                  What do you need to do? *
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Write project proposal"
                  className="w-full px-4 py-3 border border-[#8B7355]/20 rounded-xl font-['Work_Sans'] text-[#3E3833] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30"
                />
              </div>

              {/* Why */}
              <div>
                <label className="block text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                  Why does this matter?
                </label>
                <textarea
                  value={newTaskWhy}
                  onChange={(e) => setNewTaskWhy(e.target.value)}
                  placeholder="Optional: What's the purpose or impact?"
                  className="w-full px-4 py-3 border border-[#8B7355]/20 rounded-xl font-['Work_Sans'] text-[#3E3833] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30 resize-none"
                  rows={3}
                />
              </div>

              {/* Energy Level */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-[#8B7355] font-['Work_Sans']">
                    Energy Level *
                  </label>
                  <button
                    onClick={() => setShowAssistantInModal(true)}
                    className="flex items-center gap-1 text-sm text-[#E07A5F] hover:underline font-['Work_Sans']"
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
                        onClick={() => setNewTaskEnergy(level.key)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          newTaskEnergy === level.key
                            ? 'border-current shadow-warm'
                            : 'border-[#8B7355]/10 hover:border-[#8B7355]/30'
                        }`}
                        style={{
                          borderColor: newTaskEnergy === level.key ? level.color : undefined,
                        }}
                      >
                        <Icon
                          size={24}
                          style={{ color: level.color }}
                          className="mb-2"
                        />
                        <div
                          className="text-sm font-['Work_Sans'] font-medium"
                          style={{ color: level.color }}
                        >
                          {level.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Steps */}
              <div>
                <label className="block text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                  Steps (one per line)
                </label>
                <textarea
                  value={newTaskSteps}
                  onChange={(e) => setNewTaskSteps(e.target.value)}
                  placeholder="Optional: Break it down into steps"
                  className="w-full px-4 py-3 border border-[#8B7355]/20 rounded-xl font-['Work_Sans'] text-[#3E3833] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30 resize-none"
                  rows={4}
                />
              </div>

              {/* Estimated Time */}
              <div>
                <label className="block text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                  Estimated Time (minutes)
                </label>
                <input
                  type="number"
                  value={newTaskEstimate}
                  onChange={(e) => setNewTaskEstimate(e.target.value)}
                  min="5"
                  step="5"
                  className="w-full px-4 py-3 border border-[#8B7355]/20 rounded-xl font-['Work_Sans'] text-[#3E3833] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    if (!newTaskTitle.trim()) return;
                    handleAddTask({
                      title: newTaskTitle,
                      why: newTaskWhy,
                      energy: newTaskEnergy,
                      steps: newTaskSteps
                        .split('\n')
                        .map((s) => s.trim())
                        .filter((s) => s),
                      estimatedMinutes: parseInt(newTaskEstimate) || 30,
                    });
                  }}
                  disabled={!newTaskTitle.trim()}
                  className="flex-1 px-6 py-3 bg-[#E07A5F] text-white rounded-xl font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Add Task
                </button>
                <button
                  onClick={() => {
                    setShowAddTask(false);
                    resetAddTaskForm();
                  }}
                  className="px-6 py-3 bg-[#8B7E74]/10 text-[#3E3833] rounded-xl font-['Work_Sans'] hover:scale-105 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assistant in Modal */}
      {showAssistantInModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-warm-lg animate-scale-in flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                Get Category Suggestion
              </h2>
              <button
                onClick={() => setShowAssistantInModal(false)}
                className="p-2 hover:bg-[#8B7355]/10 rounded-lg transition-all"
              >
                <X size={24} style={{ color: '#8B7355' }} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <TaskEnergyAssistant
                initialText={newTaskTitle}
                onApply={handleApplySuggestion}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

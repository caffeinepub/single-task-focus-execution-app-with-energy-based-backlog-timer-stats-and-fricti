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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import TaskEnergyAssistant from './components/TaskEnergyAssistant';
import BrainDumpView from './components/BrainDumpView';
import FocusHomeButton from './components/FocusHomeButton';
import AddTaskModal from './components/AddTaskModal';
import StreakDetailsPanel from './components/StreakDetailsPanel';
import BacklogTasksTable from './components/BacklogTasksTable';
import {
  loadStreakCompletedTasks,
  saveStreakCompletedTasks,
  clearStreakCompletedTasks,
} from './lib/streakCompletedTasksStorage';
import { normalizeBacklogTask, normalizeBrainDumpItem } from './lib/taskModels';

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
  const [streakCompletedTasks, setStreakCompletedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [view, setView] = useState('main'); // 'main' | 'backlog' | 'brainDump'
  const [showAddTask, setShowAddTask] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showFriction, setShowFriction] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showAssistantInModal, setShowAssistantInModal] = useState(false);
  const [energyFilter, setEnergyFilter] = useState('ALL');
  const [isStreakPanelOpen, setIsStreakPanelOpen] = useState(false);

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

      // Load streak completed tasks
      const streakTasks = loadStreakCompletedTasks();

      if (energy) setCurrentEnergy(energy);
      if (task) {
        const normalizedTask = normalizeBacklogTask(task);
        setCurrentTask(normalizedTask);
        setNoteText(normalizedTask.note || '');
      }
      if (tasks) {
        const normalizedTasks = tasks.map(normalizeBacklogTask);
        setBacklog(normalizedTasks);
      }
      if (userStats) setStats(userStats);
      if (dumpDraft) setBrainDumpDraft(dumpDraft);
      if (dumpItems) {
        const normalizedItems = dumpItems.map(normalizeBrainDumpItem);
        setBrainDumpItems(normalizedItems);
      }
      setStreakCompletedTasks(streakTasks);

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

  // Persist streak completed tasks when they change
  useEffect(() => {
    if (!isLoading) {
      saveStreakCompletedTasks(streakCompletedTasks);
    }
  }, [streakCompletedTasks, isLoading]);

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
    const completionTimestamp = Date.now();
    
    setStats((prev) => ({
      completed: prev.completed + 1,
      streak: prev.streak + 1,
      totalTime: prev.totalTime + timeInMinutes,
    }));

    // Add completed task to streak list with completion timestamp
    setStreakCompletedTasks((prev) => [
      ...prev,
      {
        title: currentTask.title,
        completedAt: completionTimestamp,
      },
    ]);

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
    
    // Clear streak completed tasks when streak resets
    setStreakCompletedTasks([]);
    clearStreakCompletedTasks();
    
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
      createdAt: Date.now(),
      plannedTimeline: newTask.plannedTimeline || '',
      completedAt: null,
    };
    setBacklog((prev) => [...prev, task]);
    setShowAddTask(false);
  };

  const handleSaveNote = () => {
    if (!currentTask) return;
    setCurrentTask({ ...currentTask, note: noteText });
    setIsEditingNote(false);
  };

  const handleApplySuggestion = (category) => {
    // This is used by the assistant modal (not currently wired in this flow)
    setShowAssistantInModal(false);
  };

  const handleAddBrainDumpItemsToBacklog = (items) => {
    // Create one backlog task per brain dump item, carrying over timestamps and timeline
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
      createdAt: item.createdAt || Date.now(),
      plannedTimeline: item.plannedTimeline || '',
      completedAt: null,
    }));

    setBacklog((prev) => [...prev, ...newTasks]);
  };

  const handleClearBrainDump = () => {
    // Only clear Brain Dump state - never touch backlog
    setBrainDumpDraft('');
    setBrainDumpItems([]);
    // Explicitly persist the cleared Brain Dump state
    setStorageItem(STORAGE_KEYS.BRAIN_DUMP_DRAFT, '');
    setStorageItem(STORAGE_KEYS.BRAIN_DUMP_ITEMS, []);
    // Note: We deliberately do NOT touch STORAGE_KEYS.TASKS_BACKLOG here
  };

  // Centralized "go home" handler that closes all modals and returns to main view
  const handleGoHome = () => {
    // Close all modals
    setShowAddTask(false);
    setShowStats(false);
    setShowFriction(false);
    setShowAssistant(false);
    setShowAssistantInModal(false);
    setIsStreakPanelOpen(false);
    
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

  // Backlog View
  if (view === 'backlog') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F3E9] via-[#FDF8ED] to-[#F7F3E9]">
        {/* Header */}
        <header className="border-b border-[#8B7355]/10 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Task Backlog</h1>
            <div className="flex items-center gap-2">
              <FocusHomeButton onActivate={handleGoHome} />
              <button
                onClick={() => setView('main')}
                className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all"
              >
                <X size={20} style={{ color: '#E07A5F' }} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Filter and Add Task */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEnergyFilter('ALL')}
                className={`px-4 py-2 rounded-lg font-['Work_Sans'] transition-all ${
                  energyFilter === 'ALL'
                    ? 'bg-[#E07A5F] text-white'
                    : 'bg-white text-[#8B7355] hover:bg-[#F7F3E9]'
                }`}
              >
                All ({backlog.length})
              </button>
              {Object.values(ENERGY_LEVELS).map((level) => {
                const count = backlog.filter((t) => t.energy === level.key).length;
                return (
                  <button
                    key={level.key}
                    onClick={() => setEnergyFilter(level.key)}
                    className={`px-4 py-2 rounded-lg font-['Work_Sans'] transition-all ${
                      energyFilter === level.key
                        ? 'text-white'
                        : 'bg-white hover:bg-[#F7F3E9]'
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
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] hover:scale-105 transition-all shadow-warm"
            >
              <Plus size={20} />
              Add Task
            </button>
          </div>

          {/* Backlog Table */}
          <div className="bg-white rounded-2xl shadow-warm overflow-hidden">
            <BacklogTasksTable
              tasks={filteredBacklog}
              energyLevels={ENERGY_LEVELS}
              onSelectTask={handleSelectTask}
            />
          </div>
        </main>
      </div>
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
              {/* Clickable streak indicator with expandable panel */}
              <div className="relative">
                <button
                  onClick={() => setIsStreakPanelOpen(!isStreakPanelOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#F2A65A]/10 rounded-full hover:bg-[#F2A65A]/20 transition-all hover:scale-105"
                >
                  <Award size={18} style={{ color: '#F2A65A' }} />
                  <span className="text-sm font-['Work_Sans'] text-[#3E3833]">
                    Current streak: {stats.streak}
                  </span>
                  {isStreakPanelOpen ? (
                    <ChevronUp size={16} style={{ color: '#F2A65A' }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: '#F2A65A' }} />
                  )}
                </button>
                <StreakDetailsPanel
                  tasks={streakCompletedTasks}
                  isOpen={isStreakPanelOpen}
                />
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
                      isTimerRunning ? 'animate-pulse' : ''
                    }`}
                  >
                    {formatTime(timerSeconds)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] hover:scale-105 transition-all"
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause size={18} />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play size={18} />
                          Start
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setTimerSeconds(0);
                        setIsTimerRunning(false);
                      }}
                      className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all"
                      title="Reset timer"
                    >
                      <RotateCcw size={18} style={{ color: '#E07A5F' }} />
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-warm">
                  <div className="text-sm text-[#8B7355] mb-2 font-['Work_Sans']">
                    Estimated Time
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={32} style={{ color: '#F2A65A' }} />
                    <span className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">
                      {currentTask.estimatedMinutes} min
                    </span>
                  </div>
                  <div className="text-sm text-[#8B7355] font-['Work_Sans']">
                    Energy: {ENERGY_LEVELS[currentTask.energy]?.label}
                  </div>
                </div>
              </div>

              {/* Task Details */}
              <div className="bg-white rounded-2xl p-8 shadow-warm">
                <h2 className="text-3xl font-['Crimson_Pro'] text-[#3E3833] mb-4">
                  {currentTask.title}
                </h2>

                {currentTask.why && (
                  <div className="mb-6 p-4 bg-[#F2A65A]/10 rounded-xl">
                    <div className="text-sm text-[#8B7355] mb-1 font-['Work_Sans']">Why this matters:</div>
                    <p className="text-[#3E3833] font-['Work_Sans']">{currentTask.why}</p>
                  </div>
                )}

                {currentTask.steps && currentTask.steps.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-['Crimson_Pro'] text-[#3E3833] mb-3">Steps</h3>
                    <div className="space-y-2">
                      {currentTask.steps.map((step, index) => {
                        const isCompleted = currentTask.completedSteps?.includes(index);
                        return (
                          <button
                            key={index}
                            onClick={() => handleToggleStep(index)}
                            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-[#F7F3E9] transition-all text-left"
                          >
                            <div
                              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isCompleted
                                  ? 'bg-[#E07A5F] border-[#E07A5F]'
                                  : 'border-[#8B7355]/30'
                              }`}
                            >
                              {isCompleted && <ChevronRight size={14} className="text-white" />}
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

                {/* Notes Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-['Crimson_Pro'] text-[#3E3833]">Notes</h3>
                    {!isEditingNote && (
                      <button
                        onClick={() => setIsEditingNote(true)}
                        className="text-sm text-[#E07A5F] hover:underline font-['Work_Sans']"
                      >
                        {currentTask.note ? 'Edit' : 'Add note'}
                      </button>
                    )}
                  </div>
                  {isEditingNote ? (
                    <div>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add notes, learnings, or blockers..."
                        className="w-full h-32 p-3 border border-[#8B7355]/20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30 font-['Work_Sans']"
                      />
                      <div className="mt-2 flex items-center gap-2">
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
                          className="px-4 py-2 text-[#8B7355] hover:bg-[#F7F3E9] rounded-lg font-['Work_Sans'] transition-all"
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
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCompleteTask}
                    className="flex-1 px-6 py-3 bg-[#E07A5F] text-white rounded-xl font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105"
                  >
                    Complete Task
                  </button>
                  <button
                    onClick={handleSkipTask}
                    className="px-6 py-3 bg-white text-[#8B7355] border-2 border-[#8B7355]/20 rounded-xl font-['Work_Sans'] hover:border-[#E07A5F] hover:text-[#E07A5F] transition-all"
                  >
                    Skip / Friction
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Modals */}
        {showAddTask && (
          <AddTaskModal
            isOpen={showAddTask}
            onClose={() => setShowAddTask(false)}
            onAdd={handleAddTask}
            energyLevels={ENERGY_LEVELS}
          />
        )}

        {showStats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-warm-lg animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">Your Stats</h2>
                <button
                  onClick={() => setShowStats(false)}
                  className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all"
                >
                  <X size={20} style={{ color: '#E07A5F' }} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-[#F7F3E9] rounded-xl">
                  <span className="text-[#8B7355] font-['Work_Sans']">Tasks Completed</span>
                  <span className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                    {stats.completed}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F2A65A]/10 rounded-xl">
                  <span className="text-[#8B7355] font-['Work_Sans']">Current Streak</span>
                  <span className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                    {stats.streak}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#E07A5F]/10 rounded-xl">
                  <span className="text-[#8B7355] font-['Work_Sans']">Total Focus Time</span>
                  <span className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                    {stats.totalTime} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showFriction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-warm-lg animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                  What caused friction?
                </h2>
                <button
                  onClick={() => setShowFriction(false)}
                  className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all"
                >
                  <X size={20} style={{ color: '#E07A5F' }} />
                </button>
              </div>

              <p className="text-[#8B7355] mb-6 font-['Work_Sans']">
                Understanding friction helps you improve future task planning
              </p>

              <div className="space-y-2">
                {FRICTION_REASONS.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleFrictionSelect(reason)}
                    className="w-full p-4 text-left bg-[#F7F3E9] hover:bg-[#E07A5F]/10 rounded-xl transition-all font-['Work_Sans'] text-[#3E3833]"
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-[#F2A65A]/10 rounded-xl flex items-start gap-2">
                <AlertCircle size={18} style={{ color: '#F2A65A' }} className="mt-0.5" />
                <p className="text-sm text-[#8B7355] font-['Work_Sans']">
                  This will reset your streak and return the task to your backlog
                </p>
              </div>
            </div>
          </div>
        )}

        {showAssistant && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-warm-lg animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                  Energy Assistant
                </h2>
                <button
                  onClick={() => setShowAssistant(false)}
                  className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all"
                >
                  <X size={20} style={{ color: '#E07A5F' }} />
                </button>
              </div>
              <TaskEnergyAssistant energyLevels={ENERGY_LEVELS} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

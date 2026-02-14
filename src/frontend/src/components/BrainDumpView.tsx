import { useState, useEffect } from 'react';
import { Trash2, Plus, ChevronDown, Check, Mic, MicOff, ListTodo } from 'lucide-react';
import { classifyTaskEnergy, type EnergyCategory } from '../lib/taskEnergyClassifier';
import { extractTasksFromBrainDump } from '../lib/brainDumpTaskExtractor';
import { useSpeechToText } from '../hooks/useSpeechToText';
import FocusHomeButton from './FocusHomeButton';

interface BrainDumpItem {
  id: string;
  text: string;
  suggestedCategory: EnergyCategory;
  selectedCategory: EnergyCategory;
  categoryOverridden: boolean; // Track if user manually changed category
}

interface BrainDumpViewProps {
  energyLevels: Record<string, { key: string; label: string; color: string }>;
  onAddToBacklog: (items: BrainDumpItem[]) => void;
  onClose: () => void;
  onFocusHome?: () => void;
  initialDraft?: string;
  initialItems?: BrainDumpItem[];
  onDraftChange?: (draft: string) => void;
  onItemsChange?: (items: BrainDumpItem[]) => void;
  onClear?: () => void;
}

export default function BrainDumpView({
  energyLevels,
  onAddToBacklog,
  onClose,
  onFocusHome,
  initialDraft = '',
  initialItems = [],
  onDraftChange,
  onItemsChange,
  onClear,
}: BrainDumpViewProps) {
  const [draftText, setDraftText] = useState(initialDraft);
  const [items, setItems] = useState<BrainDumpItem[]>(initialItems);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const {
    isListening,
    isSupported,
    error: speechError,
    startListening,
    stopListening,
    transcript,
    resetTranscript,
  } = useSpeechToText();

  // Persist draft changes
  useEffect(() => {
    if (onDraftChange) {
      onDraftChange(draftText);
    }
  }, [draftText, onDraftChange]);

  // Persist items changes
  useEffect(() => {
    if (onItemsChange) {
      onItemsChange(items);
    }
  }, [items, onItemsChange]);

  // Append transcript to draft text
  useEffect(() => {
    if (transcript) {
      setDraftText(prev => {
        const separator = prev && !prev.endsWith('\n') && !prev.endsWith(' ') ? ' ' : '';
        return prev + separator + transcript;
      });
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Cleanup: stop listening on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isListening, stopListening]);

  const handleConvertToTasks = () => {
    if (!draftText.trim()) return;

    // Use the improved task extractor to parse the brain dump
    const extractedTasks = extractTasksFromBrainDump(draftText);

    // Create items with suggested categories
    const newItems: BrainDumpItem[] = extractedTasks.map((text) => {
      const classification = classifyTaskEnergy(text);
      const category =
        'category' in classification ? classification.category : 'STEADY';

      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        suggestedCategory: category,
        selectedCategory: category,
        categoryOverridden: false, // Initially not overridden
      };
    });

    setItems([...items, ...newItems]);
    setDraftText('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleEditItem = (id: string, newText: string) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const classification = classifyTaskEnergy(newText);
          const category =
            'category' in classification ? classification.category : 'STEADY';
          
          // Update suggestion always, but only update selected if not manually overridden
          return {
            ...item,
            text: newText,
            suggestedCategory: category,
            selectedCategory: item.categoryOverridden ? item.selectedCategory : category,
          };
        }
        return item;
      })
    );
  };

  const handleChangeCategoryForItem = (id: string, category: EnergyCategory) => {
    setItems(
      items.map((item) => 
        item.id === id 
          ? { ...item, selectedCategory: category, categoryOverridden: true } 
          : item
      )
    );
    setExpandedCategory(null);
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddSingleItem = (item: BrainDumpItem) => {
    onAddToBacklog([item]);
    handleRemoveItem(item.id);
  };

  const handleAddSelected = () => {
    const itemsToAdd = items.filter((item) => selectedItems.has(item.id));
    if (itemsToAdd.length === 0) return;

    onAddToBacklog(itemsToAdd);
    setItems(items.filter((item) => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  };

  const handleAddAll = () => {
    if (items.length === 0) return;
    onAddToBacklog(items);
    setItems([]);
    setSelectedItems(new Set());
  };

  const handleClearAll = () => {
    setDraftText('');
    setItems([]);
    setSelectedItems(new Set());
    if (onClear) {
      onClear();
    }
  };

  const handleToggleMicrophone = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F3E9] via-[#FDF8ED] to-[#F7F3E9]">
      {/* Header */}
      <header className="border-b border-[#8B7355]/10 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
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
            <h1 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Brain Dump</h1>
          </div>
          <div className="flex items-center gap-2">
            {onFocusHome && <FocusHomeButton onActivate={onFocusHome} />}
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm font-['Work_Sans'] text-[#8B7355] hover:text-[#E07A5F] transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Draft Input Section */}
        <div className="bg-white rounded-2xl p-6 shadow-warm mb-8 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo size={20} style={{ color: '#E07A5F' }} />
            <h2 className="text-xl font-['Crimson_Pro'] text-[#3E3833]">
              Capture your thoughts
            </h2>
          </div>
          <p className="text-sm text-[#8B7355] mb-4 font-['Work_Sans']">
            Write down everything on your mind. We'll automatically split your brain dump into individual tasks, each with a suggested energy category.
          </p>
          
          {/* Microphone Button and Status */}
          <div className="flex items-center gap-3 mb-3">
            {isSupported ? (
              <>
                <button
                  onClick={handleToggleMicrophone}
                  disabled={!isSupported}
                  className={`p-3 rounded-xl transition-all shadow-warm hover:shadow-warm-lg ${
                    isListening
                      ? 'bg-[#E07A5F] text-white animate-pulse'
                      : 'bg-[#F2A65A] text-white hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                {isListening && (
                  <span className="text-sm font-['Work_Sans'] text-[#E07A5F] animate-pulse">
                    Listening...
                  </span>
                )}
              </>
            ) : (
              <div className="text-sm text-[#8B7355] font-['Work_Sans'] bg-[#8B7355]/5 px-3 py-2 rounded-lg">
                Voice input is not supported in this browser. Please try Chrome, Edge, or Safari.
              </div>
            )}
          </div>

          {/* Speech Error Display */}
          {speechError && (
            <div className="mb-3 text-sm text-red-600 font-['Work_Sans'] bg-red-50 px-3 py-2 rounded-lg">
              {speechError}
            </div>
          )}

          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Type or paste your thoughts here...&#10;• Buy groceries and then pick up dry cleaning&#10;1. Review the design doc&#10;2. Schedule team meeting&#10;Fix bug in login; update documentation&#10;&#10;Or click the microphone to speak!"
            className="w-full h-48 px-4 py-3 border border-[#8B7355]/20 rounded-xl font-['Work_Sans'] text-[#3E3833] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30 resize-none"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleConvertToTasks}
              disabled={!draftText.trim()}
              className="px-6 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              <ListTodo size={18} />
              Convert to Tasks
            </button>
          </div>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">
                Your Items ({items.length})
              </h2>
              <div className="flex items-center gap-2">
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleAddSelected}
                    className="px-4 py-2 bg-[#F2A65A] text-white rounded-lg font-['Work_Sans'] text-sm shadow-warm hover:shadow-warm-lg transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Selected ({selectedItems.size})
                  </button>
                )}
                <button
                  onClick={handleAddAll}
                  className="px-4 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] text-sm shadow-warm hover:shadow-warm-lg transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add All to Backlog
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const energyLevel = energyLevels[item.selectedCategory];
                const isSelected = selectedItems.has(item.id);
                const isCategoryExpanded = expandedCategory === item.id;
                const showSuggestionDiff = item.categoryOverridden && 
                  item.suggestedCategory !== item.selectedCategory;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 shadow-warm hover:shadow-warm-lg transition-all animate-stagger"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleSelectItem(item.id)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#E07A5F] border-[#E07A5F]'
                            : 'border-[#8B7355]/30 hover:border-[#E07A5F]'
                        }`}
                      >
                        {isSelected && <Check size={14} className="text-white" />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => handleEditItem(item.id, e.target.value)}
                          className="w-full px-2 py-1 font-['Work_Sans'] text-[#3E3833] bg-transparent border-b border-transparent hover:border-[#8B7355]/20 focus:border-[#E07A5F] focus:outline-none transition-colors"
                        />

                        {/* Category Selector */}
                        <div className="mt-2 relative">
                          <button
                            onClick={() =>
                              setExpandedCategory(isCategoryExpanded ? null : item.id)
                            }
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#8B7355]/5 transition-all"
                            style={{ backgroundColor: `${energyLevel.color}15` }}
                          >
                            <span
                              className="text-xs font-['Work_Sans'] font-medium"
                              style={{ color: energyLevel.color }}
                            >
                              {energyLevel.label}
                            </span>
                            <ChevronDown
                              size={14}
                              style={{ color: energyLevel.color }}
                              className={`transition-transform ${
                                isCategoryExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* Show suggestion hint if overridden */}
                          {showSuggestionDiff && (
                            <div className="mt-1 text-xs text-[#8B7355] font-['Work_Sans'] flex items-center gap-1">
                              <ListTodo size={12} />
                              <span>
                                Suggested: {energyLevels[item.suggestedCategory].label}
                              </span>
                            </div>
                          )}

                          {/* Category Dropdown */}
                          {isCategoryExpanded && (
                            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-warm-lg border border-[#8B7355]/10 py-1 z-10 min-w-[160px]">
                              {Object.values(energyLevels).map((level) => (
                                <button
                                  key={level.key}
                                  onClick={() =>
                                    handleChangeCategoryForItem(
                                      item.id,
                                      level.key as EnergyCategory
                                    )
                                  }
                                  className="w-full px-4 py-2 text-left text-sm font-['Work_Sans'] hover:bg-[#8B7355]/5 transition-colors flex items-center gap-2"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: level.color }}
                                  />
                                  {level.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddSingleItem(item)}
                          className="p-2 text-[#F2A65A] hover:bg-[#F2A65A]/10 rounded-lg transition-all"
                          title="Add to backlog"
                        >
                          <Plus size={18} />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-[#8B7355] hover:bg-[#8B7355]/10 rounded-lg transition-all"
                          title="Remove"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

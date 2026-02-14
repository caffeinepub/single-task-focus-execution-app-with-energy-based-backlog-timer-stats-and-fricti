import { useState, useEffect } from 'react';
import { Trash2, Plus, ChevronDown, Check, Mic, MicOff, ListTodo, X, Info } from 'lucide-react';
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

  const handleConvertToTasks = () => {
    if (!draftText.trim()) return;

    // Extract tasks using the enhanced local smart parser
    const extractedTexts = extractTasksFromBrainDump(draftText);

    // Create BrainDumpItem for each extracted task with unique ID
    const newItems = extractedTexts.map((text) => {
      const classification = classifyTaskEnergy(text);
      // Handle error case - default to STEADY if classification fails
      const category = 'error' in classification ? 'STEADY' : classification.category;
      
      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        suggestedCategory: category,
        selectedCategory: category,
        categoryOverridden: false,
      };
    });

    setItems(newItems);
    setDraftText('');
  };

  const handleUpdateItemText = (id: string, newText: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        // If user hasn't manually overridden the category, update suggestion
        if (!item.categoryOverridden) {
          const classification = classifyTaskEnergy(newText);
          const category = 'error' in classification ? 'STEADY' : classification.category;
          
          return {
            ...item,
            text: newText,
            suggestedCategory: category,
            selectedCategory: category,
          };
        }

        // User has overridden category, just update text and suggestion (but keep selected)
        const classification = classifyTaskEnergy(newText);
        const category = 'error' in classification ? item.suggestedCategory : classification.category;
        
        return {
          ...item,
          text: newText,
          suggestedCategory: category,
        };
      })
    );
  };

  const handleUpdateItemCategory = (id: string, category: EnergyCategory) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, selectedCategory: category, categoryOverridden: true }
          : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddSelectedToBacklog = () => {
    const selected = items.filter((item) => selectedItems.has(item.id));
    if (selected.length === 0) return;

    onAddToBacklog(selected);
    setItems((prev) => prev.filter((item) => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  };

  const handleAddAllToBacklog = () => {
    if (items.length === 0) return;
    onAddToBacklog(items);
    setItems([]);
    setSelectedItems(new Set());
  };

  const handleClear = () => {
    // Only clear Brain Dump local state
    setDraftText('');
    setItems([]);
    setSelectedItems(new Set());
    // Notify parent to clear Brain Dump persistence (not backlog)
    if (onClear) {
      onClear();
    }
  };

  const handleToggleSpeech = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    const cat = item.selectedCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, BrainDumpItem[]>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F3E9] via-[#FDF8ED] to-[#F7F3E9]">
      {/* Header */}
      <header className="border-b border-[#8B7355]/10 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-['Crimson_Pro'] text-[#3E3833]">Brain Dump</h1>
          <div className="flex items-center gap-2">
            {onFocusHome && <FocusHomeButton onActivate={onFocusHome} />}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all"
            >
              <X size={20} style={{ color: '#E07A5F' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Draft Input Section */}
        <div className="bg-white rounded-2xl p-6 shadow-warm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-['Crimson_Pro'] text-[#3E3833]">
              Dump your thoughts
            </h2>
            <div className="flex items-center gap-2">
              {isSupported && (
                <button
                  onClick={handleToggleSpeech}
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? 'bg-[#E07A5F] text-white animate-pulse'
                      : 'hover:bg-[#E07A5F]/10 text-[#E07A5F]'
                  }`}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
              {draftText && (
                <button
                  onClick={() => setDraftText('')}
                  className="text-sm text-[#8B7355] hover:text-[#E07A5F] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Type or speak your tasks... (e.g., 'Email Alex and schedule dentist, then pay rent')"
            className="w-full h-40 p-4 border border-[#8B7355]/20 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30 font-['Work_Sans'] text-[#3E3833]"
          />

          {speechError && (
            <p className="mt-2 text-sm text-red-500">
              Speech recognition error: {speechError}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-[#8B7355] font-['Work_Sans']">
              Our local smart parser will split your dump into individual tasks
            </p>
            <button
              onClick={handleConvertToTasks}
              disabled={!draftText.trim()}
              className="px-6 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              <ListTodo size={18} />
              Convert to Tasks
            </button>
          </div>
        </div>

        {/* Extracted Tasks Section */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-warm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-['Crimson_Pro'] text-[#3E3833]">
                Extracted Tasks ({items.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="text-sm text-[#8B7355] hover:text-[#E07A5F] transition-colors"
                  title="Clear Brain Dump only - tasks already added to Backlog will remain"
                >
                  Clear All
                </button>
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleAddSelectedToBacklog}
                    className="px-4 py-2 bg-[#F2A65A] text-white rounded-lg font-['Work_Sans'] hover:scale-105 transition-all text-sm"
                  >
                    Add Selected ({selectedItems.size})
                  </button>
                )}
                <button
                  onClick={handleAddAllToBacklog}
                  className="px-4 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] hover:scale-105 transition-all text-sm"
                >
                  Add All to Backlog
                </button>
              </div>
            </div>

            {/* Helper text */}
            <div className="mb-6 flex items-start gap-2 p-3 bg-[#E07A5F]/5 rounded-lg border border-[#E07A5F]/20">
              <Info size={18} className="text-[#E07A5F] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#8B7355] font-['Work_Sans']">
                Clearing Brain Dump only removes items here. Tasks already added to your Backlog will remain safe.
              </p>
            </div>

            {/* Group by category */}
            <div className="space-y-4">
              {Object.entries(energyLevels).map(([key, level]) => {
                const categoryItems = itemsByCategory[key] || [];
                if (categoryItems.length === 0) return null;

                const isExpanded = expandedCategory === key;

                return (
                  <div key={key} className="border border-[#8B7355]/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : key)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F7F3E9] transition-colors"
                      style={{ backgroundColor: isExpanded ? `${level.color}10` : 'transparent' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: level.color }}
                        />
                        <span className="font-['Work_Sans'] text-[#3E3833]">
                          {level.label} ({categoryItems.length})
                        </span>
                      </div>
                      <ChevronDown
                        size={20}
                        className={`text-[#8B7355] transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-3 bg-white">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 border border-[#8B7355]/10 rounded-lg hover:border-[#E07A5F]/30 transition-colors"
                          >
                            <button
                              onClick={() => handleToggleSelect(item.id)}
                              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                selectedItems.has(item.id)
                                  ? 'bg-[#E07A5F] border-[#E07A5F]'
                                  : 'border-[#8B7355]/30 hover:border-[#E07A5F]'
                              }`}
                            >
                              {selectedItems.has(item.id) && (
                                <Check size={14} className="text-white" />
                              )}
                            </button>

                            <div className="flex-1">
                              <input
                                type="text"
                                value={item.text}
                                onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                                className="w-full px-2 py-1 border-b border-transparent hover:border-[#8B7355]/20 focus:border-[#E07A5F] focus:outline-none font-['Work_Sans'] text-[#3E3833]"
                              />

                              <div className="mt-2 flex items-center gap-2">
                                {Object.entries(energyLevels).map(([catKey, catLevel]) => (
                                  <button
                                    key={catKey}
                                    onClick={() =>
                                      handleUpdateItemCategory(item.id, catKey as EnergyCategory)
                                    }
                                    className={`px-3 py-1 rounded-full text-xs font-['Work_Sans'] transition-all ${
                                      item.selectedCategory === catKey
                                        ? 'text-white'
                                        : 'text-[#8B7355] hover:opacity-80'
                                    }`}
                                    style={{
                                      backgroundColor:
                                        item.selectedCategory === catKey
                                          ? catLevel.color
                                          : `${catLevel.color}20`,
                                    }}
                                  >
                                    {catLevel.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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

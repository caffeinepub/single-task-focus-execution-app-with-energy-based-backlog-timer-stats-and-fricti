import { useState, useEffect } from 'react';
import { Trash2, Plus, Lightbulb, ChevronDown, Check } from 'lucide-react';
import { classifyTaskEnergy, type EnergyCategory } from '../lib/taskEnergyClassifier';

interface BrainDumpItem {
  id: string;
  text: string;
  suggestedCategory: EnergyCategory;
  selectedCategory: EnergyCategory;
}

interface BrainDumpViewProps {
  energyLevels: Record<string, { key: string; label: string; color: string }>;
  onAddToBacklog: (items: BrainDumpItem[]) => void;
  onClose: () => void;
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

  const handleConvertToItems = () => {
    if (!draftText.trim()) return;

    // Split by newlines and common bullet separators
    const lines = draftText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        // Remove common bullet prefixes
        return line.replace(/^[-•*]\s*/, '').trim();
      })
      .filter((line) => line.length > 0);

    const newItems: BrainDumpItem[] = lines.map((text) => {
      const classification = classifyTaskEnergy(text);
      const category =
        'category' in classification ? classification.category : 'STEADY';

      return {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        suggestedCategory: category,
        selectedCategory: category,
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
          return {
            ...item,
            text: newText,
            suggestedCategory: category,
            selectedCategory: category,
          };
        }
        return item;
      })
    );
  };

  const handleChangeCategoryForItem = (id: string, category: EnergyCategory) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, selectedCategory: category } : item))
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
            <Lightbulb size={20} style={{ color: '#E07A5F' }} />
            <h2 className="text-xl font-['Crimson_Pro'] text-[#3E3833]">
              Capture your thoughts
            </h2>
          </div>
          <p className="text-sm text-[#8B7355] mb-4 font-['Work_Sans']">
            Write down everything on your mind. Each line will become a separate item that you
            can organize and add to your task list.
          </p>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Type or paste your thoughts here...&#10;• One idea per line&#10;• Use bullets or just newlines&#10;• Don't worry about organizing yet"
            className="w-full h-48 px-4 py-3 border border-[#8B7355]/20 rounded-xl font-['Work_Sans'] text-[#3E3833] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/30 resize-none"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleConvertToItems}
              disabled={!draftText.trim()}
              className="px-6 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Convert to Items
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
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: energyLevel.color }}
                            />
                            <span
                              className="text-sm font-['Work_Sans']"
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

                          {/* Category Dropdown */}
                          {isCategoryExpanded && (
                            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-warm-lg border border-[#8B7355]/10 py-1 z-20 min-w-[200px]">
                              {Object.values(energyLevels).map((level) => (
                                <button
                                  key={level.key}
                                  onClick={() =>
                                    handleChangeCategoryForItem(
                                      item.id,
                                      level.key as EnergyCategory
                                    )
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#8B7355]/5 transition-colors"
                                >
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: level.color }}
                                  />
                                  <span
                                    className="text-sm font-['Work_Sans']"
                                    style={{ color: level.color }}
                                  >
                                    {level.label}
                                  </span>
                                  {item.selectedCategory === level.key && (
                                    <Check size={14} className="ml-auto" style={{ color: level.color }} />
                                  )}
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
                          className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all hover:scale-105"
                          title="Add to backlog"
                        >
                          <Plus size={18} style={{ color: '#E07A5F' }} />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-all hover:scale-105"
                          title="Remove"
                        >
                          <Trash2 size={18} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && !draftText && (
          <div className="text-center py-12 animate-slide-up">
            <div className="text-6xl mb-4">💭</div>
            <p className="text-[#8B7355] font-['Work_Sans']">
              Start by writing down your thoughts above
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

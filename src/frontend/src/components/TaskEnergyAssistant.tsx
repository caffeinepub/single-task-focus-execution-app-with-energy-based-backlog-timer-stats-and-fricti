import { useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { classifyTaskEnergy, type EnergyCategory } from '../lib/taskEnergyClassifier';

interface TaskEnergyAssistantProps {
  onClose?: () => void;
  onApplySuggestion?: (category: EnergyCategory) => void;
  initialText?: string;
  energyLevels: Record<string, { key: string; label: string; color: string; icon: any }>;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  category?: EnergyCategory;
  categoryLabel?: string;
  categoryColor?: string;
}

export default function TaskEnergyAssistant({
  onClose,
  onApplySuggestion,
  initialText = '',
  energyLevels,
}: TaskEnergyAssistantProps) {
  const [input, setInput] = useState(initialText);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: 'Hi! Describe your task and I\'ll suggest which energy category it fits into. 🌿',
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSuggestion, setLastSuggestion] = useState<EnergyCategory | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Simulate a brief processing delay for better UX
    setTimeout(() => {
      const result = classifyTaskEnergy(input.trim());

      if ('error' in result) {
        const errorMessage: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: result.error,
        };
        setMessages(prev => [...prev, errorMessage]);
        setLastSuggestion(null);
      } else {
        const level = energyLevels[result.category];
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: result.explanation,
          category: result.category,
          categoryLabel: level.label,
          categoryColor: level.color,
        };
        setMessages(prev => [...prev, assistantMessage]);
        setLastSuggestion(result.category);
      }

      setIsProcessing(false);
      setInput('');
    }, 300);
  };

  const handleApply = () => {
    if (lastSuggestion && onApplySuggestion) {
      onApplySuggestion(lastSuggestion);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#8B7355]/10">
        <div className="flex items-center gap-2">
          <Sparkles size={20} style={{ color: '#E07A5F' }} />
          <h3 className="text-lg font-['Crimson_Pro'] text-[#3E3833]">Energy Assistant</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#8B7355]/10 rounded-lg transition-colors"
          >
            <X size={20} style={{ color: '#8B7355' }} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-[#E07A5F] text-white'
                  : 'bg-white shadow-warm'
              }`}
            >
              <p className="font-['Work_Sans'] text-sm leading-relaxed">
                {message.content}
              </p>
              {message.category && message.categoryLabel && (
                <div
                  className="mt-3 pt-3 border-t border-[#8B7355]/10 flex items-center gap-2"
                >
                  <div
                    className="px-3 py-1.5 rounded-full text-white text-sm font-['Work_Sans'] font-medium"
                    style={{ backgroundColor: message.categoryColor }}
                  >
                    {message.categoryLabel}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white shadow-warm rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-[#8B7355]/10">
        {lastSuggestion && onApplySuggestion && (
          <button
            onClick={handleApply}
            className="w-full mb-3 px-4 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] hover:scale-105 transition-all shadow-warm"
          >
            Use This Suggestion
          </button>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Describe your task..."
            className="flex-1 px-4 py-2 border border-[#8B7355]/20 rounded-lg font-['Work_Sans'] text-[#3E3833] focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/50"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-[#E07A5F] text-white rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

import { Target } from 'lucide-react';

interface FocusHomeButtonProps {
  onActivate: () => void;
  className?: string;
}

export default function FocusHomeButton({ onActivate, className = '' }: FocusHomeButtonProps) {
  return (
    <button
      onClick={onActivate}
      className={`flex items-center gap-2 px-4 py-2 bg-[#E07A5F] text-white rounded-lg font-['Work_Sans'] shadow-warm hover:shadow-warm-lg transition-all hover:scale-105 ${className}`}
      title="Return to Focus"
    >
      <Target size={18} />
      <span className="text-sm">Focus</span>
    </button>
  );
}

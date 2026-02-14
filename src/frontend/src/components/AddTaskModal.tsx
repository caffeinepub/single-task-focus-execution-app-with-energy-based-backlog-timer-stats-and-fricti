import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import EnergyCategorySelector, { EnergyCategory } from './EnergyCategorySelector';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: {
    title: string;
    why: string;
    energy: EnergyCategory;
    steps: string[];
    estimatedMinutes: number;
  }) => void;
  energyLevels: {
    [key: string]: {
      key: string;
      label: string;
      description: string;
      icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
      color: string;
    };
  };
}

export default function AddTaskModal({
  isOpen,
  onClose,
  onAdd,
  energyLevels,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [energy, setEnergy] = useState<EnergyCategory>('STEADY');
  const [steps, setSteps] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    const stepsArray = steps
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onAdd({
      title: title.trim(),
      why: why.trim(),
      energy,
      steps: stepsArray,
      estimatedMinutes: parseInt(estimatedMinutes) || 30,
    });

    // Reset form
    setTitle('');
    setWhy('');
    setEnergy('STEADY');
    setSteps('');
    setEstimatedMinutes('30');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-warm-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#8B7355]/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">Add Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#8B7355]/10 rounded-lg transition-all"
          >
            <X size={20} style={{ color: '#8B7355' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-sm font-['Work_Sans'] text-[#3E3833] font-medium">
              Task Title *
            </Label>
            <Input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full font-['Work_Sans']"
              required
            />
          </div>

          {/* Why */}
          <div className="space-y-2">
            <Label htmlFor="task-why" className="text-sm font-['Work_Sans'] text-[#3E3833] font-medium">
              Why is this important?
            </Label>
            <Textarea
              id="task-why"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Optional: What's the purpose or motivation?"
              className="w-full font-['Work_Sans'] min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Energy Category Selector */}
          <EnergyCategorySelector
            selected={energy}
            onSelect={setEnergy}
            energyLevels={energyLevels}
          />

          {/* Steps */}
          <div className="space-y-2">
            <Label htmlFor="task-steps" className="text-sm font-['Work_Sans'] text-[#3E3833] font-medium">
              Steps (optional)
            </Label>
            <Textarea
              id="task-steps"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="One step per line&#10;Step 1&#10;Step 2&#10;Step 3"
              className="w-full font-['Work_Sans'] min-h-[100px]"
              rows={4}
            />
            <p className="text-xs text-[#8B7355] font-['Work_Sans']">
              Enter each step on a new line
            </p>
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label htmlFor="task-estimate" className="text-sm font-['Work_Sans'] text-[#3E3833] font-medium">
              Estimated Time (minutes)
            </Label>
            <Input
              id="task-estimate"
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              placeholder="30"
              min="1"
              className="w-full font-['Work_Sans']"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 font-['Work_Sans']"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white font-['Work_Sans'] flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

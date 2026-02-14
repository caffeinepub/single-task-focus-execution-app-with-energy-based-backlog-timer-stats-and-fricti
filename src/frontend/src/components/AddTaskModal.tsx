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
    plannedTimeline?: string;
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
  const [plannedTimeline, setPlannedTimeline] = useState('');

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
      plannedTimeline: plannedTimeline.trim(),
    });

    // Reset form
    setTitle('');
    setWhy('');
    setEnergy('STEADY');
    setSteps('');
    setEstimatedMinutes('30');
    setPlannedTimeline('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-warm-lg animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-['Crimson_Pro'] text-[#3E3833]">Add New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#E07A5F]/10 rounded-lg transition-all"
          >
            <X size={20} style={{ color: '#E07A5F' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-[#3E3833] font-['Work_Sans'] mb-2 block">
              Task Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full font-['Work_Sans']"
              required
            />
          </div>

          {/* Why */}
          <div>
            <Label htmlFor="why" className="text-[#3E3833] font-['Work_Sans'] mb-2 block">
              Why does this matter?
            </Label>
            <Textarea
              id="why"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Understanding the purpose helps maintain motivation..."
              className="w-full h-20 font-['Work_Sans']"
            />
          </div>

          {/* Energy Category */}
          <div>
            <Label className="text-[#3E3833] font-['Work_Sans'] mb-3 block">
              Energy Level Required
            </Label>
            <EnergyCategorySelector
              energyLevels={energyLevels}
              selected={energy}
              onSelect={setEnergy}
            />
          </div>

          {/* Planned Timeline */}
          <div>
            <Label htmlFor="plannedTimeline" className="text-[#3E3833] font-['Work_Sans'] mb-2 block">
              Planned Timeline
            </Label>
            <Input
              id="plannedTimeline"
              type="text"
              value={plannedTimeline}
              onChange={(e) => setPlannedTimeline(e.target.value)}
              placeholder="e.g., Next week, Tomorrow, End of month"
              className="w-full font-['Work_Sans']"
            />
          </div>

          {/* Steps */}
          <div>
            <Label htmlFor="steps" className="text-[#3E3833] font-['Work_Sans'] mb-2 block">
              Steps (one per line)
            </Label>
            <Textarea
              id="steps"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="Break down the task into smaller steps..."
              className="w-full h-32 font-['Work_Sans']"
            />
          </div>

          {/* Estimated Time */}
          <div>
            <Label htmlFor="estimatedMinutes" className="text-[#3E3833] font-['Work_Sans'] mb-2 block">
              Estimated Time (minutes)
            </Label>
            <Input
              id="estimatedMinutes"
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              min="1"
              className="w-full font-['Work_Sans']"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-[#E07A5F] hover:bg-[#E07A5F]/90 text-white font-['Work_Sans']"
            >
              <Plus size={18} className="mr-2" />
              Add Task
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6 font-['Work_Sans']"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

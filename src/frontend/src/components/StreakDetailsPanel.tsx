import { CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface StreakCompletedTask {
  title: string;
  completedAt: number;
}

interface StreakDetailsPanelProps {
  tasks: StreakCompletedTask[];
  isOpen: boolean;
}

export default function StreakDetailsPanel({ tasks, isOpen }: StreakDetailsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-warm-lg border border-[#8B7355]/10 overflow-hidden animate-slide-up z-20">
      <div className="p-4 border-b border-[#8B7355]/10 bg-[#F2A65A]/5">
        <h3 className="text-lg font-['Crimson_Pro'] text-[#3E3833]">
          Current Streak Tasks
        </h3>
        <p className="text-xs text-[#8B7355] font-['Work_Sans'] mt-1">
          {tasks.length === 0
            ? 'Complete tasks to build your streak'
            : `${tasks.length} task${tasks.length === 1 ? '' : 's'} completed`}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-sm text-[#8B7355] font-['Work_Sans']">
              No completed tasks in your current streak yet.
            </p>
            <p className="text-xs text-[#8B7355]/70 font-['Work_Sans'] mt-2">
              Complete a task to start building your streak!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#8B7355]/10">
            {tasks.map((task, index) => (
              <div
                key={`${task.completedAt}-${index}`}
                className="p-4 hover:bg-[#F2A65A]/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="text-[#F2A65A] flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-['Work_Sans'] text-[#3E3833] font-medium break-words">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Clock size={12} className="text-[#8B7355]" />
                      <span className="text-xs text-[#8B7355] font-['Work_Sans']">
                        {format(new Date(task.completedAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

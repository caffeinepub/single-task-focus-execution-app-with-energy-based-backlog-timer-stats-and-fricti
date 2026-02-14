import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { formatDate, formatTime, formatPlannedTimeline, formatCompletedTime } from '../lib/dateTimeFormat';
import type { BacklogTask } from '../lib/taskModels';

interface BacklogTasksTableProps {
  tasks: BacklogTask[];
  energyLevels: Record<string, { key: string; label: string; color: string }>;
  onSelectTask: (task: BacklogTask) => void;
}

export default function BacklogTasksTable({
  tasks,
  energyLevels,
  onSelectTask,
}: BacklogTasksTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-[#8B7355] font-['Work_Sans']">
        No tasks in backlog
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-[#8B7355]/10">
            <TableHead className="font-['Work_Sans'] text-[#3E3833]">Task</TableHead>
            <TableHead className="font-['Work_Sans'] text-[#3E3833]">Energy</TableHead>
            <TableHead className="font-['Work_Sans'] text-[#3E3833]">Creation Date</TableHead>
            <TableHead className="font-['Work_Sans'] text-[#3E3833]">Creation Time</TableHead>
            <TableHead className="font-['Work_Sans'] text-[#3E3833]">Planned Timeline</TableHead>
            <TableHead className="font-['Work_Sans'] text-[#3E3833]">Completed Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const energyLevel = energyLevels[task.energy];
            return (
              <TableRow
                key={task.id}
                className="border-[#8B7355]/10 hover:bg-[#F7F3E9] cursor-pointer transition-colors"
                onClick={() => onSelectTask(task)}
              >
                <TableCell className="font-['Work_Sans'] text-[#3E3833] font-medium">
                  {task.title}
                </TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-['Work_Sans']"
                    style={{
                      backgroundColor: `${energyLevel?.color}20`,
                      color: energyLevel?.color || '#8B7355',
                    }}
                  >
                    {energyLevel?.label || task.energy}
                  </span>
                </TableCell>
                <TableCell className="font-['Work_Sans'] text-[#8B7355]">
                  {formatDate(task.createdAt)}
                </TableCell>
                <TableCell className="font-['Work_Sans'] text-[#8B7355]">
                  {formatTime(task.createdAt)}
                </TableCell>
                <TableCell className="font-['Work_Sans'] text-[#8B7355]">
                  {formatPlannedTimeline(task.plannedTimeline)}
                </TableCell>
                <TableCell className="font-['Work_Sans'] text-[#8B7355]">
                  {formatCompletedTime(task.completedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

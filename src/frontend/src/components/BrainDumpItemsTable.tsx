import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { formatDate, formatTime, formatPlannedTimeline } from '../lib/dateTimeFormat';
import { Input } from './ui/input';
import type { BrainDumpItem } from '../lib/taskModels';

interface BrainDumpItemsTableProps {
  items: BrainDumpItem[];
  energyLevels: Record<string, { key: string; label: string; color: string }>;
  onUpdatePlannedTimeline: (id: string, timeline: string) => void;
}

export default function BrainDumpItemsTable({
  items,
  energyLevels,
  onUpdatePlannedTimeline,
}: BrainDumpItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-[#8B7355] font-['Work_Sans']">
        No extracted tasks yet
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
          {items.map((item) => {
            const energyLevel = energyLevels[item.selectedCategory];
            return (
              <TableRow key={item.id} className="border-[#8B7355]/10">
                <TableCell className="font-['Work_Sans'] text-[#3E3833] font-medium max-w-xs">
                  <div className="truncate" title={item.text}>
                    {item.text}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-['Work_Sans']"
                    style={{
                      backgroundColor: `${energyLevel?.color}20`,
                      color: energyLevel?.color || '#8B7355',
                    }}
                  >
                    {energyLevel?.label || item.selectedCategory}
                  </span>
                </TableCell>
                <TableCell className="font-['Work_Sans'] text-[#8B7355]">
                  {formatDate(item.createdAt)}
                </TableCell>
                <TableCell className="font-['Work_Sans'] text-[#8B7355]">
                  {formatTime(item.createdAt)}
                </TableCell>
                <TableCell>
                  <Input
                    type="text"
                    value={item.plannedTimeline || ''}
                    onChange={(e) => onUpdatePlannedTimeline(item.id, e.target.value)}
                    placeholder="e.g., Next week"
                    className="w-32 h-8 text-sm font-['Work_Sans']"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell className="font-['Work_Sans'] text-[#8B7355]">
                  —
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

import { Zap, Battery, BatteryMedium, BatteryLow } from 'lucide-react';

export type EnergyCategory = 'DEEP' | 'STEADY' | 'LOW' | 'NONE';

interface EnergyCategorySelectorProps {
  selected: EnergyCategory;
  onSelect: (category: EnergyCategory) => void;
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

export default function EnergyCategorySelector({
  selected,
  onSelect,
  energyLevels,
}: EnergyCategorySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-['Work_Sans'] text-[#3E3833] font-medium">
        Energy Category
      </label>
      <div className="grid grid-cols-2 gap-3">
        {Object.values(energyLevels).map((level) => {
          const Icon = level.icon;
          const isSelected = selected === level.key;
          return (
            <button
              key={level.key}
              type="button"
              onClick={() => onSelect(level.key as EnergyCategory)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-current shadow-warm scale-105'
                  : 'border-[#8B7355]/20 hover:border-[#8B7355]/40 hover:scale-102'
              }`}
              style={{
                borderColor: isSelected ? level.color : undefined,
                backgroundColor: isSelected ? `${level.color}10` : 'white',
              }}
            >
              <div className="mb-2">
                <Icon
                  size={24}
                  style={{ color: level.color }}
                />
              </div>
              <div
                className="text-sm font-['Work_Sans'] font-semibold mb-1"
                style={{ color: isSelected ? level.color : '#3E3833' }}
              >
                {level.label}
              </div>
              <div className="text-xs text-[#8B7355] font-['Work_Sans']">
                {level.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

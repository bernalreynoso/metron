import React from 'react';
import * as Icons from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5' }) => {
  const IconComponent = (Icons as Record<string, any>)[name] || Icons.CircleDot;
  return <IconComponent className={className} />;
};

export interface IconCategory {
  category: string;
  icons: string[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    category: 'TIEMPO / CHECKPOINT',
    icons: ['Clock', 'Timer', 'AlarmClock', 'Hourglass', 'Calendar', 'Sunrise', 'Sunset', 'LogIn', 'LogOut', 'CheckCircle2', 'History', 'Watch'],
  },
  {
    category: 'ALIMENTACIÓN',
    icons: ['CupSoda', 'Coffee', 'Droplets', 'Utensils', 'GlassWater', 'Apple', 'Pizza', 'Wine'],
  },
  {
    category: 'SUEÑO',
    icons: ['Moon', 'Bed', 'Sun', 'AlarmClock', 'Sunrise', 'Sunset'],
  },
  {
    category: 'TRABAJO',
    icons: ['Building', 'Briefcase', 'Laptop', 'Clock', 'LogIn', 'LogOut', 'FileText', 'CheckSquare'],
  },
  {
    category: 'EJERCICIO',
    icons: ['Dumbbell', 'Footprints', 'Bike', 'Heart', 'Activity', 'Flame', 'Trophy', 'Timer'],
  },
  {
    category: 'ESTUDIO',
    icons: ['BookOpen', 'Brain', 'GraduationCap', 'School', 'Pencil', 'Lightbulb'],
  },
  {
    category: 'VIDA DIARIA',
    icons: ['Home', 'Car', 'ShoppingBag', 'Sparkles', 'Smile', 'Shield', 'Tv', 'DollarSign', 'Target', 'CircleDot'],
  },
];

// Flat deduplicated array of all available icons
export const AVAILABLE_ICONS = Array.from(
  new Set(ICON_CATEGORIES.flatMap((c) => c.icons))
);

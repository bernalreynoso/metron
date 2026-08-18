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
    category: 'HIGIENE',
    icons: ['ShowerHead', 'Bath', 'Sparkles', 'Droplets', 'Smile', 'Pipette', 'Toilet'],
  },
  {
    category: 'FAMILIA',
    icons: ['Baby', 'Users', 'Heart', 'Home', 'Smile'],
  },
  {
    category: 'TRANSPORTE',
    icons: ['Subway', 'Bus', 'Train', 'Car', 'Bike', 'Footprints', 'Compass'],
  },
  {
    category: 'CASA',
    icons: ['Home', 'Bed', 'Utensils', 'UtensilsCrossed', 'Sparkles', 'Shirt', 'Flame'],
  },
  {
    category: 'ALIMENTACIÓN',
    icons: ['GlassWater', 'CupSoda', 'Coffee', 'Utensils', 'Apple', 'Pizza', 'UtensilsCrossed'],
  },
  {
    category: 'TRABAJO',
    icons: ['Building', 'Building2', 'Briefcase', 'Laptop', 'FileText', 'Users', 'Clock', 'CheckSquare'],
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
    category: 'TIEMPO / RUTINA',
    icons: ['Clock', 'Timer', 'AlarmClock', 'Hourglass', 'Calendar', 'Sunrise', 'Sunset', 'LogIn', 'LogOut', 'CheckCircle2', 'History', 'Watch'],
  },
  {
    category: 'VIDA DIARIA',
    icons: ['Home', 'Car', 'ShoppingBag', 'Sparkles', 'Smile', 'Shield', 'Tv', 'DollarSign', 'Target', 'CircleDot', 'Moon', 'Sun'],
  },
];

// Flat deduplicated array of all available icons
export const AVAILABLE_ICONS = Array.from(
  new Set(ICON_CATEGORIES.flatMap((c) => c.icons))
);

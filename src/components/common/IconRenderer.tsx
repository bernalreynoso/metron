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

export const AVAILABLE_ICONS = [
  'CupSoda',
  'BookOpen',
  'Moon',
  'Building',
  'Dumbbell',
  'Brain',
  'Coffee',
  'Droplets',
  'Heart',
  'Footprints',
  'CheckCircle',
  'Sparkles',
  'Utensils',
  'Tv',
  'Smile',
  'Shield',
  'Activity',
  'Bed',
  'Bike',
  'Target',
];

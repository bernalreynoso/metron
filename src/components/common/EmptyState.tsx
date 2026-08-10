import React from 'react';
import { Scale } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="py-12 px-4 text-center max-w-sm mx-auto bg-[#131315] border border-[#1e1e20] rounded-2xl shadow-lg">
      <div className="w-12 h-12 rounded-2xl bg-[#18181b] border border-[#28282b] flex items-center justify-center text-[#c5a059] mx-auto mb-3">
        <Scale className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-[#e2e2e2] font-serif">{title}</h3>
      <p className="text-xs text-[#888888] mt-1 leading-relaxed font-light">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0c0c0d] flex flex-col items-center justify-center p-4">
      <div className="w-10 h-10 border-2 border-[#c5a059]/20 border-t-[#c5a059] rounded-full animate-spin mb-3" />
      <p className="text-xs font-mono uppercase tracking-widest text-[#888888]">Cargando Metron...</p>
    </div>
  );
};

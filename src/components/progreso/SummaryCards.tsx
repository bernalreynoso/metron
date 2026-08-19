import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity as ActivityIcon } from 'lucide-react';

interface SummaryCardsProps {
  improvingCount: number;
  worseningCount: number;
  stableCount: number;
  insufficientCount: number;
  onSelectCategory?: (category: 'improving' | 'worsening' | 'stable' | 'insufficient') => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  improvingCount,
  worseningCount,
  stableCount,
  insufficientCount,
  onSelectCategory,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Improving */}
      <button
        type="button"
        onClick={() => onSelectCategory?.('improving')}
        className="bg-[#131315] border border-[#1e1e20] hover:border-[#2d4a2d] hover:bg-[#161618] rounded-xl p-3.5 flex items-center space-x-3 text-left transition-all cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-lg bg-[#1a2e1a] border border-[#2d4a2d] text-[#4ade80] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-[#e2e2e2] font-mono">{improvingCount}</p>
          <p className="text-[11px] text-[#4ade80] font-medium">Mejorando</p>
        </div>
      </button>

      {/* Worsening */}
      <button
        type="button"
        onClick={() => onSelectCategory?.('worsening')}
        className="bg-[#131315] border border-[#1e1e20] hover:border-[#4a2d2d] hover:bg-[#161618] rounded-xl p-3.5 flex items-center space-x-3 text-left transition-all cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-lg bg-[#2a1a1a] border border-[#4a2d2d] text-[#f87171] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <TrendingDown className="w-5 h-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-[#e2e2e2] font-mono">{worseningCount}</p>
          <p className="text-[11px] text-[#f87171] font-medium">Empeorando</p>
        </div>
      </button>

      {/* Stable */}
      <button
        type="button"
        onClick={() => onSelectCategory?.('stable')}
        className="bg-[#131315] border border-[#1e1e20] hover:border-[#38383b] hover:bg-[#161618] rounded-xl p-3.5 flex items-center space-x-3 text-left transition-all cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-lg bg-[#18181b] border border-[#28282b] text-[#888888] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Minus className="w-5 h-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-[#e2e2e2] font-mono">{stableCount}</p>
          <p className="text-[11px] text-[#888888] font-medium">Estables</p>
        </div>
      </button>

      {/* Insufficient Data */}
      <button
        type="button"
        onClick={() => onSelectCategory?.('insufficient')}
        className="bg-[#131315] border border-[#1e1e20] hover:border-[#c5a059]/50 hover:bg-[#161618] rounded-xl p-3.5 flex items-center space-x-3 text-left transition-all cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-lg bg-[#18181b] border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <ActivityIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-[#e2e2e2] font-mono">{insufficientCount}</p>
          <p className="text-[11px] text-[#c5a059]/80 font-medium">Sin datos suf.</p>
        </div>
      </button>
    </div>
  );
};

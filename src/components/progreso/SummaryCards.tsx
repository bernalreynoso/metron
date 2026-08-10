import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity as ActivityIcon } from 'lucide-react';

interface SummaryCardsProps {
  improvingCount: number;
  worseningCount: number;
  stableCount: number;
  insufficientCount: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  improvingCount,
  worseningCount,
  stableCount,
  insufficientCount,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Improving */}
      <div className="bg-[#131315] border border-[#1e1e20] rounded-xl p-3.5 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-[#1a2e1a] border border-[#2d4a2d] text-[#4ade80] flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-[#e2e2e2] font-mono">{improvingCount}</p>
          <p className="text-[11px] text-[#4ade80] font-medium">Mejorando</p>
        </div>
      </div>

      {/* Worsening */}
      <div className="bg-[#131315] border border-[#1e1e20] rounded-xl p-3.5 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-[#2a1a1a] border border-[#4a2d2d] text-[#f87171] flex items-center justify-center shrink-0">
          <TrendingDown className="w-5 h-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-[#e2e2e2] font-mono">{worseningCount}</p>
          <p className="text-[11px] text-[#f87171] font-medium">Empeorando</p>
        </div>
      </div>

      {/* Stable */}
      <div className="bg-[#131315] border border-[#1e1e20] rounded-xl p-3.5 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-[#18181b] border border-[#28282b] text-[#888888] flex items-center justify-center shrink-0">
          <Minus className="w-5 h-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-[#e2e2e2] font-mono">{stableCount}</p>
          <p className="text-[11px] text-[#888888] font-medium">Estables</p>
        </div>
      </div>

      {/* Insufficient Data */}
      <div className="bg-[#131315] border border-[#1e1e20] rounded-xl p-3.5 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-[#18181b] border border-[#c5a059]/30 text-[#c5a059] flex items-center justify-center shrink-0">
          <ActivityIcon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-[#e2e2e2] font-mono">{insufficientCount}</p>
          <p className="text-[11px] text-[#c5a059]/80 font-medium">Sin datos suf.</p>
        </div>
      </div>
    </div>
  );
};

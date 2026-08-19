import React from 'react';
import { Activity } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { X, ChevronRight } from 'lucide-react';

interface TrendCategoryModalProps {
  title: string;
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onClose: () => void;
}

export const TrendCategoryModal: React.FC<TrendCategoryModalProps> = ({
  title,
  activities,
  onSelectActivity,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#0c0c0d]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-auto text-[#e2e2e2]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#1e1e20] flex items-center justify-between bg-[#080809]">
          <div>
            <h2 className="text-base font-bold text-[#e2e2e2] font-serif">{title}</h2>
            <p className="text-xs text-[#888888] font-light">
              {activities.length} {activities.length === 1 ? 'actividad' : 'actividades'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#888888] hover:text-[#e2e2e2] border border-[#28282b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activities.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs text-[#888888]">No hay actividades en esta categoría</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => onSelectActivity(act)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0c0c0d] hover:bg-[#18181b] border border-[#1e1e20] hover:border-[#c5a059]/40 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#18181b] border border-[#1e1e20] flex items-center justify-center text-[#c5a059] shrink-0 group-hover:border-[#c5a059]/40 transition-colors">
                      <IconRenderer name={act.icon} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#e2e2e2] truncate group-hover:text-white transition-colors">
                        {act.name}
                      </p>
                      <p className="text-[11px] text-[#888888]">
                        {act.type === 'counter'
                          ? 'Contador'
                          : act.type === 'boolean'
                          ? 'Booleano'
                          : 'Hora / Checkpoint'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#666666] group-hover:text-[#c5a059] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

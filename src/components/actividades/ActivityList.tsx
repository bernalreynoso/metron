import React, { useState } from 'react';
import { Activity, ActivityRecord } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { ActivityFormModal } from './ActivityFormModal';
import { Plus, Edit2, Eye, EyeOff } from 'lucide-react';

interface ActivityListProps {
  activities: Activity[];
  records?: ActivityRecord[];
  onCreateActivity: (activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateActivity: (activityId: string, updates: Partial<Activity>) => Promise<void>;
  onToggleActive: (activityId: string, active: boolean) => Promise<void>;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  records = [],
  onCreateActivity,
  onUpdateActivity,
  onToggleActive,
}) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const activeActivities = activities.filter((a) => a.active);
  const inactiveActivities = activities.filter((a) => !a.active);

  const handleOpenCreate = () => {
    setEditingActivity(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setShowFormModal(true);
  };

  const handleSaveForm = async (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingActivity) {
      await onUpdateActivity(editingActivity.id, data);
    } else {
      await onCreateActivity(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b border-[#1e1e20] pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#e2e2e2] font-serif">Configuración de Actividades</h2>
          <p className="text-xs text-[#888888] font-light">Gestiona los comportamientos bajo observación</p>
        </div>
        <button
          id="add-activity-btn"
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nueva Actividad</span>
        </button>
      </div>

      {/* Active Activities Section */}
      <div>
        <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 font-mono">
          Actividades Activas ({activeActivities.length})
        </h3>
        <div className="space-y-3">
          {activeActivities.map((act) => (
            <div
              key={act.id}
              className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-4 flex items-center justify-between shadow-lg hover:border-[#c5a059]/40 transition-all"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#1e1e20] flex items-center justify-center text-[#c5a059] shrink-0">
                  <IconRenderer name={act.icon} className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-[#e2e2e2]">{act.name}</h4>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#18181b] text-[#888888] border border-[#28282b]">
                      {act.type === 'counter' ? 'Contador' : 'Boolean'}
                    </span>
                  </div>
                  {act.description && (
                    <p className="text-xs text-[#888888] mt-0.5 font-light">{act.description}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onToggleActive(act.id, false)}
                  title="Desactivar (Ocultar de Hoy)"
                  className="p-2 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#888888] hover:text-[#e2e2e2] border border-[#28282b] transition-colors"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(act)}
                  title="Editar actividad"
                  className="p-2 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#c5a059] border border-[#28282b] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inactive Activities Section */}
      {inactiveActivities.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-[#666666] uppercase tracking-wider mb-3 font-mono">
            Actividades Inactivas ({inactiveActivities.length})
          </h3>
          <div className="space-y-3">
            {inactiveActivities.map((act) => (
              <div
                key={act.id}
                className="bg-[#131315]/50 border border-[#1e1e20]/80 rounded-2xl p-4 flex items-center justify-between opacity-75 hover:opacity-100 transition-all"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#18181b]/60 border border-[#1e1e20] flex items-center justify-center text-[#666666] shrink-0">
                    <IconRenderer name={act.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#888888] line-through">
                      {act.name}
                    </h4>
                    <p className="text-xs text-[#666666]">Inactiva (Oculta de Hoy)</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onToggleActive(act.id, true)}
                    title="Reactivar"
                    className="p-2 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#4ade80] border border-[#28282b] transition-colors flex items-center space-x-1 text-xs font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Activar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showFormModal && (
        <ActivityFormModal
          initialActivity={editingActivity}
          hasRecords={editingActivity ? records.some((r) => r.activityId === editingActivity.id) : false}
          onSave={handleSaveForm}
          onClose={() => setShowFormModal(false)}
        />
      )}
    </div>
  );
};

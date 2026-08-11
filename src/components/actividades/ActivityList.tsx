import React, { useState } from 'react';
import { Activity, ActivityList as ActivityListType, ActivityRecord } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { ActivityFormModal } from './ActivityFormModal';
import { ListFormModal } from './ListFormModal';
import { Plus, Edit2, Eye, EyeOff, Trash2, Info, AlertTriangle, Folder, Layers } from 'lucide-react';

interface ActivityListProps {
  activities: Activity[];
  lists?: ActivityListType[];
  records?: ActivityRecord[];
  onCreateActivity: (activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateActivity: (activityId: string, updates: Partial<Activity>) => Promise<void>;
  onToggleActive: (activityId: string, active: boolean) => Promise<void>;
  onDeleteActivity?: (activityId: string) => Promise<void>;
  onCreateList?: (listData: Omit<ActivityListType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateList?: (listId: string, updates: Partial<ActivityListType>) => Promise<void>;
  onDeleteList?: (listId: string) => Promise<void>;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  lists = [],
  records = [],
  onCreateActivity,
  onUpdateActivity,
  onToggleActive,
  onDeleteActivity,
  onCreateList,
  onUpdateList,
  onDeleteList,
}) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [infoActivity, setInfoActivity] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // List management state
  const [showListModal, setShowListModal] = useState(false);
  const [editingList, setEditingList] = useState<ActivityListType | null>(null);
  const [deletingList, setDeletingList] = useState<ActivityListType | null>(null);
  const [isDeletingList, setIsDeletingList] = useState(false);

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

  const handleOpenCreateList = () => {
    setEditingList(null);
    setShowListModal(true);
  };

  const handleOpenEditList = (list: ActivityListType) => {
    setEditingList(list);
    setShowListModal(true);
  };

  const handleSaveList = async (data: Omit<ActivityListType, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingList && onUpdateList) {
      await onUpdateList(editingList.id, data);
    } else if (onCreateList) {
      await onCreateList(data);
    }
  };

  const handleConfirmDeleteList = async () => {
    if (!deletingList || !onDeleteList || isDeletingList) return;
    setIsDeletingList(true);
    try {
      await onDeleteList(deletingList.id);
      setDeletingList(null);
    } catch (err) {
      console.error('Error deleting list:', err);
    } finally {
      setIsDeletingList(false);
    }
  };

  const handleSaveForm = async (data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingActivity) {
      await onUpdateActivity(editingActivity.id, data);
    } else {
      await onCreateActivity(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingActivity || !onDeleteActivity || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteActivity(deletingActivity.id);
      setDeletingActivity(null);
    } catch (err) {
      console.error('Error deleting activity:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'counter':
        return 'Contador';
      case 'checkpoint':
        return 'Checkpoint';
      case 'boolean':
      default:
        return 'Sí / No';
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b border-[#1e1e20] pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#e2e2e2] font-serif">Configuración de Actividades y Listas</h2>
          <p className="text-xs text-[#888888] font-light">Gestiona tus agrupadores y comportamientos bajo observación</p>
        </div>
        <div className="flex items-center space-x-2">
          {onCreateList && (
            <button
              id="add-list-btn"
              onClick={handleOpenCreateList}
              className="px-3 py-2 bg-[#18181b] hover:bg-[#222225] border border-[#28282b] hover:border-[#c5a059] text-[#c5a059] font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Lista</span>
            </button>
          )}
          <button
            id="add-activity-btn"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Actividad</span>
          </button>
        </div>
      </div>

      {/* Lists Management Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider font-mono flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Listas Organizativas ({lists.length})</span>
          </h3>
        </div>

        {lists.length === 0 ? (
          <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-5 text-center space-y-2">
            <p className="text-xs text-[#888888]">
              Aún no has creado listas. Las listas te permiten agrupar actividades como &quot;Transporte&quot;, &quot;Casa&quot; o &quot;Trabajo&quot; para registrar rápidamente.
            </p>
            {onCreateList && (
              <button
                type="button"
                onClick={handleOpenCreateList}
                className="mt-1 px-3 py-1.5 bg-[#18181b] border border-[#28282b] hover:border-[#c5a059] text-[#c5a059] text-xs font-bold rounded-lg transition-all"
              >
                + Crear primera lista
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lists.map((l) => {
              const actCount = activities.filter((a) => a.listId === l.id && a.active).length;
              return (
                <div
                  key={l.id}
                  className="bg-[#131315] border border-[#1e1e20] rounded-xl p-3.5 flex items-center justify-between shadow-md hover:border-[#c5a059]/40 transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#18181b] border border-[#28282b] flex items-center justify-center text-[#c5a059] shrink-0">
                      <IconRenderer name={l.icon} className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#e2e2e2] truncate">{l.name}</h4>
                      <p className="text-[11px] text-[#888888] font-mono">
                        {actCount} {actCount === 1 ? 'actividad' : 'actividades'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditList(l)}
                      title="Editar lista"
                      className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#c5a059] border border-[#28282b] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteList && (
                      <button
                        type="button"
                        onClick={() => setDeletingList(l)}
                        title="Eliminar lista"
                        className="p-1.5 rounded-lg bg-[#18181b] hover:bg-[#2a1a1a] text-[#888888] hover:text-[#f87171] border border-[#28282b] hover:border-[#4a2d2d] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Activities Section */}
      <div>
        <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider mb-3 font-mono">
          Actividades Activas ({activeActivities.length})
        </h3>
        <div className="space-y-3">
          {activeActivities.map((act) => {
            const hasRecords = records.some((r) => r.activityId === act.id);
            const listObj = lists.find((l) => l.id === act.listId);

            return (
              <div
                key={act.id}
                className="bg-[#131315] border border-[#1e1e20] rounded-2xl p-4 flex items-center justify-between shadow-lg hover:border-[#c5a059]/40 transition-all"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#1e1e20] flex items-center justify-center text-[#c5a059] shrink-0">
                    <IconRenderer name={act.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h4 className="text-sm font-semibold text-[#e2e2e2]">{act.name}</h4>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#18181b] text-[#888888] border border-[#28282b]">
                        {getTypeLabel(act.type)}
                      </span>
                      {listObj ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 flex items-center space-x-1">
                          <Folder className="w-3 h-3 inline mr-0.5" />
                          <span>{listObj.name}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181b] text-[#666666] border border-[#28282b]">
                          Sin lista
                        </span>
                      )}
                    </div>
                    {act.description && (
                      <p className="text-xs text-[#888888] mt-0.5 font-light">{act.description}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {hasRecords ? (
                    <button
                      onClick={() => setInfoActivity(act)}
                      title="Esta actividad tiene historial"
                      className="p-2 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#c5a059]/80 hover:text-[#c5a059] border border-[#28282b] transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  ) : (
                    onDeleteActivity && (
                      <button
                        onClick={() => setDeletingActivity(act)}
                        title="Eliminar permanentemente (sin registros)"
                        className="p-2 rounded-lg bg-[#18181b] hover:bg-[#2a1a1a] text-[#888888] hover:text-[#f87171] border border-[#28282b] hover:border-[#4a2d2d] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}

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
            );
          })}
        </div>
      </div>

      {/* Inactive Activities Section */}
      {inactiveActivities.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-[#666666] uppercase tracking-wider mb-3 font-mono">
            Actividades Inactivas ({inactiveActivities.length})
          </h3>
          <div className="space-y-3">
            {inactiveActivities.map((act) => {
              const hasRecords = records.some((r) => r.activityId === act.id);

              return (
                <div
                  key={act.id}
                  className="bg-[#131315]/50 border border-[#1e1e20]/80 rounded-2xl p-4 flex items-center justify-between opacity-75 hover:opacity-100 transition-all"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#18181b]/60 border border-[#1e1e20] flex items-center justify-center text-[#666666] shrink-0">
                      <IconRenderer name={act.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-[#888888] line-through">
                          {act.name}
                        </h4>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#18181b] text-[#666666] border border-[#28282b]">
                          {getTypeLabel(act.type)}
                        </span>
                      </div>
                      <p className="text-xs text-[#666666]">Inactiva (Oculta de Hoy)</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!hasRecords && onDeleteActivity && (
                      <button
                        onClick={() => setDeletingActivity(act)}
                        title="Eliminar permanentemente (sin registros)"
                        className="p-2 rounded-lg bg-[#18181b] hover:bg-[#2a1a1a] text-[#888888] hover:text-[#f87171] border border-[#28282b] hover:border-[#4a2d2d] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

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
              );
            })}
          </div>
        </div>
      )}

      {/* Info Modal for Activities with History */}
      {infoActivity && (
        <div className="fixed inset-0 z-50 bg-[#0c0c0d]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl w-full max-w-md p-6 shadow-2xl text-[#e2e2e2]">
            <div className="flex items-center space-x-3 text-[#c5a059] mb-4">
              <Info className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold font-serif">Actividad con Histórico</h3>
            </div>
            <p className="text-xs text-[#a0a0a0] leading-relaxed mb-6 font-light">
              La actividad <strong className="text-[#e2e2e2] font-semibold">"{infoActivity.name}"</strong> posee registros históricos en la base de datos.
              Para conservar la precisión de tus métricas y comparativas, no se puede eliminar.
              Si ya no deseas observarla, puedes <strong className="text-[#c5a059]">Desactivarla</strong> para ocultarla de la pantalla de hoy.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setInfoActivity(null)}
                className="px-5 py-2.5 rounded-lg bg-[#c5a059] text-[#0c0c0d] text-xs font-bold hover:bg-[#d4b068] transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Recordless Activities */}
      {deletingActivity && (
        <div className="fixed inset-0 z-50 bg-[#0c0c0d]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131315] border border-[#4a2d2d] rounded-2xl w-full max-w-md p-6 shadow-2xl text-[#e2e2e2]">
            <div className="flex items-center space-x-3 text-[#f87171] mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold font-serif">¿Eliminar actividad permanentemente?</h3>
            </div>
            <p className="text-xs text-[#a0a0a0] leading-relaxed mb-6 font-light">
              La actividad <strong className="text-[#e2e2e2] font-semibold">"{deletingActivity.name}"</strong> no posee ningún registro en la base de datos. Se eliminará permanentemente de tu cuenta.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeletingActivity(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-lg bg-[#18181b] text-[#e2e2e2] border border-[#28282b] text-xs font-semibold hover:bg-[#222225] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-lg bg-[#f87171] text-white text-xs font-bold hover:bg-[#ef4444] transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Lists */}
      {deletingList && (
        <div className="fixed inset-0 z-50 bg-[#0c0c0d]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131315] border border-[#4a2d2d] rounded-2xl w-full max-w-md p-6 shadow-2xl text-[#e2e2e2]">
            <div className="flex items-center space-x-3 text-[#f87171] mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold font-serif">¿Eliminar lista "{deletingList.name}"?</h3>
            </div>
            <p className="text-xs text-[#a0a0a0] leading-relaxed mb-6 font-light">
              Las actividades asignadas a esta lista <strong className="text-[#e2e2e2] font-semibold">NO se eliminarán</strong>.
              Simplemente pasarán a estar &quot;Sin lista&quot; y mantendrán intactos todos sus registros e historial.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeletingList(null)}
                disabled={isDeletingList}
                className="px-4 py-2.5 rounded-lg bg-[#18181b] text-[#e2e2e2] border border-[#28282b] text-xs font-semibold hover:bg-[#222225] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteList}
                disabled={isDeletingList}
                className="px-5 py-2.5 rounded-lg bg-[#f87171] text-white text-xs font-bold hover:bg-[#ef4444] transition-all disabled:opacity-50"
              >
                {isDeletingList ? 'Eliminando...' : 'Eliminar Lista'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Form Modal */}
      {showListModal && (
        <ListFormModal
          initialList={editingList}
          onSave={handleSaveList}
          onClose={() => setShowListModal(false)}
        />
      )}

      {/* Create / Edit Form Modal */}
      {showFormModal && (
        <ActivityFormModal
          initialActivity={editingActivity}
          lists={lists}
          hasRecords={editingActivity ? records.some((r) => r.activityId === editingActivity.id) : false}
          onSave={handleSaveForm}
          onClose={() => setShowFormModal(false)}
        />
      )}
    </div>
  );
};

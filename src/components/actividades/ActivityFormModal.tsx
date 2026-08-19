import React, { useState } from 'react';
import { Activity, ActivityDirection, ActivityList, ActivityType, CheckpointMode } from '../../types';
import { ICON_CATEGORIES, IconRenderer } from '../common/IconRenderer';
import { X, Save } from 'lucide-react';

interface ActivityFormModalProps {
  initialActivity?: Activity | null;
  lists?: ActivityList[];
  hasRecords?: boolean;
  onCreateList?: (data: { name: string; icon: string; description?: string }) => Promise<string>;
  onSave: (activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  initialActivity,
  lists = [],
  hasRecords = false,
  onCreateList,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialActivity?.name || '');
  const [description, setDescription] = useState(initialActivity?.description || '');
  const [icon, setIcon] = useState(initialActivity?.icon || 'Clock');
  const [listId, setListId] = useState<string>(initialActivity?.listId || '');
  const [isCreatingInlineList, setIsCreatingInlineList] = useState(false);
  const [inlineListName, setInlineListName] = useState('');
  const [inlineListLoading, setInlineListLoading] = useState(false);
  const [type, setType] = useState<ActivityType>(initialActivity?.type || 'counter');
  const [checkpointMode, setCheckpointMode] = useState<CheckpointMode>(
    initialActivity?.checkpointMode || 'single'
  );
  const [direction, setDirection] = useState<ActivityDirection>(
    initialActivity?.direction || 'decrease'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ICON_CATEGORIES[0].category
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeSelect = (newType: ActivityType) => {
    if (hasRecords && initialActivity) return;
    setType(newType);
    if (newType === 'checkpoint') {
      if (direction !== 'earlier' && direction !== 'later' && direction !== 'neutral') {
        setDirection('earlier');
      }
    } else {
      if (direction !== 'increase' && direction !== 'decrease' && direction !== 'compliance') {
        setDirection('decrease');
      }
    }
  };

  const handleListSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__new__') {
      setIsCreatingInlineList(true);
      setInlineListName('');
    } else {
      setListId(val);
    }
  };

  const handleConfirmInlineList = async () => {
    if (!inlineListName.trim() || !onCreateList) return;
    setInlineListLoading(true);
    try {
      const newId = await onCreateList({
        name: inlineListName.trim(),
        icon: 'Folder',
      });
      setListId(newId);
      setIsCreatingInlineList(false);
      setInlineListName('');
    } catch (err) {
      console.error('Error al crear lista desde formulario de actividad:', err);
    } finally {
      setInlineListLoading(false);
    }
  };

  const handleCancelInlineList = () => {
    setIsCreatingInlineList(false);
    setInlineListName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresa un nombre para la actividad');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        description: description.trim(),
        icon,
        type,
        direction,
        listId: listId ? listId : null,
        active: initialActivity ? initialActivity.active : true,
        order: initialActivity ? initialActivity.order : Date.now(),
      };

      if (type === 'checkpoint') {
        activityData.checkpointMode = checkpointMode;
      }

      await onSave(activityData);
      onClose();
    } catch (err: any) {
      console.error('Error saving activity:', err);
      const technicalMsg = err?.code
        ? ` [Código: ${err.code} - ${err.message}]`
        : err?.message
        ? ` [Mensaje: ${err.message}]`
        : '';
      setError(`Error al guardar la actividad${technicalMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const activeIcons =
    ICON_CATEGORIES.find((c) => c.category === selectedCategory)?.icons ||
    ICON_CATEGORIES[0].icons;

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0c0d]/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#131315] border border-[#1e1e20] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-auto text-[#e2e2e2]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1e1e20] flex items-center justify-between bg-[#080809]">
          <h2 className="text-base font-bold text-[#e2e2e2] font-serif flex items-center space-x-2">
            <span>{initialActivity ? 'Editar Actividad' : 'Nueva Actividad'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#888888] hover:text-[#e2e2e2] border border-[#28282b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1">
              Nombre de la actividad *
            </label>
            <input
              id="activity-name-input"
              type="text"
              required
              placeholder="Ej: Tomar refresco, Leer, Llegar al trabajo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#18181b] border border-[#28282b] rounded-lg py-2.5 px-3 text-sm text-[#e2e2e2] placeholder-[#666666] focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1">
              Descripción opcional
            </label>
            <input
              id="activity-desc-input"
              type="text"
              placeholder="Breve nota descriptiva"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#18181b] border border-[#28282b] rounded-lg py-2.5 px-3 text-sm text-[#e2e2e2] placeholder-[#666666] focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          {/* List Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1">
              Lista de actividades (Agrupador)
            </label>
            {isCreatingInlineList ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Nombre de la nueva lista"
                  value={inlineListName}
                  onChange={(e) => setInlineListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmInlineList();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancelInlineList();
                    }
                  }}
                  autoFocus
                  className="flex-1 bg-[#18181b] border border-[#c5a059] rounded-lg py-2 px-3 text-sm text-[#e2e2e2] placeholder-[#666666] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleConfirmInlineList}
                  disabled={!inlineListName.trim() || inlineListLoading}
                  className="px-3 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {inlineListLoading ? 'Creando...' : 'Crear y usar'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelInlineList}
                  disabled={inlineListLoading}
                  className="px-3 py-2 bg-[#18181b] hover:bg-[#222225] text-[#888888] hover:text-[#e2e2e2] border border-[#28282b] text-xs font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <select
                value={listId}
                onChange={handleListSelectChange}
                className="w-full bg-[#18181b] border border-[#28282b] rounded-lg py-2.5 px-3 text-sm text-[#e2e2e2] focus:outline-none focus:border-[#c5a059]"
              >
                <option value="">Sin lista</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
                {onCreateList && (
                  <option value="__new__">+ Crear nueva lista...</option>
                )}
              </select>
            )}
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1.5">
              Tipo de actividad
            </label>
            {hasRecords && initialActivity && (
              <p className="text-[11px] text-[#c5a059] mb-2 font-light">
                El tipo de esta actividad no puede cambiarse porque ya tiene registros históricos.
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={hasRecords && !!initialActivity}
                onClick={() => handleTypeSelect('counter')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === 'counter'
                    ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]'
                    : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <p className="text-xs font-bold font-mono">Contador</p>
                <p className="text-[10px] text-[#888888] mt-1 font-light leading-tight">
                  Cuenta cuántas veces ocurrió
                </p>
              </button>

              <button
                type="button"
                disabled={hasRecords && !!initialActivity}
                onClick={() => handleTypeSelect('boolean')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === 'boolean'
                    ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]'
                    : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <p className="text-xs font-bold font-mono">Sí / No</p>
                <p className="text-[10px] text-[#888888] mt-1 font-light leading-tight">
                  Registra si una actividad ocurrió o no
                </p>
              </button>

              <button
                type="button"
                disabled={hasRecords && !!initialActivity}
                onClick={() => handleTypeSelect('checkpoint')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  type === 'checkpoint'
                    ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]'
                    : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <p className="text-xs font-bold font-mono">Checkpoint</p>
                <p className="text-[10px] text-[#888888] mt-1 font-light leading-tight">
                  Registra la hora en que ocurrió
                </p>
              </button>
            </div>
          </div>

          {/* Registros por día (Checkpoint Mode) */}
          {type === 'checkpoint' && (
            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1.5">
                Registros por día
              </label>
              {hasRecords && initialActivity && (
                <p className="text-[11px] text-[#c5a059] mb-2 font-light">
                  El modo de registros por día no puede cambiarse porque ya tiene registros históricos.
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={hasRecords && !!initialActivity}
                  onClick={() => setCheckpointMode('single')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    checkpointMode === 'single'
                      ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]'
                      : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                  } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <p className="text-xs font-bold font-mono">○ Uno</p>
                  <p className="text-[10px] text-[#888888] mt-1 font-light leading-tight">
                    Uno: normalmente registrarás una vez al día.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={hasRecords && !!initialActivity}
                  onClick={() => setCheckpointMode('multiple')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    checkpointMode === 'multiple'
                      ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]'
                      : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                  } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <p className="text-xs font-bold font-mono">○ Varios</p>
                  <p className="text-[10px] text-[#888888] mt-1 font-light leading-tight">
                    Varios: puedes registrar varias veces durante el día.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Direction Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1.5">
              Dirección de mejora
            </label>
            {hasRecords && initialActivity && (
              <p className="text-[11px] text-[#c5a059] mb-2 font-light">
                La dirección de mejora no puede cambiarse porque ya tiene registros históricos.
              </p>
            )}
            {type === 'checkpoint' ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={hasRecords && !!initialActivity}
                  onClick={() => setDirection('earlier')}
                  className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                    direction === 'earlier'
                      ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                      : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                  } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Más temprano
                </button>

                <button
                  type="button"
                  disabled={hasRecords && !!initialActivity}
                  onClick={() => setDirection('later')}
                  className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                    direction === 'later'
                      ? 'bg-indigo-950/60 border-indigo-800 text-indigo-400'
                      : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                  } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Más tarde
                </button>

                <button
                  type="button"
                  disabled={hasRecords && !!initialActivity}
                  onClick={() => setDirection('neutral')}
                  className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                    direction === 'neutral'
                      ? 'bg-slate-800 border-slate-600 text-slate-200'
                      : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                  } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Neutral
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={hasRecords && !!initialActivity}
                  onClick={() => setDirection('increase')}
                  className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                    direction === 'increase'
                      ? 'bg-[#1a2e1a] border-[#2d4a2d] text-[#4ade80]'
                      : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                  } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Aumentar
                </button>

                <button
                  type="button"
                  disabled={hasRecords && !!initialActivity}
                  onClick={() => setDirection('decrease')}
                  className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                    direction === 'decrease'
                      ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]'
                      : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                  } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Reducir
                </button>

                <button
                  type="button"
                  disabled={hasRecords && !!initialActivity}
                  onClick={() => setDirection('compliance')}
                  className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                    direction === 'compliance'
                      ? 'bg-sky-950/60 border-sky-800 text-sky-400'
                      : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                  } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  Cumplir
                </button>
              </div>
            )}
          </div>

          {/* Categorized Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1.5">
              Seleccionar Icono
            </label>

            {/* Category tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
              {ICON_CATEGORIES.map((cat) => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-all ${
                    selectedCategory === cat.category
                      ? 'bg-[#c5a059] text-[#0c0c0d] font-bold'
                      : 'bg-[#18181b] text-[#888888] hover:text-[#e2e2e2] border border-[#28282b]'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Icon grid */}
            <div className="grid grid-cols-6 gap-2 p-2 bg-[#0c0c0d] border border-[#1e1e20] rounded-xl mt-1">
              {activeIcons.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                    icon === iconName
                      ? 'bg-[#c5a059] text-[#0c0c0d] font-bold scale-105 shadow-md'
                      : 'bg-[#18181b] text-[#888888] hover:bg-[#222225] hover:text-[#e2e2e2]'
                  }`}
                >
                  <IconRenderer name={iconName} className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#2a1a1a] border border-[#4a2d2d] rounded-lg text-xs text-[#f87171]">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#e2e2e2] border border-[#28282b] text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-activity-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] text-xs font-bold transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

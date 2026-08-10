import React, { useState } from 'react';
import { Activity, ActivityDirection, ActivityType } from '../../types';
import { AVAILABLE_ICONS, IconRenderer } from '../common/IconRenderer';
import { X, Save, Plus } from 'lucide-react';

interface ActivityFormModalProps {
  initialActivity?: Activity | null;
  hasRecords?: boolean;
  onSave: (activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  initialActivity,
  hasRecords = false,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialActivity?.name || '');
  const [description, setDescription] = useState(initialActivity?.description || '');
  const [icon, setIcon] = useState(initialActivity?.icon || 'Sparkles');
  const [type, setType] = useState<ActivityType>(initialActivity?.type || 'counter');
  const [direction, setDirection] = useState<ActivityDirection>(
    initialActivity?.direction || 'decrease'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresa un nombre para la actividad');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        icon,
        type,
        direction,
        active: initialActivity ? initialActivity.active : true,
        order: initialActivity ? initialActivity.order : Date.now(),
      });
      onClose();
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Error al guardar la actividad');
    } finally {
      setLoading(false);
    }
  };

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
              placeholder="Ej: Tomar refresco, Leer, Ejercicio"
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

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1.5">
              Tipo de registro
            </label>
            {hasRecords && initialActivity && (
              <p className="text-[11px] text-[#c5a059] mb-2 font-light">
                El tipo de esta actividad no puede cambiarse porque ya tiene registros históricos.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={hasRecords && !!initialActivity}
                onClick={() => !hasRecords && setType('counter')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  type === 'counter'
                    ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]'
                    : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <p className="text-xs font-bold font-mono">Contador [- 0 +]</p>
                <p className="text-[11px] text-[#888888] mt-0.5 font-light">
                  Para comportamientos que ocurren varias veces al día
                </p>
              </button>

              <button
                type="button"
                disabled={hasRecords && !!initialActivity}
                onClick={() => !hasRecords && setType('boolean')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  type === 'boolean'
                    ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]'
                    : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                } ${hasRecords && !!initialActivity ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <p className="text-xs font-bold font-mono">Boolean [SÍ / NO]</p>
                <p className="text-[11px] text-[#888888] mt-0.5 font-light">
                  Para eventos de confirmación única diaria
                </p>
              </button>
            </div>
          </div>

          {/* Direction Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1.5">
              Dirección de mejora
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDirection('increase')}
                className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                  direction === 'increase'
                    ? 'bg-[#1a2e1a] border-[#2d4a2d] text-[#4ade80]'
                    : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                }`}
              >
                Aumentar
              </button>

              <button
                type="button"
                onClick={() => setDirection('decrease')}
                className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                  direction === 'decrease'
                    ? 'bg-[#c5a059]/15 border-[#c5a059] text-[#c5a059]'
                    : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                }`}
              >
                Reducir
              </button>

              <button
                type="button"
                onClick={() => setDirection('compliance')}
                className={`p-2.5 rounded-lg border text-center text-xs font-semibold transition-all ${
                  direction === 'compliance'
                    ? 'bg-sky-950/60 border-sky-800 text-sky-400'
                    : 'bg-[#18181b] border-[#28282b] text-[#888888] hover:text-[#e2e2e2]'
                }`}
              >
                Cumplir
              </button>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1.5">
              Seleccionar Icono
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-2 bg-[#0c0c0d] border border-[#1e1e20] rounded-xl">
              {AVAILABLE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                    icon === iconName
                      ? 'bg-[#c5a059] text-[#0c0c0d] font-bold scale-105'
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

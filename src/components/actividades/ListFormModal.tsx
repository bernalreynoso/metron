import React, { useState } from 'react';
import { ActivityList } from '../../types';
import { ICON_CATEGORIES, IconRenderer } from '../common/IconRenderer';
import { PRESET_LIST_SUGGESTIONS } from '../../services/listService';
import { X, Save, Sparkles } from 'lucide-react';

interface ListFormModalProps {
  initialList?: ActivityList | null;
  onSave: (listData: Omit<ActivityList, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export const ListFormModal: React.FC<ListFormModalProps> = ({
  initialList,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialList?.name || '');
  const [description, setDescription] = useState(initialList?.description || '');
  const [icon, setIcon] = useState(initialList?.icon || 'Folder');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    ICON_CATEGORIES[0].category
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyPreset = (preset: { name: string; icon: string; description: string }) => {
    setName(preset.name);
    setIcon(preset.icon);
    if (!description) setDescription(preset.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ingresa un nombre para la lista');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        icon,
        order: initialList ? initialList.order : Date.now(),
      });
      onClose();
    } catch (err: any) {
      console.error('Error saving list:', err);
      setError('Error al guardar la lista');
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
            <span>{initialList ? 'Editar Lista' : 'Nueva Lista de Actividades'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#18181b] hover:bg-[#222225] text-[#888888] hover:text-[#e2e2e2] border border-[#28282b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Preset Suggestions */}
          {!initialList && (
            <div>
              <label className="block text-[11px] font-semibold text-[#888888] mb-1.5 uppercase tracking-wider font-mono flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Sugerencias rápidas</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LIST_SUGGESTIONS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg bg-[#18181b] hover:bg-[#222225] border border-[#28282b] hover:border-[#c5a059]/50 text-xs text-[#888888] hover:text-[#c5a059] transition-all flex items-center space-x-1"
                  >
                    <IconRenderer name={preset.icon} className="w-3.5 h-3.5" />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1">
              Nombre de la lista *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Transporte, Casa, Trabajo, Ejercicio"
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
              type="text"
              placeholder="Breve nota sobre este grupo de actividades"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#18181b] border border-[#28282b] rounded-lg py-2.5 px-3 text-sm text-[#e2e2e2] placeholder-[#666666] focus:outline-none focus:border-[#c5a059]"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1.5">
              Icono de la lista
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
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-[#c5a059] hover:bg-[#d4b068] text-[#0c0c0d] text-xs font-bold transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Lista</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

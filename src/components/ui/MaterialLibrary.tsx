/**
 * Material Library Component
 *
 * Manage materials with properties like Young's modulus and density.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';
import type { Material } from '@/types';

interface MaterialLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (materialId: string) => void;
}

export function MaterialLibrary({ isOpen, onClose, onSelect }: MaterialLibraryProps): React.JSX.Element | null {
  const { model, addMaterial, deleteMaterial, updateMaterial } = useModelStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Filter materials
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return model.materials;
    const q = searchQuery.toLowerCase();
    return model.materials.filter((m) => m.name.toLowerCase().includes(q));
  }, [model.materials, searchQuery]);

  // Group materials by type
  const groupedMaterials = useMemo(() => {
    const groups: Record<string, Material[]> = {
      'Steel': [],
      'Concrete': [],
      'Aluminum': [],
      'Timber': [],
      'Other': [],
    };

    filteredMaterials.forEach((m) => {
      const nameLower = m.name.toLowerCase();
      if (nameLower.includes('steel') || nameLower.startsWith('s2') || nameLower.startsWith('s3')) {
        groups['Steel']!.push(m);
      } else if (nameLower.includes('concrete') || nameLower.startsWith('c')) {
        groups['Concrete']!.push(m);
      } else if (nameLower.includes('aluminum') || nameLower.includes('aluminium')) {
        groups['Aluminum']!.push(m);
      } else if (nameLower.includes('timber') || nameLower.includes('wood')) {
        groups['Timber']!.push(m);
      } else {
        groups['Other']!.push(m);
      }
    });

    return groups;
  }, [filteredMaterials]);

  const handleDelete = useCallback((materialId: string) => {
    const inUse = model.members.some((m) => m.materialId === materialId);
    if (inUse) {
      alert('Cannot delete material: it is being used by one or more members.');
      return;
    }
    deleteMaterial(materialId);
  }, [model.members, deleteMaterial]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-structura-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-structura-primary">
                layers
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Material Library</h2>
              <p className="text-xs text-slate-500">{model.materials.length} materials available</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials..."
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-structura-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Material
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.entries(groupedMaterials).map(([group, materials]) => {
            if (materials.length === 0) return null;
            return (
              <div key={group} className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-structura-primary" />
                  {group}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {materials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onSelect={onSelect ? () => { onSelect(material.id); onClose(); } : undefined}
                      onEdit={() => setEditingMaterial(material)}
                      onDelete={() => handleDelete(material.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <span className="material-symbols-outlined text-[48px] mb-3 block">search_off</span>
              <p>No materials found matching &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Material Modal */}
      {(isCreating || editingMaterial) && (
        <MaterialEditor
          material={editingMaterial}
          onSave={(material) => {
            const updates: { name: string; E: number; density?: number } = {
              name: material.name,
              E: material.E
            };
            if (material.density !== undefined) {
              updates.density = material.density;
            }
            if (editingMaterial) {
              updateMaterial(material.id, updates);
            } else {
              addMaterial(updates);
            }
            setIsCreating(false);
            setEditingMaterial(null);
          }}
          onCancel={() => {
            setIsCreating(false);
            setEditingMaterial(null);
          }}
        />
      )}
    </div>
  );
}

interface MaterialCardProps {
  material: Material;
  onSelect: (() => void) | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

function MaterialCard({ material, onSelect, onEdit, onDelete }: MaterialCardProps): React.JSX.Element {
  // Format E in GPa
  const eGPa = material.E / 1_000_000;

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-structura-primary transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">{material.name}</h4>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-structura-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Edit"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>

      {/* Material Properties */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <span className="text-slate-500">E:</span>
          <span className="ml-1 text-slate-700 dark:text-slate-300">
            {eGPa.toFixed(0)} GPa
          </span>
        </div>
        <div>
          <span className="text-slate-500">Density:</span>
          <span className="ml-1 text-slate-700 dark:text-slate-300">
            {material.density ? `${material.density.toFixed(1)} kN/m³` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Select Button */}
      {onSelect && (
        <button
          onClick={onSelect}
          className="w-full py-2 text-sm font-medium text-structura-primary hover:bg-structura-primary/10 rounded-lg transition-colors"
        >
          Select
        </button>
      )}
    </div>
  );
}

interface MaterialEditorProps {
  material: Material | null;
  onSave: (material: Material) => void;
  onCancel: () => void;
}

// Common material presets
const MATERIAL_PRESETS = [
  { name: 'Steel S235', E: 210_000_000, density: 78.5 },
  { name: 'Steel S355', E: 210_000_000, density: 78.5 },
  { name: 'Concrete C20/25', E: 30_000_000, density: 25 },
  { name: 'Concrete C30/37', E: 33_000_000, density: 25 },
  { name: 'Concrete C40/50', E: 35_000_000, density: 25 },
  { name: 'Aluminum 6061-T6', E: 68_900_000, density: 27 },
  { name: 'Timber (Softwood)', E: 11_000_000, density: 5 },
  { name: 'Timber (Hardwood)', E: 14_000_000, density: 8 },
];

function MaterialEditor({ material, onSave, onCancel }: MaterialEditorProps): React.JSX.Element {
  const [name, setName] = useState(material?.name || 'Custom Material');
  const [eGPa, setEGPa] = useState(material ? material.E / 1_000_000 : 210);
  const [density, setDensity] = useState(material?.density || 78.5);

  const applyPreset = (preset: typeof MATERIAL_PRESETS[0]) => {
    setName(preset.name);
    setEGPa(preset.E / 1_000_000);
    setDensity(preset.density);
  };

  const handleSave = () => {
    onSave({
      id: material?.id || '',
      name,
      E: eGPa * 1_000_000, // Convert GPa to kPa
      density,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {material ? 'Edit Material' : 'Create Material'}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Presets */}
          {!material && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                {MATERIAL_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Material Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-structura-primary"
            />
          </div>

          {/* Properties */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Young&apos;s Modulus E (GPa)
              </label>
              <input
                type="number"
                step="1"
                value={eGPa}
                onChange={(e) => setEGPa(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Density (kN/m³)
              </label>
              <input
                type="number"
                step="0.1"
                value={density}
                onChange={(e) => setDensity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-blue-500">info</span>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Self-Weight Calculation</p>
                <p>
                  Density is used to calculate self-weight loads on members.
                  Self-weight = Density × Cross-sectional Area
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || eGPa <= 0}
            className="px-4 py-2 text-sm font-medium bg-structura-primary hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {material ? 'Save Changes' : 'Create Material'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Section Library Component
 *
 * Manage and create custom cross-sections with property calculations.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useModelStore } from '@/stores/modelStore';
import type { Section, SectionShape } from '@/types';

interface SectionLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (sectionId: string) => void;
}

export function SectionLibrary({ isOpen, onClose, onSelect }: SectionLibraryProps): React.JSX.Element | null {
  const { model, addSection, deleteSection, updateSection } = useModelStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Filter sections
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return model.sections;
    const q = searchQuery.toLowerCase();
    return model.sections.filter((s) => s.name.toLowerCase().includes(q));
  }, [model.sections, searchQuery]);

  // Group sections by shape
  const groupedSections = useMemo(() => {
    const groups: Record<string, Section[]> = {
      'Standard Steel': [],
      'Rectangular': [],
      'Circular': [],
      'Custom': [],
    };

    filteredSections.forEach((s) => {
      if (s.name.startsWith('IPE') || s.name.startsWith('HEB') || s.name.startsWith('HEA')) {
        groups['Standard Steel']!.push(s);
      } else if (s.shape === 'rectangle' || s.name.toLowerCase().includes('rect')) {
        groups['Rectangular']!.push(s);
      } else if (s.shape === 'circle') {
        groups['Circular']!.push(s);
      } else {
        groups['Custom']!.push(s);
      }
    });

    return groups;
  }, [filteredSections]);

  const handleDelete = useCallback((sectionId: string) => {
    // Check if section is in use
    const inUse = model.members.some((m) => m.sectionId === sectionId);
    if (inUse) {
      alert('Cannot delete section: it is being used by one or more members.');
      return;
    }
    deleteSection(sectionId);
  }, [model.members, deleteSection]);

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
                view_in_ar
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Section Library</h2>
              <p className="text-xs text-slate-500">{model.sections.length} sections available</p>
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
              placeholder="Search sections..."
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-structura-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Section
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.entries(groupedSections).map(([group, sections]) => {
            if (sections.length === 0) return null;
            return (
              <div key={group} className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-structura-primary" />
                  {group}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sections.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      onSelect={onSelect ? () => { onSelect(section.id); onClose(); } : undefined}
                      onEdit={() => setEditingSection(section)}
                      onDelete={() => handleDelete(section.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredSections.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <span className="material-symbols-outlined text-[48px] mb-3 block">search_off</span>
              <p>No sections found matching &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Section Modal */}
      {(isCreating || editingSection) && (
        <SectionEditor
          section={editingSection}
          onSave={(section) => {
            if (editingSection) {
              const updates: Partial<Omit<Section, 'id'>> = { name: section.name, A: section.A, I: section.I };
              if (section.shape) updates.shape = section.shape;
              if (section.dimensions) updates.dimensions = section.dimensions;
              updateSection(section.id, updates);
            } else {
              const newSection: Omit<Section, 'id'> = { name: section.name, A: section.A, I: section.I };
              if (section.shape) newSection.shape = section.shape;
              if (section.dimensions) newSection.dimensions = section.dimensions;
              addSection(newSection);
            }
            setIsCreating(false);
            setEditingSection(null);
          }}
          onCancel={() => {
            setIsCreating(false);
            setEditingSection(null);
          }}
        />
      )}
    </div>
  );
}

interface SectionCardProps {
  section: Section;
  onSelect: (() => void) | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

function SectionCard({ section, onSelect, onEdit, onDelete }: SectionCardProps): React.JSX.Element {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-structura-primary transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-slate-900 dark:text-white">{section.name}</h4>
          <p className="text-xs text-slate-500">{section.shape || 'Custom'}</p>
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

      {/* Section Properties */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div>
          <span className="text-slate-500">Area:</span>
          <span className="ml-1 text-slate-700 dark:text-slate-300">
            {(section.A * 10000).toFixed(2)} cm²
          </span>
        </div>
        <div>
          <span className="text-slate-500">Iₓ:</span>
          <span className="ml-1 text-slate-700 dark:text-slate-300">
            {(section.I * 100000000).toFixed(2)} cm⁴
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

interface SectionEditorProps {
  section: Section | null;
  onSave: (section: Section) => void;
  onCancel: () => void;
}

function SectionEditor({ section, onSave, onCancel }: SectionEditorProps): React.JSX.Element {
  const [name, setName] = useState(section?.name || 'Custom Section');
  const [shape, setShape] = useState<SectionShape>(section?.shape || 'rectangle');
  const [dimensions, setDimensions] = useState<Record<string, number>>(
    section?.dimensions || { width: 0.2, height: 0.3 }
  );
  const [manualA, setManualA] = useState(section?.A ? section.A * 10000 : 0); // cm²
  const [manualI, setManualI] = useState(section?.I ? section.I * 100000000 : 0); // cm⁴
  const [useManual, setUseManual] = useState(section?.shape === 'custom' || !section?.shape);

  // Calculate properties from dimensions
  const calculatedProps = useMemo(() => {
    if (shape === 'rectangle') {
      const b = dimensions.width || 0.1;
      const h = dimensions.height || 0.1;
      return {
        A: b * h, // m²
        I: (b * Math.pow(h, 3)) / 12, // m⁴
      };
    } else if (shape === 'circle') {
      const d = dimensions.diameter || 0.1;
      const r = d / 2;
      return {
        A: Math.PI * Math.pow(r, 2), // m²
        I: (Math.PI * Math.pow(d, 4)) / 64, // m⁴
      };
    } else if (shape === 'i-beam') {
      // Simplified I-beam calculation
      const bf = dimensions.flangeWidth || 0.1;
      const tf = dimensions.flangeThickness || 0.01;
      const h = dimensions.height || 0.2;
      const tw = dimensions.webThickness || 0.006;
      const hw = h - 2 * tf;

      const A = 2 * bf * tf + hw * tw;
      const I = (bf * Math.pow(h, 3) - (bf - tw) * Math.pow(hw, 3)) / 12;
      return { A, I };
    }
    return { A: 0, I: 0 };
  }, [shape, dimensions]);

  const finalProps = useManual
    ? { A: manualA / 10000, I: manualI / 100000000 } // Convert from cm² and cm⁴ to m² and m⁴
    : calculatedProps;

  const handleSave = () => {
    const result: Section = {
      id: section?.id || '',
      name,
      A: finalProps.A,
      I: finalProps.I,
    };
    if (!useManual) {
      result.shape = shape;
      result.dimensions = dimensions;
    } else {
      result.shape = 'custom';
    }
    onSave(result);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {section ? 'Edit Section' : 'Create Section'}
          </h3>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Section Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-structura-primary"
            />
          </div>

          {/* Input Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setUseManual(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                !useManual
                  ? 'bg-structura-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Calculate from Shape
            </button>
            <button
              onClick={() => setUseManual(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                useManual
                  ? 'bg-structura-primary text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Enter Manually
            </button>
          </div>

          {!useManual ? (
            <>
              {/* Shape Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Shape
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['rectangle', 'circle', 'i-beam'] as SectionShape[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setShape(s)}
                      className={`p-3 text-center rounded-lg border transition-colors ${
                        shape === s
                          ? 'border-structura-primary bg-structura-primary/10 text-structura-primary'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px] block mb-1">
                        {s === 'rectangle' ? 'rectangle' : s === 'circle' ? 'circle' : 'crop_square'}
                      </span>
                      <span className="text-xs capitalize">{s.replace('-', ' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension Inputs */}
              <div className="grid grid-cols-2 gap-4">
                {shape === 'rectangle' && (
                  <>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Width (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={dimensions.width || 0}
                        onChange={(e) => setDimensions({ ...dimensions, width: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Height (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={dimensions.height || 0}
                        onChange={(e) => setDimensions({ ...dimensions, height: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}
                {shape === 'circle' && (
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Diameter (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dimensions.diameter || 0}
                      onChange={(e) => setDimensions({ ...dimensions, diameter: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>
                )}
                {shape === 'i-beam' && (
                  <>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Height (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={dimensions.height || 0}
                        onChange={(e) => setDimensions({ ...dimensions, height: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Flange Width (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={dimensions.flangeWidth || 0}
                        onChange={(e) => setDimensions({ ...dimensions, flangeWidth: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Flange Thickness (m)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={dimensions.flangeThickness || 0}
                        onChange={(e) => setDimensions({ ...dimensions, flangeThickness: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Web Thickness (m)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={dimensions.webThickness || 0}
                        onChange={(e) => setDimensions({ ...dimensions, webThickness: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Manual Input */
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Area (cm²)</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualA}
                  onChange={(e) => setManualA(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Moment of Inertia (cm⁴)</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualI}
                  onChange={(e) => setManualI(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {/* Calculated Properties Preview */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Section Properties
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Area (A):</span>
                <span className="ml-2 font-medium text-slate-900 dark:text-white">
                  {(finalProps.A * 10000).toFixed(4)} cm²
                </span>
              </div>
              <div>
                <span className="text-slate-500">Inertia (Iₓ):</span>
                <span className="ml-2 font-medium text-slate-900 dark:text-white">
                  {(finalProps.I * 100000000).toFixed(4)} cm⁴
                </span>
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
            disabled={!name.trim() || (finalProps.A <= 0 || finalProps.I <= 0)}
            className="px-4 py-2 text-sm font-medium bg-structura-primary hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {section ? 'Save Changes' : 'Create Section'}
          </button>
        </div>
      </div>
    </div>
  );
}

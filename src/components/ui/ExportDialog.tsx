/**
 * Export/Import Dialog
 *
 * Export project to JSON or import from JSON file.
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useModelStore } from '@/stores/modelStore';
import { downloadDXF } from '@/lib/export/dxf';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'json' | 'csv-nodes' | 'csv-members' | 'csv-results' | 'dxf';

export function ExportDialog({ isOpen, onClose }: ExportDialogProps): React.JSX.Element | null {
  const { model, loadCases, projectName, analysisResult, loadModel, setProjectName } = useModelStore();
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = useCallback(() => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projectName,
      model,
      loadCases,
      analysisResult: analysisResult || null,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [model, loadCases, projectName, analysisResult]);

  const handleExportCSVNodes = useCallback(() => {
    const headers = ['ID', 'X (m)', 'Y (m)', 'Support Type', 'DX', 'DY', 'RZ'];
    const rows = model.nodes.map((node) => {
      const support = model.supports.find((s) => s.nodeId === node.id);
      let supportType = 'Free';
      if (support) {
        if (support.dx && support.dy && support.rz) supportType = 'Fixed';
        else if (support.dx && support.dy) supportType = 'Pinned';
        else if (support.dy) supportType = 'Roller X';
        else if (support.dx) supportType = 'Roller Y';
      }
      return [
        node.id,
        node.x.toFixed(4),
        node.y.toFixed(4),
        supportType,
        support?.dx ? '1' : '0',
        support?.dy ? '1' : '0',
        support?.rz ? '1' : '0',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    downloadCSV(csv, `${projectName}_nodes.csv`);
  }, [model, projectName]);

  const handleExportCSVMembers = useCallback(() => {
    const headers = ['ID', 'Start Node', 'End Node', 'Type', 'Material', 'Section', 'Length (m)'];
    const rows = model.members.map((member) => {
      const startNode = model.nodes.find((n) => n.id === member.startNodeId);
      const endNode = model.nodes.find((n) => n.id === member.endNodeId);
      const material = model.materials.find((m) => m.id === member.materialId);
      const section = model.sections.find((s) => s.id === member.sectionId);

      let length = 0;
      if (startNode && endNode) {
        const dx = endNode.x - startNode.x;
        const dy = endNode.y - startNode.y;
        length = Math.sqrt(dx * dx + dy * dy);
      }

      return [
        member.id,
        member.startNodeId,
        member.endNodeId,
        member.type,
        material?.name || '',
        section?.name || '',
        length.toFixed(4),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    downloadCSV(csv, `${projectName}_members.csv`);
  }, [model, projectName]);

  const handleExportCSVResults = useCallback(() => {
    if (!analysisResult?.success || !analysisResult.results.memberResults) {
      alert('No analysis results available. Please run analysis first.');
      return;
    }

    const headers = [
      'Member ID',
      'Axial Start (kN)',
      'Axial End (kN)',
      'Shear Start (kN)',
      'Shear End (kN)',
      'Moment Start (kN·m)',
      'Moment End (kN·m)',
      'Max Axial (kN)',
      'Max Shear (kN)',
      'Max Moment (kN·m)',
    ];

    const rows = analysisResult.results.memberResults.map((result) => {
      // Get max values from diagrams
      const maxAxial = Math.max(...result.diagrams.axial.map(p => Math.abs(p.value)));
      const maxShear = Math.max(...result.diagrams.shear.map(p => Math.abs(p.value)));
      const maxMoment = Math.max(...result.diagrams.moment.map(p => Math.abs(p.value)));

      return [
        result.memberId,
        result.endForcesLocal.f1x.toFixed(4),
        result.endForcesLocal.f2x.toFixed(4),
        result.endForcesLocal.f1y.toFixed(4),
        result.endForcesLocal.f2y.toFixed(4),
        result.endForcesLocal.m1.toFixed(4),
        result.endForcesLocal.m2.toFixed(4),
        maxAxial.toFixed(4),
        maxShear.toFixed(4),
        maxMoment.toFixed(4),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    downloadCSV(csv, `${projectName}_results.csv`);
  }, [analysisResult, projectName]);

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportDXF = useCallback(() => {
    downloadDXF(model, `${projectName.replace(/[^a-z0-9]/gi, '_')}_model.dxf`, {
      includeNodes: true,
      includeMembers: true,
      includeSupports: true,
      includeLabels: true,
      scale: 1,
    });
  }, [model, projectName]);

  const handleExport = useCallback(() => {
    switch (selectedFormat) {
      case 'json':
        handleExportJSON();
        break;
      case 'csv-nodes':
        handleExportCSVNodes();
        break;
      case 'csv-members':
        handleExportCSVMembers();
        break;
      case 'csv-results':
        handleExportCSVResults();
        break;
      case 'dxf':
        handleExportDXF();
        break;
    }
  }, [selectedFormat, handleExportJSON, handleExportCSVNodes, handleExportCSVMembers, handleExportCSVResults, handleExportDXF]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the imported data
        if (!data.model || !data.model.nodes || !data.model.members) {
          throw new Error('Invalid file format: missing model data');
        }

        // Import the model
        loadModel(data.model, data.loadCases || []);
        if (data.projectName) {
          setProjectName(data.projectName);
        }

        setImportSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse file');
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
    };
    reader.readAsText(file);
  }, [loadModel, setProjectName, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-structura-primary/10 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-structura-primary">
                {activeTab === 'export' ? 'download' : 'upload'}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {activeTab === 'export' ? 'Export Project' : 'Import Project'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-structura-primary border-b-2 border-structura-primary'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-structura-primary border-b-2 border-structura-primary'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Import
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Export Format
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'json', label: 'JSON (Full Project)', desc: 'Complete project with all data', icon: 'data_object' },
                    { id: 'dxf', label: 'DXF (CAD)', desc: 'AutoCAD compatible drawing format', icon: 'architecture' },
                    { id: 'csv-nodes', label: 'CSV - Nodes', desc: 'Node coordinates and supports', icon: 'radio_button_unchecked' },
                    { id: 'csv-members', label: 'CSV - Members', desc: 'Member definitions and properties', icon: 'segment' },
                    { id: 'csv-results', label: 'CSV - Results', desc: 'Analysis results (requires analysis)', icon: 'analytics' },
                  ].map((format) => (
                    <label
                      key={format.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFormat === format.id
                          ? 'border-structura-primary bg-structura-primary/5'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.id}
                        checked={selectedFormat === format.id}
                        onChange={() => setSelectedFormat(format.id as ExportFormat)}
                        className="sr-only"
                      />
                      <span className={`material-symbols-outlined text-[20px] ${
                        selectedFormat === format.id ? 'text-structura-primary' : 'text-slate-400'
                      }`}>
                        {format.icon}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {format.label}
                        </p>
                        <p className="text-xs text-slate-500">{format.desc}</p>
                      </div>
                      {selectedFormat === format.id && (
                        <span className="material-symbols-outlined text-[20px] text-structura-primary">
                          check_circle
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Export Summary
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div>Nodes: {model.nodes.length}</div>
                  <div>Members: {model.members.length}</div>
                  <div>Supports: {model.supports.length}</div>
                  <div>Load Cases: {loadCases.length}</div>
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-3 bg-structura-primary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                Export
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Import Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] text-blue-500">info</span>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Import JSON File</p>
                    <p>
                      Import a previously exported JSON file. This will replace your current
                      model with the imported data.
                    </p>
                  </div>
                </div>
              </div>

              {/* File Input */}
              <div
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-structura-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-[48px] text-slate-400 mb-3 block">
                  upload_file
                </span>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                  Click to select a file or drag and drop
                </p>
                <p className="text-xs text-slate-400">JSON files only</p>
              </div>

              {/* Import Status */}
              {importError && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-red-500">error</span>
                    <p className="text-sm text-red-700 dark:text-red-300">{importError}</p>
                  </div>
                </div>
              )}

              {importSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-green-500">check_circle</span>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Project imported successfully!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

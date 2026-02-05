/**
 * EditorContent Component
 * 
 * The actual editor UI (canvas + panels), extracted for dynamic import.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useModelStore } from '@/stores/modelStore';
import { StructuralCanvas } from '@/components/canvas/StructuralCanvas';
import { Toolbar } from '@/components/ui/Toolbar';
import { PropertyPanel } from '@/components/ui/PropertyPanel';
import { AnalysisPanel } from '@/components/ui/AnalysisPanel';
import { DemoSelector } from '@/components/ui/DemoSelector';

export function EditorContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [rightPanelTab, setRightPanelTab] = useState<'properties' | 'analysis'>('properties');
  
  const { selection } = useModelStore();

  // Track container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Toolbar */}
      <Toolbar />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Demos and Model Tree */}
        <div className="w-56 bg-gray-900 border-r border-gray-800 overflow-y-auto hidden lg:flex lg:flex-col">
          <DemoSelector />
          <div className="border-t border-gray-800">
            <ModelTree />
          </div>
        </div>
        
        {/* Canvas */}
        <div ref={containerRef} className="flex-1 relative">
          <StructuralCanvas
            width={canvasSize.width}
            height={canvasSize.height}
          />
          
          {/* Canvas overlays */}
          <div className="absolute bottom-4 left-4 bg-gray-900/80 px-3 py-2 rounded text-xs text-gray-400">
            <span>Scroll to zoom · Click to add · Shift+click for multi-select</span>
          </div>
        </div>
        
        {/* Right Panel */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setRightPanelTab('properties')}
              className={`flex-1 px-4 py-2 text-sm transition-colors ${
                rightPanelTab === 'properties'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setRightPanelTab('analysis')}
              className={`flex-1 px-4 py-2 text-sm transition-colors ${
                rightPanelTab === 'analysis'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Analysis
            </button>
          </div>
          
          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanelTab === 'properties' && <PropertyPanel />}
            {rightPanelTab === 'analysis' && <AnalysisPanel />}
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <footer className="flex items-center justify-between px-4 py-1 bg-gray-900 border-t border-gray-800 text-xs text-gray-500">
        <div>
          {selection.length > 0 ? `${selection.length} selected` : 'Ready'}
        </div>
        <div>
          Units: m, kN, kPa
        </div>
      </footer>
    </>
  );
}

// Simple model tree component
function ModelTree() {
  const { model, loadCases, selection, select } = useModelStore();
  
  return (
    <div className="p-2 text-xs">
      <div className="mb-3">
        <h4 className="font-medium text-gray-400 mb-1 px-2">Nodes ({model.nodes.length})</h4>
        <div className="max-h-24 overflow-y-auto">
          {model.nodes.map((node) => {
            const isSelected = selection.some((s) => s.type === 'node' && s.id === node.id);
            return (
              <button
                key={node.id}
                onClick={() => select([{ type: 'node', id: node.id }])}
                className={`w-full text-left px-2 py-0.5 rounded ${
                  isSelected ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                {node.id} ({node.x.toFixed(1)}, {node.y.toFixed(1)})
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="mb-3">
        <h4 className="font-medium text-gray-400 mb-1 px-2">Members ({model.members.length})</h4>
        <div className="max-h-24 overflow-y-auto">
          {model.members.map((member) => {
            const isSelected = selection.some((s) => s.type === 'member' && s.id === member.id);
            return (
              <button
                key={member.id}
                onClick={() => select([{ type: 'member', id: member.id }])}
                className={`w-full text-left px-2 py-0.5 rounded ${
                  isSelected ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                {member.id} ({member.type})
              </button>
            );
          })}
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-400 mb-1 px-2">Load Cases ({loadCases.length})</h4>
        <div className="max-h-24 overflow-y-auto">
          {loadCases.map((lc) => (
            <div key={lc.id} className="px-2 py-0.5 text-gray-400">
              {lc.name} ({lc.loads.length} loads)
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

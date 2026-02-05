/**
 * ReportClient - Client-side report renderer with print functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ReportHeader, 
  ReportInputSummary, 
  ReportLoadSummary, 
  ReportResults,
  ReportDiagrams,
  ReportStructure,
  ReportFooter 
} from '@/components/report';
import { solve } from '@/lib/solver';
import type { ProjectData } from '@/types/database';
import type { StructuralModel, LoadCase } from '@/types';
import type { SolverResult } from '@/types/analysis';

interface ReportClientProps {
  project: {
    id: string;
    name: string;
    data: ProjectData;
    createdAt: string;
    updatedAt: string;
  };
  userName?: string | undefined;
}

export function ReportClient({ project, userName }: ReportClientProps) {
  const [analysisResult, setAnalysisResult] = useState<SolverResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  // Extract model and load cases from project data
  const model = project.data.model as unknown as StructuralModel;
  const loadCases = project.data.loadCases as unknown as LoadCase[];
  const activeLoadCase = loadCases[0] || null;

  // Run analysis on mount
  useEffect(() => {
    const runAnalysis = async () => {
      if (!activeLoadCase || model.nodes.length === 0 || model.members.length === 0) {
        setIsAnalyzing(false);
        return;
      }

      try {
        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const result = solve(model, activeLoadCase);
        setAnalysisResult(result);
      } catch (error) {
        console.error('Analysis failed:', error);
        setAnalysisResult({
          success: false,
          error: {
            code: 'NUMERICAL_FAILURE',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    runAnalysis();
  }, [model, activeLoadCase]);

  // Print handler
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  // Back to project
  const handleBack = () => {
    window.location.href = `/project/${project.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Controls (hidden when printing) */}
      <div className="print:hidden sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Editor
            </button>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {isAnalyzing && (
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </span>
            )}
            <button
              onClick={handlePrint}
              disabled={isAnalyzing || isPrinting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {isPrinting ? 'Preparing...' : 'Print / Save PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 print:px-0 print:py-0 print:max-w-none">
        <div className="bg-white shadow-lg print:shadow-none rounded-lg print:rounded-none p-8 print:p-12">
          {/* Header */}
          <ReportHeader
            projectName={project.name}
            projectId={project.id}
            createdAt={project.createdAt}
            updatedAt={project.updatedAt}
            userName={userName}
          />

          {/* Structure Visualization */}
          <ReportStructure model={model} loadCase={activeLoadCase || undefined} />

          {/* Input Summary */}
          <ReportInputSummary model={model} />

          {/* Load Summary */}
          <ReportLoadSummary loadCases={loadCases} model={model} />

          {/* Analysis Results */}
          {isAnalyzing ? (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                3. Analysis Results
              </h2>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <svg className="w-12 h-12 animate-spin mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="mt-4 text-gray-600">Running structural analysis...</p>
                </div>
              </div>
            </section>
          ) : analysisResult ? (
            analysisResult.success ? (
              <>
                <ReportResults
                  results={analysisResult.results}
                  metadata={analysisResult.metadata}
                  model={model}
                  warnings={analysisResult.warnings}
                />
                <ReportDiagrams
                  memberResults={analysisResult.results.memberResults}
                  model={model}
                />
              </>
            ) : (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  3. Analysis Results
                </h2>
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Failed</h3>
                  <p className="text-red-700 mb-2">
                    Error Code: {analysisResult.error.code}
                  </p>
                  <p className="text-red-600">{analysisResult.error.message}</p>
                  {analysisResult.error.details?.suggestedFixes && (
                    <div className="mt-4">
                      <p className="font-medium text-red-800">Suggested fixes:</p>
                      <ul className="list-disc list-inside text-red-700">
                        {analysisResult.error.details.suggestedFixes.map((fix, i) => (
                          <li key={i}>{fix}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )
          ) : (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                3. Analysis Results
              </h2>
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  No analysis results available. Please ensure the model has nodes, members, 
                  supports, and at least one load case defined.
                </p>
              </div>
            </section>
          )}

          {/* Footer */}
          <ReportFooter />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 15mm 20mm 15mm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .break-inside-avoid {
            break-inside: avoid;
          }

          /* Hide non-print elements */
          .print\\:hidden {
            display: none !important;
          }

          /* Reset backgrounds for print */
          .bg-gray-100 {
            background-color: white !important;
          }

          /* Ensure tables don't break mid-row */
          tr {
            break-inside: avoid;
          }

          /* Ensure diagrams stay together */
          section {
            break-inside: avoid;
          }

          /* Page numbers (CSS counters) */
          .page-number::after {
            content: counter(page);
          }
        }

        /* Print preview styles */
        @media screen {
          .print-preview {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
          }
        }
      `}</style>
    </div>
  );
}

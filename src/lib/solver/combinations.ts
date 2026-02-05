/**
 * Load Combination Utilities
 *
 * Functions for combining analysis results from multiple load cases
 * into factored combinations and computing envelopes.
 */

import type {
  AnalysisResults,
  MemberResult,
  DiagramPoint,
  CombinedResults,
  EnvelopeResults,
  MemberEnvelope,
} from '@/types/analysis';
import type { LoadCombination } from '@/types';

/**
 * Scale all values in analysis results by a factor.
 */
export function scaleResults(results: AnalysisResults, factor: number): AnalysisResults {
  return {
    reactions: results.reactions.map((r) => ({
      nodeId: r.nodeId,
      fx: r.fx * factor,
      fy: r.fy * factor,
      mz: r.mz * factor,
    })),
    nodeDisplacements: results.nodeDisplacements.map((d) => ({
      nodeId: d.nodeId,
      dx: d.dx * factor,
      dy: d.dy * factor,
      rz: d.rz * factor,
    })),
    memberResults: results.memberResults.map((mr) => ({
      memberId: mr.memberId,
      endForcesLocal: {
        f1x: mr.endForcesLocal.f1x * factor,
        f1y: mr.endForcesLocal.f1y * factor,
        m1: mr.endForcesLocal.m1 * factor,
        f2x: mr.endForcesLocal.f2x * factor,
        f2y: mr.endForcesLocal.f2y * factor,
        m2: mr.endForcesLocal.m2 * factor,
      },
      diagrams: {
        axial: scaleDiagram(mr.diagrams.axial, factor),
        shear: scaleDiagram(mr.diagrams.shear, factor),
        moment: scaleDiagram(mr.diagrams.moment, factor),
        deflection: scaleDiagram(mr.diagrams.deflection, factor),
      },
    })),
  };
}

/**
 * Scale a diagram by a factor.
 */
function scaleDiagram(diagram: DiagramPoint[], factor: number): DiagramPoint[] {
  return diagram.map((p) => ({ x: p.x, value: p.value * factor }));
}

/**
 * Add two analysis results together (element-wise).
 * Both results must have the same structure (same nodes, members, etc.).
 */
export function addResults(a: AnalysisResults, b: AnalysisResults): AnalysisResults {
  // Build maps for efficient lookup
  const bReactions = new Map(b.reactions.map((r) => [r.nodeId, r]));
  const bDisplacements = new Map(b.nodeDisplacements.map((d) => [d.nodeId, d]));
  const bMemberResults = new Map(b.memberResults.map((mr) => [mr.memberId, mr]));

  return {
    reactions: a.reactions.map((rA) => {
      const rB = bReactions.get(rA.nodeId);
      return {
        nodeId: rA.nodeId,
        fx: rA.fx + (rB?.fx ?? 0),
        fy: rA.fy + (rB?.fy ?? 0),
        mz: rA.mz + (rB?.mz ?? 0),
      };
    }),
    nodeDisplacements: a.nodeDisplacements.map((dA) => {
      const dB = bDisplacements.get(dA.nodeId);
      return {
        nodeId: dA.nodeId,
        dx: dA.dx + (dB?.dx ?? 0),
        dy: dA.dy + (dB?.dy ?? 0),
        rz: dA.rz + (dB?.rz ?? 0),
      };
    }),
    memberResults: a.memberResults.map((mrA) => {
      const mrB = bMemberResults.get(mrA.memberId);
      return {
        memberId: mrA.memberId,
        endForcesLocal: {
          f1x: mrA.endForcesLocal.f1x + (mrB?.endForcesLocal.f1x ?? 0),
          f1y: mrA.endForcesLocal.f1y + (mrB?.endForcesLocal.f1y ?? 0),
          m1: mrA.endForcesLocal.m1 + (mrB?.endForcesLocal.m1 ?? 0),
          f2x: mrA.endForcesLocal.f2x + (mrB?.endForcesLocal.f2x ?? 0),
          f2y: mrA.endForcesLocal.f2y + (mrB?.endForcesLocal.f2y ?? 0),
          m2: mrA.endForcesLocal.m2 + (mrB?.endForcesLocal.m2 ?? 0),
        },
        diagrams: {
          axial: addDiagrams(mrA.diagrams.axial, mrB?.diagrams.axial ?? []),
          shear: addDiagrams(mrA.diagrams.shear, mrB?.diagrams.shear ?? []),
          moment: addDiagrams(mrA.diagrams.moment, mrB?.diagrams.moment ?? []),
          deflection: addDiagrams(mrA.diagrams.deflection, mrB?.diagrams.deflection ?? []),
        },
      };
    }),
  };
}

/**
 * Add two diagrams together point-by-point.
 * Assumes both diagrams have the same x-coordinates.
 */
function addDiagrams(a: DiagramPoint[], b: DiagramPoint[]): DiagramPoint[] {
  if (a.length === 0) return b;
  if (b.length === 0) return a;

  // Create map for b values
  const bMap = new Map(b.map((p) => [p.x.toFixed(10), p.value]));

  return a.map((pA) => ({
    x: pA.x,
    value: pA.value + (bMap.get(pA.x.toFixed(10)) ?? 0),
  }));
}

/**
 * Create zero-initialized results with the same structure as the given results.
 */
export function createZeroResults(template: AnalysisResults): AnalysisResults {
  return {
    reactions: template.reactions.map((r) => ({
      nodeId: r.nodeId,
      fx: 0,
      fy: 0,
      mz: 0,
    })),
    nodeDisplacements: template.nodeDisplacements.map((d) => ({
      nodeId: d.nodeId,
      dx: 0,
      dy: 0,
      rz: 0,
    })),
    memberResults: template.memberResults.map((mr) => ({
      memberId: mr.memberId,
      endForcesLocal: { f1x: 0, f1y: 0, m1: 0, f2x: 0, f2y: 0, m2: 0 },
      diagrams: {
        axial: mr.diagrams.axial.map((p) => ({ x: p.x, value: 0 })),
        shear: mr.diagrams.shear.map((p) => ({ x: p.x, value: 0 })),
        moment: mr.diagrams.moment.map((p) => ({ x: p.x, value: 0 })),
        deflection: mr.diagrams.deflection.map((p) => ({ x: p.x, value: 0 })),
      },
    })),
  };
}

/**
 * Combine results from multiple load cases according to a load combination.
 *
 * @param loadCaseResults - Map of load case ID to its analysis results
 * @param combination - The load combination specifying factors
 * @returns Combined results for this combination
 */
export function combineResults(
  loadCaseResults: Map<string, AnalysisResults>,
  combination: LoadCombination
): CombinedResults | null {
  // Get a template for the result structure (any load case will do)
  const templateResults = loadCaseResults.values().next().value as AnalysisResults | undefined;
  if (!templateResults) return null;

  // Start with zero results
  let combinedResults = createZeroResults(templateResults);

  // Add each factored load case
  for (const factor of combination.factors) {
    const loadCaseResult = loadCaseResults.get(factor.loadCaseId);
    if (!loadCaseResult) {
      console.warn(`Load case ${factor.loadCaseId} not found for combination ${combination.name}`);
      continue;
    }

    const scaledResults = scaleResults(loadCaseResult, factor.factor);
    combinedResults = addResults(combinedResults, scaledResults);
  }

  return {
    combinationId: combination.id,
    combinationName: combination.name,
    reactions: combinedResults.reactions,
    nodeDisplacements: combinedResults.nodeDisplacements,
    memberResults: combinedResults.memberResults,
  };
}

/**
 * Compute envelope results from multiple combined results.
 * The envelope shows the max and min values at each point across all combinations.
 *
 * @param combinedResults - Array of combined results from all load combinations
 * @returns Envelope results with max/min diagrams for each member
 */
export function computeEnvelope(combinedResults: CombinedResults[]): EnvelopeResults {
  if (combinedResults.length === 0) {
    return { memberEnvelopes: [] };
  }

  // Get member IDs from the first result
  const firstResult = combinedResults[0];
  if (!firstResult) {
    return { memberEnvelopes: [] };
  }

  const memberIds = firstResult.memberResults.map((mr) => mr.memberId);

  const memberEnvelopes: MemberEnvelope[] = memberIds.map((memberId) => {
    // Collect all results for this member across all combinations
    const memberResultsAcrossCombinations = combinedResults
      .map((cr) => cr.memberResults.find((mr) => mr.memberId === memberId))
      .filter((mr): mr is MemberResult => mr !== undefined);

    if (memberResultsAcrossCombinations.length === 0) {
      return createEmptyEnvelope(memberId);
    }

    // Use the first result as the template for x-coordinates
    const _template = memberResultsAcrossCombinations[0]!;

    return {
      memberId,
      axialMax: computeMaxDiagram(memberResultsAcrossCombinations.map((mr) => mr.diagrams.axial)),
      axialMin: computeMinDiagram(memberResultsAcrossCombinations.map((mr) => mr.diagrams.axial)),
      shearMax: computeMaxDiagram(memberResultsAcrossCombinations.map((mr) => mr.diagrams.shear)),
      shearMin: computeMinDiagram(memberResultsAcrossCombinations.map((mr) => mr.diagrams.shear)),
      momentMax: computeMaxDiagram(memberResultsAcrossCombinations.map((mr) => mr.diagrams.moment)),
      momentMin: computeMinDiagram(memberResultsAcrossCombinations.map((mr) => mr.diagrams.moment)),
      deflectionMax: computeMaxDiagram(memberResultsAcrossCombinations.map((mr) => mr.diagrams.deflection)),
      deflectionMin: computeMinDiagram(memberResultsAcrossCombinations.map((mr) => mr.diagrams.deflection)),
    };
  });

  return { memberEnvelopes };
}

/**
 * Create an empty envelope for a member (when no results exist).
 */
function createEmptyEnvelope(memberId: string): MemberEnvelope {
  return {
    memberId,
    axialMax: [],
    axialMin: [],
    shearMax: [],
    shearMin: [],
    momentMax: [],
    momentMin: [],
    deflectionMax: [],
    deflectionMin: [],
  };
}

/**
 * Compute the maximum value at each point across multiple diagrams.
 */
function computeMaxDiagram(diagrams: DiagramPoint[][]): DiagramPoint[] {
  if (diagrams.length === 0) return [];

  const firstDiagram = diagrams[0];
  if (!firstDiagram || firstDiagram.length === 0) return [];

  return firstDiagram.map((point, i) => {
    const values = diagrams.map((d) => d[i]?.value ?? -Infinity);
    return {
      x: point.x,
      value: Math.max(...values),
    };
  });
}

/**
 * Compute the minimum value at each point across multiple diagrams.
 */
function computeMinDiagram(diagrams: DiagramPoint[][]): DiagramPoint[] {
  if (diagrams.length === 0) return [];

  const firstDiagram = diagrams[0];
  if (!firstDiagram || firstDiagram.length === 0) return [];

  return firstDiagram.map((point, i) => {
    const values = diagrams.map((d) => d[i]?.value ?? Infinity);
    return {
      x: point.x,
      value: Math.min(...values),
    };
  });
}

/**
 * Find the governing combination for a specific criterion.
 * Returns the combination ID that produces the maximum absolute value.
 */
export function findGoverningCombination(
  combinedResults: CombinedResults[],
  criterion: 'maxReaction' | 'maxDisplacement' | 'maxMoment'
): string | null {
  if (combinedResults.length === 0) return null;

  let maxValue = 0;
  let governingId: string | null = null;

  for (const cr of combinedResults) {
    let value = 0;

    switch (criterion) {
      case 'maxReaction':
        value = Math.max(...cr.reactions.map((r) => Math.sqrt(r.fx * r.fx + r.fy * r.fy)));
        break;
      case 'maxDisplacement':
        value = Math.max(...cr.nodeDisplacements.map((d) => Math.sqrt(d.dx * d.dx + d.dy * d.dy)));
        break;
      case 'maxMoment':
        value = Math.max(
          ...cr.memberResults.flatMap((mr) => mr.diagrams.moment.map((p) => Math.abs(p.value))),
          0
        );
        break;
    }

    if (value > maxValue) {
      maxValue = value;
      governingId = cr.combinationId;
    }
  }

  return governingId;
}

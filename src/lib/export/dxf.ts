/**
 * DXF Export Utility
 *
 * Export structural model to DXF format for CAD software.
 */

import type { StructuralModel } from '@/types';

interface DXFExportOptions {
  includeNodes?: boolean;
  includeMembers?: boolean;
  includeSupports?: boolean;
  includeLoads?: boolean;
  includeLabels?: boolean;
  scale?: number;
}

/**
 * Generate DXF content from a structural model
 */
export function generateDXF(
  model: StructuralModel,
  options: DXFExportOptions = {}
): string {
  const {
    includeNodes = true,
    includeMembers = true,
    includeSupports = true,
    includeLoads = true,
    includeLabels = true,
    scale = 1,
  } = options;

  const lines: string[] = [];

  // DXF Header
  lines.push(...generateHeader());

  // Tables section (layers, linetypes)
  lines.push(...generateTables());

  // Blocks section (support symbols)
  lines.push(...generateBlocks());

  // Entities section
  lines.push('0', 'SECTION', '2', 'ENTITIES');

  // Export members (lines)
  if (includeMembers) {
    model.members.forEach((member) => {
      const startNode = model.nodes.find((n) => n.id === member.startNodeId);
      const endNode = model.nodes.find((n) => n.id === member.endNodeId);

      if (startNode && endNode) {
        lines.push(...generateLine(
          startNode.x * scale,
          startNode.y * scale,
          endNode.x * scale,
          endNode.y * scale,
          'MEMBERS'
        ));

        // Member label
        if (includeLabels) {
          const midX = ((startNode.x + endNode.x) / 2) * scale;
          const midY = ((startNode.y + endNode.y) / 2) * scale;
          lines.push(...generateText(midX, midY + 0.3 * scale, member.id, 0.2 * scale, 'LABELS'));
        }
      }
    });
  }

  // Export nodes (points/circles)
  if (includeNodes) {
    model.nodes.forEach((node) => {
      lines.push(...generateCircle(
        node.x * scale,
        node.y * scale,
        0.1 * scale,
        'NODES'
      ));

      // Node label
      if (includeLabels) {
        lines.push(...generateText(
          node.x * scale + 0.15 * scale,
          node.y * scale + 0.15 * scale,
          node.id,
          0.15 * scale,
          'LABELS'
        ));
      }
    });
  }

  // Export supports
  if (includeSupports) {
    model.supports.forEach((support) => {
      const node = model.nodes.find((n) => n.id === support.nodeId);
      if (!node) return;

      const x = node.x * scale;
      const y = node.y * scale;
      const size = 0.3 * scale;

      if (support.dx && support.dy && support.rz) {
        // Fixed support - filled triangle with ground line
        lines.push(...generateFixedSupport(x, y, size, 'SUPPORTS'));
      } else if (support.dx && support.dy) {
        // Pinned support - triangle
        lines.push(...generatePinnedSupport(x, y, size, 'SUPPORTS'));
      } else if (support.dy) {
        // Roller X - triangle on rollers
        lines.push(...generateRollerSupport(x, y, size, 'horizontal', 'SUPPORTS'));
      } else if (support.dx) {
        // Roller Y - triangle on rollers (rotated)
        lines.push(...generateRollerSupport(x, y, size, 'vertical', 'SUPPORTS'));
      }
    });
  }

  // Export loads
  if (includeLoads) {
    // Note: In a full implementation, we would need loadCases passed in
    // For now, we'll skip load arrows in DXF export
  }

  // End entities section
  lines.push('0', 'ENDSEC');

  // DXF Footer
  lines.push('0', 'EOF');

  return lines.join('\n');
}

function generateHeader(): string[] {
  return [
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$ACADVER',
    '1', 'AC1014',
    '9', '$INSUNITS',
    '70', '6', // Meters
    '0', 'ENDSEC',
  ];
}

function generateTables(): string[] {
  const lines = [
    '0', 'SECTION',
    '2', 'TABLES',
  ];

  // Layer table
  lines.push(
    '0', 'TABLE',
    '2', 'LAYER',
  );

  // Define layers
  const layers = [
    { name: 'NODES', color: 3 },      // Green
    { name: 'MEMBERS', color: 7 },    // White
    { name: 'SUPPORTS', color: 5 },   // Blue
    { name: 'LOADS', color: 1 },      // Red
    { name: 'LABELS', color: 2 },     // Yellow
  ];

  layers.forEach((layer) => {
    lines.push(
      '0', 'LAYER',
      '2', layer.name,
      '70', '0',
      '62', layer.color.toString(),
      '6', 'CONTINUOUS',
    );
  });

  lines.push('0', 'ENDTAB');
  lines.push('0', 'ENDSEC');

  return lines;
}

function generateBlocks(): string[] {
  return [
    '0', 'SECTION',
    '2', 'BLOCKS',
    '0', 'ENDSEC',
  ];
}

function generateLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  layer: string
): string[] {
  return [
    '0', 'LINE',
    '8', layer,
    '10', x1.toFixed(6),
    '20', y1.toFixed(6),
    '30', '0',
    '11', x2.toFixed(6),
    '21', y2.toFixed(6),
    '31', '0',
  ];
}

function generateCircle(
  x: number,
  y: number,
  radius: number,
  layer: string
): string[] {
  return [
    '0', 'CIRCLE',
    '8', layer,
    '10', x.toFixed(6),
    '20', y.toFixed(6),
    '30', '0',
    '40', radius.toFixed(6),
  ];
}

function generateText(
  x: number,
  y: number,
  text: string,
  height: number,
  layer: string
): string[] {
  return [
    '0', 'TEXT',
    '8', layer,
    '10', x.toFixed(6),
    '20', y.toFixed(6),
    '30', '0',
    '40', height.toFixed(6),
    '1', text,
  ];
}

function generateFixedSupport(
  x: number,
  y: number,
  size: number,
  layer: string
): string[] {
  const lines: string[] = [];

  // Triangle
  lines.push(...generateLine(x, y, x - size / 2, y - size, layer));
  lines.push(...generateLine(x, y, x + size / 2, y - size, layer));
  lines.push(...generateLine(x - size / 2, y - size, x + size / 2, y - size, layer));

  // Ground line with hatching
  lines.push(...generateLine(x - size * 0.7, y - size, x + size * 0.7, y - size, layer));

  // Hatch lines
  for (let i = -3; i <= 3; i++) {
    const hx = x + (i * size * 0.2);
    lines.push(...generateLine(hx, y - size, hx - size * 0.15, y - size - size * 0.2, layer));
  }

  return lines;
}

function generatePinnedSupport(
  x: number,
  y: number,
  size: number,
  layer: string
): string[] {
  const lines: string[] = [];

  // Triangle
  lines.push(...generateLine(x, y, x - size / 2, y - size, layer));
  lines.push(...generateLine(x, y, x + size / 2, y - size, layer));
  lines.push(...generateLine(x - size / 2, y - size, x + size / 2, y - size, layer));

  // Ground line
  lines.push(...generateLine(x - size * 0.7, y - size, x + size * 0.7, y - size, layer));

  return lines;
}

function generateRollerSupport(
  x: number,
  y: number,
  size: number,
  direction: 'horizontal' | 'vertical',
  layer: string
): string[] {
  const lines: string[] = [];

  if (direction === 'horizontal') {
    // Triangle
    lines.push(...generateLine(x, y, x - size / 2, y - size * 0.7, layer));
    lines.push(...generateLine(x, y, x + size / 2, y - size * 0.7, layer));
    lines.push(...generateLine(x - size / 2, y - size * 0.7, x + size / 2, y - size * 0.7, layer));

    // Rollers (circles)
    const rollerR = size * 0.1;
    lines.push(...generateCircle(x - size * 0.25, y - size * 0.85, rollerR, layer));
    lines.push(...generateCircle(x + size * 0.25, y - size * 0.85, rollerR, layer));

    // Ground line
    lines.push(...generateLine(x - size * 0.7, y - size, x + size * 0.7, y - size, layer));
  } else {
    // Rotated 90 degrees for vertical roller
    lines.push(...generateLine(x, y, x + size * 0.7, y - size / 2, layer));
    lines.push(...generateLine(x, y, x + size * 0.7, y + size / 2, layer));
    lines.push(...generateLine(x + size * 0.7, y - size / 2, x + size * 0.7, y + size / 2, layer));

    // Rollers
    const rollerR = size * 0.1;
    lines.push(...generateCircle(x + size * 0.85, y - size * 0.25, rollerR, layer));
    lines.push(...generateCircle(x + size * 0.85, y + size * 0.25, rollerR, layer));

    // Ground line
    lines.push(...generateLine(x + size, y - size * 0.7, x + size, y + size * 0.7, layer));
  }

  return lines;
}

/**
 * Download DXF file
 */
export function downloadDXF(model: StructuralModel, filename: string, options?: DXFExportOptions): void {
  const dxfContent = generateDXF(model, options);
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.dxf') ? filename : `${filename}.dxf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

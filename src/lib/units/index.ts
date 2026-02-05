/**
 * Unit Conversion System
 * 
 * Converts between SI (kN, m, kPa) and Imperial (kip, ft, ksi) units.
 * Internal calculations always use canonical SI units.
 */

// ============================================================================
// Types
// ============================================================================

export type UnitSystem = 'si' | 'imperial';

export interface UnitDefinition {
  name: string;
  symbol: string;
  toCanonical: number; // Multiply by this to convert to canonical
  fromCanonical: number; // Multiply by this to convert from canonical
}

export interface UnitCategory {
  canonical: UnitDefinition;
  si: UnitDefinition;
  imperial: UnitDefinition;
}

// ============================================================================
// Unit Definitions
// ============================================================================

export const UNITS = {
  length: {
    canonical: { name: 'meter', symbol: 'm', toCanonical: 1, fromCanonical: 1 },
    si: { name: 'meter', symbol: 'm', toCanonical: 1, fromCanonical: 1 },
    imperial: { name: 'foot', symbol: 'ft', toCanonical: 0.3048, fromCanonical: 3.28084 },
  },
  force: {
    canonical: { name: 'kilonewton', symbol: 'kN', toCanonical: 1, fromCanonical: 1 },
    si: { name: 'kilonewton', symbol: 'kN', toCanonical: 1, fromCanonical: 1 },
    imperial: { name: 'kip', symbol: 'kip', toCanonical: 4.44822, fromCanonical: 0.224809 },
  },
  moment: {
    canonical: { name: 'kilonewton-meter', symbol: 'kN·m', toCanonical: 1, fromCanonical: 1 },
    si: { name: 'kilonewton-meter', symbol: 'kN·m', toCanonical: 1, fromCanonical: 1 },
    imperial: { name: 'kip-foot', symbol: 'kip·ft', toCanonical: 1.35582, fromCanonical: 0.737562 },
  },
  stress: {
    canonical: { name: 'kilopascal', symbol: 'kPa', toCanonical: 1, fromCanonical: 1 },
    si: { name: 'megapascal', symbol: 'MPa', toCanonical: 1000, fromCanonical: 0.001 },
    imperial: { name: 'ksi', symbol: 'ksi', toCanonical: 6894.76, fromCanonical: 0.000145038 },
  },
  area: {
    canonical: { name: 'square meter', symbol: 'm²', toCanonical: 1, fromCanonical: 1 },
    si: { name: 'square centimeter', symbol: 'cm²', toCanonical: 0.0001, fromCanonical: 10000 },
    imperial: { name: 'square inch', symbol: 'in²', toCanonical: 0.00064516, fromCanonical: 1550.0031 },
  },
  momentOfInertia: {
    canonical: { name: 'meter^4', symbol: 'm⁴', toCanonical: 1, fromCanonical: 1 },
    si: { name: 'centimeter^4', symbol: 'cm⁴', toCanonical: 1e-8, fromCanonical: 1e8 },
    imperial: { name: 'inch^4', symbol: 'in⁴', toCanonical: 4.162314e-7, fromCanonical: 2402509.61 },
  },
  distributedLoad: {
    canonical: { name: 'kN/m', symbol: 'kN/m', toCanonical: 1, fromCanonical: 1 },
    si: { name: 'kN/m', symbol: 'kN/m', toCanonical: 1, fromCanonical: 1 },
    imperial: { name: 'kip/ft', symbol: 'kip/ft', toCanonical: 14.5939, fromCanonical: 0.0685218 },
  },
  displacement: {
    canonical: { name: 'meter', symbol: 'm', toCanonical: 1, fromCanonical: 1 },
    si: { name: 'millimeter', symbol: 'mm', toCanonical: 0.001, fromCanonical: 1000 },
    imperial: { name: 'inch', symbol: 'in', toCanonical: 0.0254, fromCanonical: 39.3701 },
  },
  rotation: {
    canonical: { name: 'radian', symbol: 'rad', toCanonical: 1, fromCanonical: 1 },
    si: { name: 'milliradian', symbol: 'mrad', toCanonical: 0.001, fromCanonical: 1000 },
    imperial: { name: 'degree', symbol: '°', toCanonical: 0.0174533, fromCanonical: 57.2958 },
  },
} as const;

export type UnitCategoryKey = keyof typeof UNITS;

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert a value from display units to canonical (internal) units
 */
export function toCanonical(
  value: number,
  category: UnitCategoryKey,
  system: UnitSystem
): number {
  const unit = UNITS[category][system];
  return value * unit.toCanonical;
}

/**
 * Convert a value from canonical (internal) units to display units
 */
export function fromCanonical(
  value: number,
  category: UnitCategoryKey,
  system: UnitSystem
): number {
  const unit = UNITS[category][system];
  return value * unit.fromCanonical;
}

/**
 * Get the display symbol for a unit category in a given system
 */
export function getUnitSymbol(category: UnitCategoryKey, system: UnitSystem): string {
  return UNITS[category][system].symbol;
}

/**
 * Get the full unit name
 */
export function getUnitName(category: UnitCategoryKey, system: UnitSystem): string {
  return UNITS[category][system].name;
}

// ============================================================================
// Formatting Functions
// ============================================================================

export interface FormatOptions {
  decimals?: number;
  showUnit?: boolean;
  system?: UnitSystem;
}

/**
 * Format a value with appropriate precision and optional unit
 */
export function formatValue(
  value: number,
  category: UnitCategoryKey,
  options: FormatOptions = {}
): string {
  const { decimals = 3, showUnit = true, system = 'si' } = options;
  
  // Convert from canonical to display units
  const displayValue = fromCanonical(value, category, system);
  
  // Format with appropriate precision
  let formatted: string;
  if (Math.abs(displayValue) < 0.0001 && displayValue !== 0) {
    formatted = displayValue.toExponential(decimals);
  } else if (Math.abs(displayValue) >= 10000) {
    formatted = displayValue.toExponential(decimals);
  } else {
    formatted = displayValue.toFixed(decimals);
  }
  
  if (showUnit) {
    return `${formatted} ${getUnitSymbol(category, system)}`;
  }
  
  return formatted;
}

/**
 * Format a length value
 */
export function formatLength(value: number, system: UnitSystem = 'si'): string {
  return formatValue(value, 'length', { system, decimals: 3 });
}

/**
 * Format a force value
 */
export function formatForce(value: number, system: UnitSystem = 'si'): string {
  return formatValue(value, 'force', { system, decimals: 2 });
}

/**
 * Format a moment value
 */
export function formatMoment(value: number, system: UnitSystem = 'si'): string {
  return formatValue(value, 'moment', { system, decimals: 2 });
}

/**
 * Format a displacement value (in mm or inches)
 */
export function formatDisplacement(value: number, system: UnitSystem = 'si'): string {
  return formatValue(value, 'displacement', { system, decimals: 3 });
}

/**
 * Format a stress value
 */
export function formatStress(value: number, system: UnitSystem = 'si'): string {
  return formatValue(value, 'stress', { system, decimals: 1 });
}

// ============================================================================
// Batch Conversion
// ============================================================================

export interface ConversionBatch {
  lengths?: number[];
  forces?: number[];
  moments?: number[];
  stresses?: number[];
  areas?: number[];
  inertias?: number[];
}

/**
 * Convert a batch of values between unit systems
 */
export function convertBatch(
  batch: ConversionBatch,
  fromSystem: UnitSystem,
  toSystem: UnitSystem
): ConversionBatch {
  const convert = (values: number[] | undefined, category: UnitCategoryKey): number[] | undefined => {
    if (!values) return undefined;
    return values.map(v => {
      const canonical = toCanonical(v, category, fromSystem);
      return fromCanonical(canonical, category, toSystem);
    });
  };

  const result: ConversionBatch = {};
  
  const lengths = convert(batch.lengths, 'length');
  const forces = convert(batch.forces, 'force');
  const moments = convert(batch.moments, 'moment');
  const stresses = convert(batch.stresses, 'stress');
  const areas = convert(batch.areas, 'area');
  const inertias = convert(batch.inertias, 'momentOfInertia');
  
  if (lengths) result.lengths = lengths;
  if (forces) result.forces = forces;
  if (moments) result.moments = moments;
  if (stresses) result.stresses = stresses;
  if (areas) result.areas = areas;
  if (inertias) result.inertias = inertias;
  
  return result;
}

// ============================================================================
// Common Material Conversions
// ============================================================================

/**
 * Common material properties in both unit systems
 */
export const COMMON_MATERIALS = {
  steel: {
    name: 'Steel',
    E_kPa: 200_000_000, // 200 GPa
    E_si: '200 GPa',
    E_imperial: '29,000 ksi',
  },
  aluminum: {
    name: 'Aluminum',
    E_kPa: 70_000_000, // 70 GPa
    E_si: '70 GPa',
    E_imperial: '10,200 ksi',
  },
  concrete: {
    name: 'Concrete (f\'c=30 MPa)',
    E_kPa: 26_000_000, // ~26 GPa
    E_si: '26 GPa',
    E_imperial: '3,770 ksi',
  },
  timber: {
    name: 'Timber (Douglas Fir)',
    E_kPa: 12_400_000, // ~12.4 GPa
    E_si: '12.4 GPa',
    E_imperial: '1,800 ksi',
  },
} as const;

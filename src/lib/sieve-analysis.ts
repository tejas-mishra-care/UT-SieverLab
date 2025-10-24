
import type { ExtendedAggregateType, AnalysisResults } from "./definitions";

// IS 383: 2016
export const SIEVE_SIZES = {
  FINE: [4.75, 2.36, 1.18, 0.6, 0.3, 0.15], // in mm
  COARSE_GRADED: [40, 20, 10, 4.75], // For 20mm Graded
  COARSE_SINGLE_20MM: [20, 10, 4.75], // For 20mm Single Size
  COARSE_SINGLE_10MM: [10, 4.75, 2.36], // For 10mm Single Size
};

export const STANDARD_SIEVES_FM = [4.75, 2.36, 1.18, 0.6, 0.3, 0.15];

// Combined list of all unique sieve sizes, sorted.
export const ALL_SIEVES = [...new Set([...SIEVE_SIZES.COARSE_GRADED, ...SIEVE_SIZES.FINE])].sort((a, b) => a - b);

// IS 383: 2016, Table 7 for 20mm nominal size graded aggregate
export const SPEC_LIMITS_COARSE_GRADED_20MM: Record<number, { min: number; max: number }> = {
    80: { min: 100, max: 100 },
    63: { min: 100, max: 100 },
    40: { min: 95, max: 100 },
    20: { min: 90, max: 100 },
    10: { min: 25, max: 55 },
    4.75: { min: 10, max: 35 },
    2.36: { min: 5, max: 25 },
    1.18: { min: 0, max: 15 },
    0.6: { min: 0, max: 5 },
    0.3: { min: 0, max: 2 },
    0.15: { min: 0, max: 2 },
};

// IS 383: 2016, Table 2: Single-Sized Aggregates
export const SPEC_LIMITS_COARSE_SINGLE_20MM: Record<number, { min: number; max: number }> = {
  25: { min: 100, max: 100 },
  20: { min: 85, max: 100 },
  10: { min: 0, max: 20 },
  4.75: { min: 0, max: 5 },
};

export const SPEC_LIMITS_COARSE_SINGLE_10MM: Record<number, { min: number; max: number }> = {
    12.5: { min: 100, max: 100 },
    10: { min: 85, max: 100 },
    4.75: { min: 0, max: 20 },
    2.36: { min: 0, max: 5 },
};


// IS 383: 2016, Table 9: Grading Zones for Fine Aggregates
export const ZONING_LIMITS: Record<string, Record<number, { min: number; max: number }>> = {
  "Zone I": {
    4.75: { min: 90, max: 100 },
    2.36: { min: 60, max: 95 },
    1.18: { min: 30, max: 70 },
    0.6: { min: 15, max: 34 },
    0.3: { min: 5, max: 20 },
    0.15: { min: 0, max: 10 },
  },
  "Zone II": {
    4.75: { min: 90, max: 100 },
    2.36: { min: 75, max: 100 },
    1.18: { min: 55, max: 90 },
    0.6: { min: 35, max: 59 },
    0.3: { min: 8, max: 30 },
    0.15: { min: 0, max: 10 },
  },
  "Zone III": {
    4.75: { min: 90, max: 100 },
    2.36: { min: 85, max: 100 },
    1.18: { min: 75, max: 100 },
    0.6: { min: 60, max: 79 },
    0.3: { min: 12, max: 40 },
    0.15: { min: 0, max: 10 },
  },
  "Zone IV": {
    4.75: { min: 95, max: 100 },
    2.36: { min: 95, max: 100 },
    1.18: { min: 90, max: 100 },
    0.6: { min: 80, max: 100 },
    0.3: { min: 15, max: 50 },
    0.15: { min: 0, max: 15 },
  },
};

export function getSievesForType(type: ExtendedAggregateType): number[] {
    switch (type) {
        case 'Fine':
            return SIEVE_SIZES.FINE;
        case 'Coarse - Graded':
            return SIEVE_SIZES.COARSE_GRADED;
        case 'Coarse - 20mm':
            return SIEVE_SIZES.COARSE_SINGLE_20MM;
        case 'Coarse - 10mm':
            return SIEVE_SIZES.COARSE_SINGLE_10MM;
        default:
            return [];
    }
}

export function getSpecLimitsForType(type: ExtendedAggregateType, classification?: string | null): Record<number, {min: number, max: number}> | null {
    switch (type) {
        case 'Fine':
            return classification && ZONING_LIMITS[classification] ? ZONING_LIMITS[classification] : null;
        case 'Coarse - Graded':
            return SPEC_LIMITS_COARSE_GRADED_20MM;
        case 'Coarse - 20mm':
            return SPEC_LIMITS_COARSE_SINGLE_20MM;
        case 'Coarse - 10mm':
            return SPEC_LIMITS_COARSE_SINGLE_10MM;
        default:
            return null;
    }
}

/**
 * Calculates sieve analysis results.
 * @param weights - Array of weights retained on each sieve, including the pan.
 * @param sieves - Array of sieve sizes, excluding the pan.
 * @returns Calculated analysis results.
 */
export function calculateSieveAnalysis(
  weights: number[],
  sieves: number[]
): Omit<AnalysisResults, "classification" | "finenessModulus"> {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  if (totalWeight === 0) {
    const zeros = Array(sieves.length).fill(0);
    return {
      percentRetained: zeros,
      cumulativeRetained: zeros,
      percentPassing: zeros,
    };
  }

  const weightsOnSieves = weights.slice(0, sieves.length);
  const percentRetained = weightsOnSieves.map((w) => (w / totalWeight) * 100);
  
  let cumulativeTotal = 0;
  const cumulativeRetained = percentRetained.map(pr => {
    cumulativeTotal += pr;
    return cumulativeTotal;
  });

  const percentPassing = cumulativeRetained.map((cr) => 100 - cr);

  return {
    percentRetained,
    cumulativeRetained,
    percentPassing,
  };
}

/**
 * Classifies fine aggregate into zones based on IS 383.
 * @param percentPassing - Array of percent passing values.
 * @param sieves - Array of sieve sizes.
 * @returns The classification zone or a descriptive string.
 */
export function classifyFineAggregate(
  percentPassing: number[],
  sieves: number[]
): string {
  const passingMap = new Map(sieves.map((s, i) => [s, percentPassing[i]]));

  for (const zone in ZONING_LIMITS) {
    let isMatch = true;
    for (const sieveSize in ZONING_LIMITS[zone]) {
      const sieve = parseFloat(sieveSize);
      if (passingMap.has(sieve)) {
        const passingValue = passingMap.get(sieve)!;
        const { min, max } = ZONING_LIMITS[zone][sieve];
        if (passingValue < min || passingValue > max) {
          isMatch = false;
          break;
        }
      }
    }
    if (isMatch) {
      return zone;
    }
  }

  return "Does not conform to any zone";
}

/**
 * Provides a text-based grading for coarse aggregates.
 * @param percentPassing - Array of percent passing values.
 * @param sieves - Array of sieve sizes.
 * @returns A descriptive string for the grading.
 */
export function classifyCoarseAggregate(
  percentPassing: number[],
  sieves: number[]
): string {
    // This is a simplified classification. A real app would compare against IS 383 Table 7.
    const passing_10mm_index = sieves.indexOf(10);
    if (passing_10mm_index === -1) return "Conforms to IS 383";

    const passing_10mm = percentPassing[passing_10mm_index];
    
    // Check against graded 20mm spec
    const gradedLimits = SPEC_LIMITS_COARSE_GRADED_20MM[10];
    if (passing_10mm >= gradedLimits.min && passing_10mm <= gradedLimits.max) {
        return "Graded Aggregate (e.g., 20mm Nominal)";
    }

    const single20mmLimits = SPEC_LIMITS_COARSE_SINGLE_20MM[10];
    if (passing_10mm >= single20mmLimits.min && passing_10mm <= single20mmLimits.max) {
        return "Single Size Aggregate (20mm)";
    }

    return "Custom/Non-Standard";
}

/**
 * Calculates the Fineness Modulus for fine aggregate.
 * @param cumulativeRetained The array of cumulative percent retained.
 * @param sieves The array of corresponding sieve sizes.
 * @returns The calculated Fineness Modulus.
 */
export function calculateFinenessModulus(
  cumulativeRetained: number[],
  sieves: number[]
): number | null {
  const sumOfCumulativeRetainedOnStandardSieves = sieves.reduce((sum, sieve, index) => {
    // Only include sieves from 4.75mm down to 150 micron (0.15mm)
    if (STANDARD_SIEVES_FM.includes(sieve)) {
      return sum + cumulativeRetained[index];
    }
    return sum;
  }, 0);

  if (sumOfCumulativeRetainedOnStandardSieves > 0) {
    return sumOfCumulativeRetainedOnStandardSieves / 100;
  }

  return null;
}

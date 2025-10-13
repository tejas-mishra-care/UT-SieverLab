import type { AggregateType, AnalysisResults } from "./definitions";

// IS 383: 2016
export const SIEVE_SIZES = {
  FINE: [4.75, 2.36, 1.18, 0.6, 0.3, 0.15], // in mm
  COARSE: [80, 63, 40, 20, 10, 4.75], // in mm
};

export const STANDARD_SIEVES_FM = [4.75, 2.36, 1.18, 0.6, 0.3, 0.15];

// IS 383: 2016, Table 9: Grading Zones for Fine Aggregates
const ZONING_LIMITS: Record<string, Record<number, { min: number; max: number }>> = {
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

/**
 * Calculates sieve analysis results.
 * @param weights - Array of weights retained on each sieve.
 * @param sieves - Array of sieve sizes corresponding to weights.
 * @param type - Aggregate type ('Fine' or 'Coarse').
 * @returns Calculated analysis results.
 */
export function calculateSieveAnalysis(
  weights: number[],
  sieves: number[],
  type: AggregateType
): Omit<AnalysisResults, "classification"> {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  if (totalWeight === 0) {
    const zeros = Array(sieves.length).fill(0);
    return {
      percentRetained: zeros,
      cumulativeRetained: zeros,
      percentPassing: Array(sieves.length).fill(100),
      finenessModulus: null,
    };
  }

  const percentRetained = weights.map((w) => (w / totalWeight) * 100);

  const cumulativeRetained: number[] = [];
  percentRetained.reduce((acc, val) => {
    const newTotal = acc + val;
    cumulativeRetained.push(newTotal);
    return newTotal;
  }, 0);

  const percentPassing = cumulativeRetained.map((cr) => 100 - cr);

  let finenessModulus: number | null = null;
  if (type === "Fine") {
    const sumCumulativeForFM = sieves.reduce((sum, sieve, index) => {
      if (STANDARD_SIEVES_FM.includes(sieve)) {
        return sum + cumulativeRetained[index];
      }
      return sum;
    }, 0);
    finenessModulus = sumCumulativeForFM / 100;
  }

  return {
    percentRetained,
    cumulativeRetained,
    percentPassing,
    finenessModulus,
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
    const passing_10mm = percentPassing[sieves.indexOf(10)];
    if (passing_10mm < 30) {
        return "Graded Aggregate (e.g., 20mm Nominal)";
    }
    if (passing_10mm >= 85) {
        return "Graded Aggregate (e.g., 10mm Nominal)";
    }
    return "Custom/Gap-Graded";
}

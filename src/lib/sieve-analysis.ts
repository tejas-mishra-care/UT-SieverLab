import type { ExtendedAggregateType, AnalysisResults, FineAggregateType } from "./definitions";

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

// IS 383: 2016, Table 7 for 20mm nominal size all-in aggregate
export const SPEC_LIMITS_COARSE_GRADED_20MM: Record<number, { min: number; max: number }> = {
    80: { min: 100, max: 100 },
    63: { min: 100, max: 100 },
    40: { min: 95, max: 100 },
    20: { min: 95, max: 100 },
    10: { min: 40, max: 85 }, // As per table 7, IS 383, for 20mm all-in aggregate.
    4.75: { min: 25, max: 55 },
    2.36: { min: 15, max: 40 },
    1.18: { min: 8, max: 25 },
    0.6: { min: 5, max: 15 },
    0.3: { min: 2, max: 8 },
    0.15: { min: 0, max: 4 },
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


// IS 383: 2016, Table 9: Grading Zones for Fine Aggregates (NATURAL SAND)
export const ZONING_LIMITS_NATURAL_SAND: Record<string, Record<number, { min: number; max: number }>> = {
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

// IS 383: 2016, Table 9 with Note 2 for Crushed Stone Sand
export const ZONING_LIMITS_CRUSHED_SAND: Record<string, Record<number, { min: number; max: number }>> = {
    "Zone I": { ...ZONING_LIMITS_NATURAL_SAND["Zone I"], 0.15: { min: 0, max: 20 } },
    "Zone II": { ...ZONING_LIMITS_NATURAL_SAND["Zone II"], 0.15: { min: 0, max: 20 } },
    "Zone III": { ...ZONING_LIMITS_NATURAL_SAND["Zone III"], 0.15: { min: 0, max: 20 } },
    "Zone IV": { ...ZONING_LIMITS_NATURAL_SAND["Zone IV"], 0.15: { min: 0, max: 25 } },
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

export function getSpecLimitsForType(type: ExtendedAggregateType, classification?: string | null, fineAggType?: FineAggregateType): Record<number, {min: number, max: number}> | null {
    switch (type) {
        case 'Fine':
            if (!classification) return null;
            const limits = fineAggType === 'Crushed Sand' ? ZONING_LIMITS_CRUSHED_SAND : ZONING_LIMITS_NATURAL_SAND;
            return limits[classification] || null;
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
 * Classifies fine aggregate into a zone based ONLY on the 600 micron sieve's % passing.
 * @param percentPassing - Array of percent passing values.
 * @param sieves - Array of sieve sizes.
 * @param fineAggType - The type of fine aggregate.
 * @returns The classification zone (e.g., "Zone II") or "Does not conform".
 */
export function classifyFineAggregate(
    percentPassing: number[],
    sieves: number[],
    fineAggType: FineAggregateType,
  ): string {
    const micron600SieveIndex = sieves.indexOf(0.6);
    if (micron600SieveIndex === -1) {
      return "600 micron sieve not found";
    }
  
    const passingValue600 = percentPassing[micron600SieveIndex];

    const limits = fineAggType === 'Crushed Sand' ? ZONING_LIMITS_CRUSHED_SAND : ZONING_LIMITS_NATURAL_SAND;
  
    for (const zone in limits) {
      const limits600 = limits[zone][0.6];
      if (passingValue600 >= limits600.min && passingValue600 <= limits600.max) {
        return zone; 
      }
    }
    
    return "Does not conform";
}
  

export function classifyCoarseAggregate(
  percentPassing: number[],
  sieves: number[],
  type: ExtendedAggregateType
): string {
    const limits = getSpecLimitsForType(type);
    if (!limits) return "Non-Standard";
  
    for (const sieve of sieves) {
      const index = sieves.indexOf(sieve);
      const passing = percentPassing[index];
      const spec = limits[sieve];
      if (spec && (passing < spec.min || passing > spec.max)) {
        return "Does not conform";
      }
    }
  
    return "Conforms to IS 383";
}

export function calculateFinenessModulus(
  cumulativeRetained: number[],
  sieves: number[]
): number {
  const sumOfCumulativeRetainedOnStandardSieves = sieves.reduce((sum, sieve, index) => {
    if (STANDARD_SIEVES_FM.includes(sieve)) {
      return sum + cumulativeRetained[index];
    }
    return sum;
  }, 0);

  return sumOfCumulativeRetainedOnStandardSieves / 100;
}


interface Material {
    name: string;
    passingCurve: Map<number, number>;
}

export function calculateOptimalBlend(
    materials: Material[]
  ): Record<string, number> | null {
    
    const targetCurve = new Map<number, number>();
    const allSievesInSpec = Object.keys(SPEC_LIMITS_COARSE_GRADED_20MM).map(parseFloat);

    for (const sieve of allSievesInSpec) {
        const { min, max } = SPEC_LIMITS_COARSE_GRADED_20MM[sieve];
        targetCurve.set(sieve, (min + max) / 2);
    }

    const allSievesInMaterials = new Set<number>();
    materials.forEach(m => m.passingCurve.forEach((_, sieve) => allSievesInMaterials.add(sieve)));
    
    const combinedSieves = new Set([...allSievesInSpec, ...allSievesInMaterials]);
    const sortedSieves = Array.from(combinedSieves).sort((a,b) => b-a);

    let bestFit: { percentages: number[], score: number } | null = null;
    const step = 2; // Finer step for better accuracy

    const numMaterials = materials.length;
    if (numMaterials < 2) return null;

    // Recursive function to iterate through combinations
    function findBest(index: number, currentPercentages: number[], remaining: number) {
        if (index === numMaterials - 1) {
            const finalPercentages = [...currentPercentages, remaining];
            const { score, isWithinSpec } = calculateFitScore(finalPercentages, materials, sortedSieves);
            if (isWithinSpec && (!bestFit || score < bestFit.score)) {
                bestFit = { percentages: finalPercentages, score };
            }
            return;
        }

        for (let p = 0; p <= remaining; p += step) {
            findBest(index + 1, [...currentPercentages, p], remaining - p);
        }
    }

    findBest(0, [], 100);

    if (bestFit) {
        const result: Record<string, number> = {};
        materials.forEach((m, i) => {
            result[m.name] = bestFit!.percentages[i];
        });
        return result;
    }

    return null;
}

function calculateFitScore(
    percentages: number[],
    materials: Material[],
    sortedSieves: number[]
) {
    let totalScore = 0;
    let isWithinSpec = true;

    for (const sieve of sortedSieves) {
        const specLimits = SPEC_LIMITS_COARSE_GRADED_20MM[sieve];
        if (!specLimits) continue;

        let combinedPassing = 0;
        for (let i = 0; i < materials.length; i++) {
            const material = materials[i];
            const materialPassing = material.passingCurve.get(sieve) ?? (sieve > Math.max(...material.passingCurve.keys()) ? 100 : 0);
            combinedPassing += materialPassing * (percentages[i] / 100);
        }

        if (combinedPassing < specLimits.min || combinedPassing > specLimits.max) {
            isWithinSpec = false;
            // Apply a penalty based on how far out of spec it is
            const deviation = combinedPassing < specLimits.min 
                ? specLimits.min - combinedPassing 
                : combinedPassing - specLimits.max;
            totalScore += 1000 + Math.pow(deviation, 2); // Heavy base penalty + squared deviation
        } else {
            const targetPassing = (specLimits.min + specLimits.max) / 2;
            totalScore += Math.pow(combinedPassing - targetPassing, 2);
        }
    }
    return { score: totalScore, isWithinSpec };
}

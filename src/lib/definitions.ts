export type AggregateType = "Fine" | "Coarse";

export interface SieveData {
  sieveSize: number;
  weightRetained: number;
}

export interface AnalysisResults {
  percentRetained: number[];
  cumulativeRetained: number[];
  percentPassing: number[];
  finenessModulus: number | null;
  classification: string | null;
}

export interface SieveAnalysisTest {
  id: string;
  userId: string;
  type: AggregateType;
  timestamp: number;
  sieves: number[];
  weights: number[];
  results: AnalysisResults;
  reportUrl?: string;
}

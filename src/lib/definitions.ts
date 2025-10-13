
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

// This is the shape of the data stored in Firestore
export interface SieveAnalysisTest {
  id: string;
  userId: string;
  name: string;
  type: AggregateType;
  timestamp: number;
  sieves: number[];
  weights: number[];
  // Analysis results are stored at the top level for easier querying
  percentRetained: number[];
  cumulativeRetained: number[];
  percentPassing: number[];
  finenessModulus: number | null;
  classification: string | null;
  reportUrl?: string;
  status: 'draft' | 'completed';
}

import { SieveAnalysisTest } from "./definitions";

export const mockTests: SieveAnalysisTest[] = [
  {
    id: "test-1",
    userId: "user-1",
    type: "Fine",
    timestamp: new Date("2024-05-10T10:30:00Z").getTime(),
    sieves: [4.75, 2.36, 1.18, 0.6, 0.3, 0.15],
    weights: [10, 25, 215, 450, 200, 80],
    results: {
      percentRetained: [1, 2.5, 21.5, 45, 20, 8],
      cumulativeRetained: [1, 3.5, 25, 70, 90, 98],
      percentPassing: [99, 96.5, 75, 30, 10, 2],
      finenessModulus: 2.875,
      classification: "Zone III",
    },
    reportUrl: "/placeholder.pdf",
  },
  {
    id: "test-2",
    userId: "user-1",
    type: "Coarse",
    timestamp: new Date("2024-05-12T14:00:00Z").getTime(),
    sieves: [40, 20, 10, 4.75],
    weights: [0, 1350, 2400, 250],
    results: {
      percentRetained: [0, 33.75, 60, 6.25],
      cumulativeRetained: [0, 33.75, 93.75, 100],
      percentPassing: [100, 66.25, 6.25, 0],
      finenessModulus: null,
      classification: "Graded Aggregate (20mm Nominal)",
    },
    reportUrl: "/placeholder.pdf",
  },
  {
    id: "test-3",
    userId: "user-1",
    type: "Fine",
    timestamp: new Date("2024-04-28T09:15:00Z").getTime(),
    sieves: [4.75, 2.36, 1.18, 0.6, 0.3, 0.15],
    weights: [5, 150, 250, 300, 150, 45],
    results: {
      percentRetained: [0.5, 15, 25, 30, 15, 4.5],
      cumulativeRetained: [0.5, 15.5, 40.5, 70.5, 85.5, 90],
      percentPassing: [99.5, 84.5, 59.5, 29.5, 14.5, 10],
      finenessModulus: 3.025,
      classification: "Zone II",
    },
    reportUrl: "/placeholder.pdf",
  },
];

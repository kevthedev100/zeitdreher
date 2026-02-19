export interface OptimizationSuggestion {
  title: string;
  description: string;
  potential: string;
  type: "purple" | "blue" | "green" | "amber";
}

export interface TimeEntryData {
  date: string;
  duration: number;
  area: string;
  field: string;
  activity: string;
  description?: string;
}

export interface OptimizationAnalysisRequest {
  entries: TimeEntryData[];
  userId?: string;
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface OptimizationAnalysisResponse {
  suggestions: OptimizationSuggestion[];
  summary: string;
  dataQuality: {
    entriesAnalyzed: number;
    confidenceScore: number;
  };
}

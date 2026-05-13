// Stub — real GEO technical rules implemented in TKT-015.
export interface TechnicalAnalysisResult {
  score: number
  issueCount: number
}

export async function runTechnicalAnalysis(
  _siteId: string
): Promise<TechnicalAnalysisResult> {
  return { score: 80, issueCount: 0 }
}

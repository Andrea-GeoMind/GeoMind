// Stub — real GEO content rules implemented in TKT-016.
export interface ContentAnalysisResult {
  score: number
  issueCount: number
}

export async function runContentAnalysis(
  _siteId: string
): Promise<ContentAnalysisResult> {
  return { score: 80, issueCount: 0 }
}

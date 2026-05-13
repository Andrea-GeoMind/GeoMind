export interface AnalysisScoreSnapshot {
  globalScore: number
  authorityScore: number
  technicalScore: number
  contentScore: number
}

export interface ScoreDeltas {
  globalDelta: number
  authorityDelta: number
  technicalDelta: number
  contentDelta: number
}

// Returns point-difference between current and previous analysis scores.
// Only call with status='success' analyses (scores are guaranteed non-null).
export function computeDeltas(
  current: AnalysisScoreSnapshot,
  previous: AnalysisScoreSnapshot
): ScoreDeltas {
  return {
    globalDelta:    current.globalScore    - previous.globalScore,
    authorityDelta: current.authorityScore - previous.authorityScore,
    technicalDelta: current.technicalScore - previous.technicalScore,
    contentDelta:   current.contentScore   - previous.contentScore,
  }
}

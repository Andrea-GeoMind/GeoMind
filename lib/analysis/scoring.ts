export interface AuthorityData {
  successfulCalls: number
  clientCitationsFound: number
}

export interface Scores {
  globalScore: number
  authorityScore: number
  technicalScore: number
  contentScore: number
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

// Pure function — same inputs always produce the same outputs.
// authorityData comes from runAuthorityAnalysis return value.
// technicalScore and contentScore come from their respective analysis runners.
export function computeScores(
  authorityData: AuthorityData,
  technicalScore: number,
  contentScore: number
): Scores {
  const authorityScore =
    authorityData.successfulCalls > 0
      ? (authorityData.clientCitationsFound / authorityData.successfulCalls) * 100
      : 0

  const globalScore = (authorityScore + technicalScore + contentScore) / 3

  return {
    globalScore: clamp(globalScore),
    authorityScore: clamp(authorityScore),
    technicalScore: clamp(technicalScore),
    contentScore: clamp(contentScore),
  }
}

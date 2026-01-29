/**
 * Calculate hot score for posts
 * Formula: (like_count * 2) + (comment_count * 3) + log(view_count + 1)
 * Then apply time decay: 1 / ((hours_since_post + 2) ^ 1.3)
 */
export function calculateHotScore(
  likeCount: number,
  commentCount: number,
  viewCount: number,
  createdAt: Date
): number {
  const baseScore =
    likeCount * 2 + commentCount * 3 + Math.log(viewCount + 1);

  const hoursSincePost =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const timeDecay = 1 / Math.pow(hoursSincePost + 2, 1.3);

  return baseScore * timeDecay;
}

/**
 * Update hot score for a post
 */
export function updateHotScore(
  likeCount: number,
  commentCount: number,
  viewCount: number,
  createdAt: Date
): number {
  return calculateHotScore(likeCount, commentCount, viewCount, createdAt);
}

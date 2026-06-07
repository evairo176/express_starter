import { db } from '../src/database/database';

/**
 * One-time migration script: reset every existing blog post's `totalViews` to 0.
 *
 * This lets view counting begin fresh under the new session-based tracking system
 * (BlogPostView with @@unique([blogPostId, sessionId])). Run this once after
 * deploying the session-based view-counting feature.
 *
 * Usage: npm run reset-blog-views
 *
 * Requirements: 5b.4
 */
async function resetBlogViews(): Promise<void> {
  const result = await db.blogPost.updateMany({ data: { totalViews: 0 } });

  console.log(`Reset totalViews to 0 for ${result.count} blog post(s).`);
}

resetBlogViews()
  .catch((error) => {
    console.error('Failed to reset blog views:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });

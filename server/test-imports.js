// Debug: check if functions are exported correctly
import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, bulkUpdatePosts, getBlogAnalytics } from './src/controllers/blogController.js';

console.log('🔍 Checking blog controller exports:');
console.log('getBlogPosts:', typeof getBlogPosts);
console.log('createBlogPost:', typeof createBlogPost);
console.log('updateBlogPost:', typeof updateBlogPost);
console.log('deleteBlogPost:', typeof deleteBlogPost);
console.log('bulkUpdatePosts:', typeof bulkUpdatePosts);
console.log('getBlogAnalytics:', typeof getBlogAnalytics);

if (typeof getBlogPosts === 'function') {
  console.log('✅ All blog functions are properly exported');
} else {
  console.log('❌ Blog functions are not exported correctly');
}

import { pool } from '../config/database.js';

// Simple function to get blog posts - chỉ để hiển thị dữ liệu
export const getBlogPosts = async (req, res) => {
  try {
    console.log('📋 Getting blog posts from database...');
    
    // Simple query to get all blog posts
    const [posts] = await pool.execute(`
      SELECT 
        id,
        smoker_id,
        title,
        content,
        thumbnail_url,
        created_at,
        updated_at
      FROM blog_post 
      ORDER BY created_at DESC
    `);

    console.log(`✅ Found ${posts.length} blog posts`);

    return res.status(200).json({
      success: true,
      message: 'Blog posts retrieved successfully',
      data: {
        posts: posts,
        total: posts.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching blog posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching blog posts',
      error: error.message
    });
  }
};

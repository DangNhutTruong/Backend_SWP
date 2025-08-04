import { pool } from '../config/database.js';

// ===== READ - Get all blog posts =====
export const getBlogPosts = async (req, res) => {
  try {
    console.log('📋 Getting blog posts from database...');
    
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('Query params:', { page, limit, search, offset });
    
    let whereClause = '';
    let queryParams = [];
    
    if (search && search.trim()) {
      whereClause = 'WHERE title LIKE ? OR content LIKE ?';
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    console.log('WHERE clause:', whereClause);
    console.log('Query params before count:', queryParams);
    
    // Parse and validate pagination params
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offsetNum = (pageNum - 1) * limitNum;
    
    console.log('Parsed params:', { pageNum, limitNum, offsetNum });
    
    // Get total count for pagination
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM blog_post ${whereClause}`,
      queryParams
    );
    
    // Get blog posts with pagination  
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
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `, queryParams);

    console.log(`✅ Found ${posts.length} blog posts`);

    return res.status(200).json({
      success: true,
      message: 'Blog posts retrieved successfully',
      data: {
        posts: posts,
        total: countResult[0].total,
        pagination: {
          current: pageNum,
          pageSize: limitNum,
          total: countResult[0].total
        }
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

// ===== READ - Get single blog post =====
export const getBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Getting blog post with ID: ${id}`);

    const [posts] = await pool.execute(
      'SELECT * FROM blog_post WHERE id = ?',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    console.log(`✅ Found blog post: ${posts[0].title}`);
    return res.status(200).json({
      success: true,
      data: posts[0]
    });

  } catch (error) {
    console.error('❌ Error fetching blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching blog post',
      error: error.message
    });
  }
};

// ===== CREATE - Create new blog post =====
export const createBlogPost = async (req, res) => {
  try {
    const { title, content, thumbnail_url, smoker_id } = req.body;
    console.log(`📝 Creating new blog post: ${title}`);

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và nội dung là bắt buộc'
      });
    }

    // Insert new blog post
    const [result] = await pool.execute(
      `INSERT INTO blog_post (title, content, thumbnail_url, smoker_id, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [title, content, thumbnail_url, smoker_id || null]
    );

    // Get the created blog post
    const [newPost] = await pool.execute(
      'SELECT * FROM blog_post WHERE id = ?',
      [result.insertId]
    );

    console.log(`✅ Created blog post with ID: ${result.insertId}`);
    return res.status(201).json({
      success: true,
      message: 'Tạo bài viết thành công',
      data: newPost[0]
    });

  } catch (error) {
    console.error('❌ Error creating blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating blog post',
      error: error.message
    });
  }
};

// ===== UPDATE - Update blog post =====
export const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, thumbnail_url, smoker_id } = req.body;
    console.log(`📝 Updating blog post with ID: ${id}`);

    // Check if post exists
    const [existingPost] = await pool.execute(
      'SELECT id FROM blog_post WHERE id = ?',
      [id]
    );

    if (existingPost.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và nội dung là bắt buộc'
      });
    }

    // Update blog post
    await pool.execute(
      `UPDATE blog_post 
       SET title = ?, content = ?, thumbnail_url = ?, smoker_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, content, thumbnail_url, smoker_id || null, id]
    );

    // Get updated blog post
    const [updatedPost] = await pool.execute(
      'SELECT * FROM blog_post WHERE id = ?',
      [id]
    );

    console.log(`✅ Updated blog post: ${title}`);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật bài viết thành công',
      data: updatedPost[0]
    });

  } catch (error) {
    console.error('❌ Error updating blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating blog post',
      error: error.message
    });
  }
};

// ===== DELETE - Delete blog post =====
export const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting blog post with ID: ${id}`);

    // Check if post exists
    const [existingPost] = await pool.execute(
      'SELECT id, title FROM blog_post WHERE id = ?',
      [id]
    );

    if (existingPost.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Delete blog post
    await pool.execute('DELETE FROM blog_post WHERE id = ?', [id]);

    console.log(`✅ Deleted blog post: ${existingPost[0].title}`);
    return res.status(200).json({
      success: true,
      message: 'Xóa bài viết thành công'
    });

  } catch (error) {
    console.error('❌ Error deleting blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting blog post',
      error: error.message
    });
  }
};

// ===== DELETE - Bulk delete blog posts =====
export const bulkDeletePosts = async (req, res) => {
  try {
    const { ids } = req.body;
    console.log(`🗑️ Bulk deleting blog posts with IDs: ${ids.join(', ')}`);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách ID không hợp lệ'
      });
    }

    // Create placeholders for IN clause
    const placeholders = ids.map(() => '?').join(',');
    
    // Delete multiple blog posts
    const [result] = await pool.execute(
      `DELETE FROM blog_post WHERE id IN (${placeholders})`,
      ids
    );

    console.log(`✅ Deleted ${result.affectedRows} blog posts`);
    return res.status(200).json({
      success: true,
      message: `Đã xóa ${result.affectedRows} bài viết`,
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error('❌ Error bulk deleting blog posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error bulk deleting blog posts',
      error: error.message
    });
  }
};

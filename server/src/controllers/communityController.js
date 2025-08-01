import CommunityPost from '../models/CommunityPost.js';

/**
 * Community Posts Controller
 * Handles HTTP requests for community posts
 */

/**
 * Get all community posts
 */
export const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const posts = await CommunityPost.findAll({ limit, offset });
        const totalCount = await CommunityPost.getCount();
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Error getting all posts:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách bài viết',
            error: error.message
        });
    }
};

/**
 * Get a single post by ID
 */
export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await CommunityPost.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        res.json({
            success: true,
            data: post
        });
    } catch (error) {
        console.error('Error getting post by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy bài viết',
            error: error.message
        });
    }
};

/**
 * Create a new community post
 */
export const createPost = async (req, res) => {
    try {
        const { title, content, thumbnail_url } = req.body;
        const smoker_id = req.user.id; // From auth middleware

        console.log('📥 Create post request:', { 
            title, 
            content: content?.substring(0, 50), 
            thumbnail_size: thumbnail_url ? `${thumbnail_url.length} chars` : 'none',
            smoker_id 
        });

        // Validation
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu đề và nội dung là bắt buộc'
            });
        }

        if (title.length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu đề không được vượt quá 255 ký tự'
            });
        }

        if (content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung không được vượt quá 5000 ký tự'
            });
        }

        // Validate thumbnail_url size if present
        if (thumbnail_url && thumbnail_url.length > 2 * 1024 * 1024) { // 2MB base64
            return res.status(400).json({
                success: false,
                message: 'Hình ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn.'
            });
        }

        const postData = {
            smoker_id,
            title: title.trim(),
            content: content.trim(),
            thumbnail_url: thumbnail_url || null
        };

        const newPost = await CommunityPost.create(postData);
        console.log('📝 Created new post with ID:', newPost.id);

        res.status(201).json({
            success: true,
            message: 'Tạo bài viết thành công',
            data: newPost
        });
    } catch (error) {
        console.error('Error creating post:', error);
        
        // Check for specific database errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                details: error.errors?.map(e => e.message)
            });
        }
        
        if (error.code === 'ER_DATA_TOO_LONG') {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu quá lớn. Vui lòng giảm kích thước hình ảnh hoặc nội dung.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo bài viết',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update a community post
 */
export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, thumbnail_url } = req.body;
        const userId = req.user.id;

        // Check if post exists and belongs to user
        const existingPost = await CommunityPost.findById(id);
        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        if (existingPost.smoker_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền chỉnh sửa bài viết này'
            });
        }

        // Validation
        if (title && title.length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Tiêu đề không được vượt quá 255 ký tự'
            });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (content !== undefined) updateData.content = content.trim();
        if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;

        const updatedPost = await CommunityPost.update(id, updateData);

        res.json({
            success: true,
            message: 'Cập nhật bài viết thành công',
            data: updatedPost
        });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật bài viết',
            error: error.message
        });
    }
};

/**
 * Delete a community post
 */
export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        console.log(`Delete request - Post ID: ${id}, User ID: ${userId}`);

        const deleted = await CommunityPost.delete(id, userId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài viết hoặc bạn không có quyền xóa'
            });
        }

        res.json({
            success: true,
            message: 'Xóa bài viết thành công'
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa bài viết',
            error: error.message
        });
    }
};

/**
 * Get posts by current user
 */
export const getCurrentUserPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const posts = await CommunityPost.findByUserId(userId, { limit, offset });

        res.json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error('Error getting user posts:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy bài viết của người dùng',
            error: error.message
        });
    }
};

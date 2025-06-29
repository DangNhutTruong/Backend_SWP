import CommunityPost from '../models/CommunityPost.js';
import CommunityComment from '../models/CommunityComment.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

// Create a new community post
export const createCommunityPost = async (req, res) => {
  try {
    const { title, content, type, tags, images } = req.body;
    const userId = req.user.UserID;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và nội dung là bắt buộc'
      });
    }

    const post = await CommunityPost.create({
      UserID: userId,
      Title: title,
      Content: content,
      Type: type || 'story',
      Tags: tags || [],
      Images: images || []
    });

    // Fetch the post with user details
    const postWithUser = await CommunityPost.findByPk(post.PostID, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['UserID', 'Name', 'Email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: postWithUser,
      message: 'Tạo bài viết cộng đồng thành công'
    });

  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo bài viết'
    });
  }
};

// Get community posts with pagination and filters
export const getCommunityPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      search,
      userId,
      sortBy = 'CreatedAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = { Status: 'active' };

    // Apply filters
    if (type) {
      whereConditions.Type = type;
    }

    if (userId) {
      whereConditions.UserID = userId;
    }

    if (search) {
      whereConditions[Op.or] = [
        { Title: { [Op.like]: `%${search}%` } },
        { Content: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: posts } = await CommunityPost.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['UserID', 'Name', 'Email']
        }
      ],
      order: [
        ['IsPinned', 'DESC'],
        ['IsFeatured', 'DESC'],
        [sortBy, sortOrder.toUpperCase()]
      ],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting community posts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách bài viết'
    });
  }
};

// Get a specific community post
export const getCommunityPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await CommunityPost.findOne({
      where: {
        PostID: id,
        Status: 'active'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['UserID', 'Name', 'Email']
        }
      ]
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Increment view count
    await post.increment('ViewCount');

    res.json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Error getting community post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin bài viết'
    });
  }
};

// Update a community post
export const updateCommunityPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const updateData = req.body;

    const post = await CommunityPost.findOne({
      where: {
        PostID: id,
        UserID: userId,
        Status: 'active'
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết hoặc bạn không có quyền chỉnh sửa'
      });
    }

    await post.update(updateData);

    const updatedPost = await CommunityPost.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['UserID', 'Name', 'Email']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedPost,
      message: 'Cập nhật bài viết thành công'
    });

  } catch (error) {
    console.error('Error updating community post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật bài viết'
    });
  }
};

// Delete a community post
export const deleteCommunityPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const userRole = req.user.Role;

    const post = await CommunityPost.findByPk(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Check permission (owner or admin)
    if (post.UserID !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bài viết này'
      });
    }

    await post.update({ Status: 'deleted' });

    res.json({
      success: true,
      message: 'Xóa bài viết thành công'
    });

  } catch (error) {
    console.error('Error deleting community post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa bài viết'
    });
  }
};

// Like/Unlike a community post
export const toggleCommunityPostLike = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await CommunityPost.findByPk(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    // Simple increment like count (in real app, you'd track user likes)
    await post.increment('LikeCount');

    res.json({
      success: true,
      data: {
        likeCount: post.LikeCount + 1
      },
      message: 'Đã thích bài viết'
    });

  } catch (error) {
    console.error('Error toggling community post like:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi thích bài viết'
    });
  }
};

// Add comment to a community post
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user.UserID;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không được để trống'
      });
    }

    const post = await CommunityPost.findByPk(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết'
      });
    }

    const comment = await CommunityComment.create({
      PostID: id,
      UserID: userId,
      Content: content,
      ParentCommentID: parentCommentId || null
    });

    // Increment comment count
    await post.increment('CommentCount');

    // Fetch comment with user details
    const commentWithUser = await CommunityComment.findByPk(comment.CommentID, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['UserID', 'Name', 'Email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: commentWithUser,
      message: 'Thêm bình luận thành công'
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi thêm bình luận'
    });
  }
};

// Get comments for a community post
export const getPostComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: comments } = await CommunityComment.findAndCountAll({
      where: {
        PostID: id,
        Status: 'active',
        ParentCommentID: null // Top-level comments only
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['UserID', 'Name', 'Email']
        },
        {
          model: CommunityComment,
          as: 'replies',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['UserID', 'Name', 'Email']
            }
          ],
          where: { Status: 'active' },
          required: false
        }
      ],
      order: [['CreatedAt', 'ASC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: comments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Error getting post comments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy bình luận'
    });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.UserID;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không được để trống'
      });
    }

    const comment = await CommunityComment.findOne({
      where: {
        CommentID: commentId,
        UserID: userId,
        Status: 'active'
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận hoặc bạn không có quyền chỉnh sửa'
      });
    }

    await comment.update({ Content: content });

    const updatedComment = await CommunityComment.findByPk(commentId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['UserID', 'Name', 'Email']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedComment,
      message: 'Cập nhật bình luận thành công'
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật bình luận'
    });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.UserID;
    const userRole = req.user.Role;

    const comment = await CommunityComment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bình luận'
      });
    }

    // Check permission (owner or admin)
    if (comment.UserID !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bình luận này'
      });
    }

    await comment.update({ Status: 'deleted' });

    // Decrement comment count
    const post = await CommunityPost.findByPk(comment.PostID);
    if (post) {
      await post.decrement('CommentCount');
    }

    res.json({
      success: true,
      message: 'Xóa bình luận thành công'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa bình luận'
    });
  }
};

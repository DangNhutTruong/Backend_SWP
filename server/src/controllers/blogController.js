import BlogPost from '../models/BlogPost.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

// Create a new blog post
export const createBlogPost = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      featuredImage,
      category,
      tags,
      status,
      metaTitle,
      metaDescription,
      slugUrl,
      publishedAt
    } = req.body;

    const authorId = req.user.UserID;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề và nội dung là bắt buộc'
      });
    }

    // Create slug from title if not provided
    let slug = slugUrl;
    if (!slug) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      
      // Add timestamp to ensure uniqueness
      slug += '-' + Date.now();
    }

    // Check if slug already exists
    const existingPost = await BlogPost.findOne({
      where: { SlugUrl: slug }
    });

    if (existingPost) {
      slug += '-' + Date.now();
    }

    // Set published date if status is published
    let publishDate = publishedAt;
    if (status === 'published' && !publishDate) {
      publishDate = new Date();
    }

    const blogPost = await BlogPost.create({
      AuthorID: authorId,
      Title: title,
      Content: content,
      Excerpt: excerpt || content.substring(0, 200) + '...',
      FeaturedImage: featuredImage,
      Category: category || 'general',
      Tags: tags || [],
      Status: status || 'draft',
      PublishedAt: publishDate,
      MetaTitle: metaTitle || title,
      MetaDescription: metaDescription || excerpt,
      SlugUrl: slug
    });

    res.status(201).json({
      success: true,
      data: blogPost,
      message: 'Tạo bài viết thành công'
    });

  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo bài viết'
    });
  }
};

// Get all blog posts with pagination and filters
export const getBlogPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      authorId,
      search,
      sortBy = 'CreatedAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Apply filters
    if (status) {
      whereConditions.Status = status;
    }

    if (category) {
      whereConditions.Category = category;
    }

    if (authorId) {
      whereConditions.AuthorID = authorId;
    }

    if (search) {
      whereConditions[Op.or] = [
        { Title: { [Op.like]: `%${search}%` } },
        { Content: { [Op.like]: `%${search}%` } },
        { Excerpt: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: posts } = await BlogPost.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['UserID', 'Name', 'Email']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
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
    console.error('Error getting blog posts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách bài viết'
    });
  }
};

// Get a specific blog post by ID or slug
export const getBlogPost = async (req, res) => {
  try {
    const { identifier } = req.params;
    let whereCondition;

    // Check if identifier is numeric (ID) or string (slug)
    if (!isNaN(identifier)) {
      whereCondition = { PostID: identifier };
    } else {
      whereCondition = { SlugUrl: identifier };
    }

    const post = await BlogPost.findOne({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'author',
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
    console.error('Error getting blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông tin bài viết'
    });
  }
};

// Update a blog post
export const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;
    const updateData = req.body;

    const post = await BlogPost.findOne({
      where: {
        PostID: id,
        AuthorID: userId
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết hoặc bạn không có quyền chỉnh sửa'
      });
    }

    // Handle slug update
    if (updateData.title && !updateData.slugUrl) {
      updateData.slugUrl = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }

    // Set published date if status changes to published
    if (updateData.status === 'published' && post.Status !== 'published' && !updateData.publishedAt) {
      updateData.publishedAt = new Date();
    }

    await post.update(updateData);

    res.json({
      success: true,
      data: post,
      message: 'Cập nhật bài viết thành công'
    });

  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật bài viết'
    });
  }
};

// Delete a blog post
export const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.UserID;

    const post = await BlogPost.findOne({
      where: {
        PostID: id,
        AuthorID: userId
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài viết hoặc bạn không có quyền xóa'
      });
    }

    await post.destroy();

    res.json({
      success: true,
      message: 'Xóa bài viết thành công'
    });

  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa bài viết'
    });
  }
};

// Get published blog posts (public endpoint)
export const getPublishedPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = 'PublishedAt'
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = { Status: 'published' };

    if (category) {
      whereConditions.Category = category;
    }

    if (search) {
      whereConditions[Op.or] = [
        { Title: { [Op.like]: `%${search}%` } },
        { Excerpt: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: posts } = await BlogPost.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['UserID', 'Name']
        }
      ],
      order: [[sortBy, 'DESC']],
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
    console.error('Error getting published posts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách bài viết'
    });
  }
};

// Get blog categories
export const getBlogCategories = async (req, res) => {
  try {
    const categories = await BlogPost.findAll({
      attributes: ['Category'],
      where: { Status: 'published' },
      group: ['Category'],
      raw: true
    });

    const categoryList = categories.map(cat => cat.Category).filter(Boolean);

    res.json({
      success: true,
      data: categoryList
    });

  } catch (error) {
    console.error('Error getting blog categories:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh mục bài viết'
    });
  }
};

// Like/Unlike a blog post
export const toggleBlogPostLike = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await BlogPost.findByPk(id);

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
    console.error('Error toggling blog post like:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi thích bài viết'
    });
  }
};

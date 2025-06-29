import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const BlogPost = sequelize.define('BlogPost', {
  PostID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  AuthorID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'UserID'
    },
    onDelete: 'CASCADE'
  },
  Title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  Content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  Excerpt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  FeaturedImage: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  Category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'general'
  },
  Tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('Tags');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('Tags', JSON.stringify(value || []));
    }
  },
  Status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    allowNull: false,
    defaultValue: 'draft'
  },
  ViewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  LikeCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  CommentCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  PublishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  MetaTitle: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  MetaDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  SlugUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  }
}, {
  tableName: 'blog_posts',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  indexes: [
    {
      name: 'idx_blog_posts_author',
      fields: ['AuthorID']
    },
    {
      name: 'idx_blog_posts_status',
      fields: ['Status']
    },
    {
      name: 'idx_blog_posts_category',
      fields: ['Category']
    },
    {
      name: 'idx_blog_posts_published',
      fields: ['PublishedAt']
    },
    {
      name: 'idx_blog_posts_slug',
      fields: ['SlugUrl']
    }
  ]
});

// Associations
BlogPost.belongsTo(User, {
  foreignKey: 'AuthorID',
  as: 'author'
});

User.hasMany(BlogPost, {
  foreignKey: 'AuthorID',
  as: 'blogPosts'
});

export default BlogPost;

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const CommunityPost = sequelize.define('CommunityPost', {
  PostID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  UserID: {
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
  Type: {
    type: DataTypes.ENUM('question', 'story', 'support', 'achievement', 'tips'),
    allowNull: false,
    defaultValue: 'story'
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
  Images: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('Images');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('Images', JSON.stringify(value || []));
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
  ViewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  Status: {
    type: DataTypes.ENUM('active', 'hidden', 'flagged', 'deleted'),
    allowNull: false,
    defaultValue: 'active'
  },
  IsPinned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  IsFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'community_posts',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  indexes: [
    {
      name: 'idx_community_posts_user',
      fields: ['UserID']
    },
    {
      name: 'idx_community_posts_type',
      fields: ['Type']
    },
    {
      name: 'idx_community_posts_status',
      fields: ['Status']
    },
    {
      name: 'idx_community_posts_pinned',
      fields: ['IsPinned']
    },
    {
      name: 'idx_community_posts_featured',
      fields: ['IsFeatured']
    },
    {
      name: 'idx_community_posts_created',
      fields: ['CreatedAt']
    }
  ]
});

// Associations
CommunityPost.belongsTo(User, {
  foreignKey: 'UserID',
  as: 'user'
});

User.hasMany(CommunityPost, {
  foreignKey: 'UserID',
  as: 'communityPosts'
});

export default CommunityPost;

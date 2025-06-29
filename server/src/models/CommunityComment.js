import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import CommunityPost from './CommunityPost.js';

const CommunityComment = sequelize.define('CommunityComment', {
  CommentID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  PostID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CommunityPost,
      key: 'PostID'
    },
    onDelete: 'CASCADE'
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
  ParentCommentID: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'community_comments',
      key: 'CommentID'
    },
    onDelete: 'CASCADE'
  },
  Content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
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
  Status: {
    type: DataTypes.ENUM('active', 'hidden', 'flagged', 'deleted'),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  tableName: 'community_comments',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  indexes: [
    {
      name: 'idx_community_comments_post',
      fields: ['PostID']
    },
    {
      name: 'idx_community_comments_user',
      fields: ['UserID']
    },
    {
      name: 'idx_community_comments_parent',
      fields: ['ParentCommentID']
    },
    {
      name: 'idx_community_comments_status',
      fields: ['Status']
    }
  ]
});

// Associations
CommunityComment.belongsTo(User, {
  foreignKey: 'UserID',
  as: 'user'
});

CommunityComment.belongsTo(CommunityPost, {
  foreignKey: 'PostID',
  as: 'post'
});

CommunityComment.belongsTo(CommunityComment, {
  foreignKey: 'ParentCommentID',
  as: 'parentComment'
});

CommunityComment.hasMany(CommunityComment, {
  foreignKey: 'ParentCommentID',
  as: 'replies'
});

CommunityPost.hasMany(CommunityComment, {
  foreignKey: 'PostID',
  as: 'comments'
});

User.hasMany(CommunityComment, {
  foreignKey: 'UserID',
  as: 'communityComments'
});

export default CommunityComment;

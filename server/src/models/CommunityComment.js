import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CommunityComment = sequelize.define('CommunityComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  community_post_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  parent_comment_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'community_comment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default CommunityComment;

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BlogLike = sequelize.define('BlogLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  blog_post_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'blog_like',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'blog_post_id']
    }
  ]
});

export default BlogLike;

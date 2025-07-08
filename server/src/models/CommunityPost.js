import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CommunityPost = sequelize.define('community_post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  author_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'user',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'community_posts',
  timestamps: false
});

export default CommunityPost;

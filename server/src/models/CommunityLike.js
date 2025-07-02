import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CommunityLike = sequelize.define('CommunityLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  community_post_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'community_like',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'community_post_id']
    }
  ]
});

export default CommunityLike;

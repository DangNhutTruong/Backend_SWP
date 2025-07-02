import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Share = sequelize.define('share', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  smoker_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'user',
      key: 'id'
    }
  },
  achievement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'achievement',
      key: 'id'
    }
  },
  community_post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'community_post',
      key: 'id'
    }
  },
  shared_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'share',
  timestamps: false
});

export default Share;

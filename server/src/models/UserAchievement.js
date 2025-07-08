import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserAchievement = sequelize.define('user_achievement', {
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
  achieved_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_achievements',
  timestamps: false
});

export default UserAchievement;

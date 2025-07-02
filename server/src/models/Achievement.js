import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Achievement = sequelize.define('Achievement', {
  AchievementID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  Criteria: {
    type: DataTypes.TEXT('long'),
    allowNull: false
  },
  CreatedByUserID: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'Achievement',
  timestamps: false
});

export default Achievement;

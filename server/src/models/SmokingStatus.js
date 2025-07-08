import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SmokingStatus = sequelize.define('smoking_status', {
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
  status: {
    type: DataTypes.ENUM('smoking', 'quit', 'relapse', 'reducing'),
    allowNull: false
  },
  cigarettes_per_day: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  recorded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'smoking_status',
  timestamps: false
});

export default SmokingStatus;

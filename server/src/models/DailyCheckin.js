import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DailyCheckin = sequelize.define('DailyCheckin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  checkin_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  target_cigarettes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  actual_cigarettes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  mood_score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  stress_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  craving_intensity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  money_saved: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_successful: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'daily_checkins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'checkin_date']
    }
  ]
});

export default DailyCheckin;

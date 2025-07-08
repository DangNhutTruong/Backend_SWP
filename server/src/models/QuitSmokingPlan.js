import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuitSmokingPlan = sequelize.define('QuitSmokingPlan', {
  PlanID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  Reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  StartDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ExpectedQuitDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Milestones: {
    type: DataTypes.JSON,
    allowNull: true
  },
  Status: {
    type: DataTypes.ENUM('active', 'paused', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'active'
  },
  Progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  CompletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'quit_smoking_plans',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

export default QuitSmokingPlan;

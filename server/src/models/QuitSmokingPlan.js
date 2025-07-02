import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuitSmokingPlan = sequelize.define('QuitSmokingPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  smoker_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  plan_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  plan_details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ongoing', 'completed', 'failed'),
    defaultValue: 'ongoing'
  }
}, {
  tableName: 'quit_smoking_plan',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default QuitSmokingPlan;

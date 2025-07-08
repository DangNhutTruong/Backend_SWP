import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Progress = sequelize.define('Progress', {
  ProgressID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  CigarettesSmoked: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  MoodRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  CravingLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  Notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Triggers: {
    type: DataTypes.JSON,
    allowNull: true
  },
  HealthImprovements: {
    type: DataTypes.JSON,
    allowNull: true
  },
  MoneySaved: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  TimeWithoutSmoking: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  IsSuccessfulDay: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'progress',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

export default Progress;

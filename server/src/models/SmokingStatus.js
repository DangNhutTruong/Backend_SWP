import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SmokingStatus = sequelize.define('SmokingStatus', {
  StatusID: {
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
  CravingLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  MoodRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  StressLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  Triggers: {
    type: DataTypes.JSON,
    allowNull: true
  },
  Notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  QuitDay: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'SmokingStatus',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  indexes: [
    {
      unique: true,
      fields: ['UserID', 'Date']
    }
  ]
});

export default SmokingStatus;

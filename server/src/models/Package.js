import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Package = sequelize.define('Package', {
  PackageID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ShortDescription: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  Price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  OriginalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  Currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'VND'
  },
  Duration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  DurationType: {
    type: DataTypes.ENUM('days', 'weeks', 'months', 'years'),
    allowNull: false,
    defaultValue: 'days'
  },
  Features: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Type: {
    type: DataTypes.ENUM('basic', 'premium', 'pro', 'enterprise'),
    allowNull: false
  },
  Category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  Status: {
    type: DataTypes.ENUM('active', 'inactive', 'archived'),
    allowNull: false,
    defaultValue: 'active'
  },
  IsPopular: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  IsFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  MaxUsers: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  MaxCoachSessions: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  MaxSupportTickets: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  AccessLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  TrialDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  SortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  MetaData: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'packages',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

export default Package;
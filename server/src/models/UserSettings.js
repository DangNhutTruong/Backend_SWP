import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserSettings = sequelize.define('UserSettings', {
  SettingID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  Language: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'vi'
  },
  Theme: {
    type: DataTypes.ENUM('light', 'dark', 'auto'),
    allowNull: false,
    defaultValue: 'light'
  },
  Currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'VND'
  },
  TimeZone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Asia/Ho_Chi_Minh'
  },
  DateFormat: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'DD/MM/YYYY'
  },
  PrivacyProfile: {
    type: DataTypes.ENUM('public', 'friends', 'private'),
    allowNull: false,
    defaultValue: 'friends'
  },
  PrivacyProgress: {
    type: DataTypes.ENUM('public', 'friends', 'private'),
    allowNull: false,
    defaultValue: 'friends'
  },
  PrivacyAchievements: {
    type: DataTypes.ENUM('public', 'friends', 'private'),
    allowNull: false,
    defaultValue: 'public'
  },
  DataRetention: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 365 // days
  },
  TwoFactorAuth: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'UserSettings',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

export default UserSettings;

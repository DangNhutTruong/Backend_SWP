import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NotificationSettings = sequelize.define('NotificationSettings', {
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
  EmailNotifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  PushNotifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  ProgressReminders: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  AppointmentReminders: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  AchievementNotifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  CommunityNotifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  MarketingEmails: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'NotificationSettings',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

export default NotificationSettings;

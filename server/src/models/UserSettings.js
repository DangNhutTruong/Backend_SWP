import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserSettings = sequelize.define('UserSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  email_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  push_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sms_notifications: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  privacy_level: {
    type: DataTypes.ENUM('public', 'friends', 'private'),
    defaultValue: 'public'
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'vi'
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Asia/Ho_Chi_Minh'
  },
  theme: {
    type: DataTypes.ENUM('light', 'dark', 'auto'),
    defaultValue: 'light'
  }
}, {
  tableName: 'user_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default UserSettings;

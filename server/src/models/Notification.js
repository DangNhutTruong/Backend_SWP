import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  NotificationID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  Message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Type: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'error', 'achievement', 'reminder', 'appointment'),
    allowNull: false,
    defaultValue: 'info'
  },
  IsRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  ActionUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  Data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ReadAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Notifications',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

export default Notification;

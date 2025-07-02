import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  duration_months: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'package',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Package;
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Achievement = sequelize.define('Achievement', {
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
  icon_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'achievement',
  timestamps: false
});

export default Achievement;

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DailyCheckin = sequelize.define('DailyCheckin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  checkin_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  target_cigarettes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  actual_cigarettes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  mood_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  craving_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  achievements: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  challenges: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_success_day: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  money_saved: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  }
}, {
  tableName: 'daily_checkins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'checkin_date']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['checkin_date']
    }
  ]
});

// Define associations
DailyCheckin.associate = (models) => {
  DailyCheckin.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

export default DailyCheckin;

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
    },
    onDelete: 'CASCADE'
  },
  checkin_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  mood_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Mood rating from 1-5 (1: Very Bad, 2: Bad, 3: Neutral, 4: Good, 5: Excellent)'
  },
  craving_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Craving level from 1-5 (1: No craving, 2: Mild, 3: Moderate, 4: Strong, 5: Very Strong)'
  },
  cigarettes_avoided: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Number of cigarettes user avoided smoking today'
  },
  money_saved: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    comment: 'Money saved today by not smoking (in VND)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Personal notes about the day, challenges, victories, etc.'
  },
  activities_done: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'List of alternative activities done instead of smoking'
  },
  triggers_faced: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'List of smoking triggers encountered today'
  },
  coping_strategies_used: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'List of coping strategies used to avoid smoking'
  },
  is_smoke_free: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'True if user stayed smoke-free today'
  },
  streak_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Current consecutive smoke-free days streak'
  },
  health_improvements: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Health improvements noticed today (breathing, taste, smell, etc.)'
  },
  motivation_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Motivation level to continue quitting (1-5)'
  },
  checkin_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Time when user checked in'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'daily_checkins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'checkin_date'],
      name: 'unique_user_daily_checkin'
    },
    {
      fields: ['user_id', 'checkin_date'],
      name: 'idx_user_date'
    },
    {
      fields: ['is_smoke_free'],
      name: 'idx_smoke_free'
    },
    {
      fields: ['streak_count'],
      name: 'idx_streak_count'
    }
  ]
});

// Define associations
DailyCheckin.associate = function(models) {
  // DailyCheckin belongs to User
  DailyCheckin.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE'
  });
};

export default DailyCheckin;

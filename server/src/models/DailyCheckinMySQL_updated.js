import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

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
      model: User,
      key: 'UserID'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  smoking_status: {
    type: DataTypes.ENUM('smoke-free', 'reduced', 'relapsed'),
    allowNull: false
  },
  cigarettes_smoked: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  mood: {
    type: DataTypes.ENUM('great', 'good', 'neutral', 'bad', 'awful'),
    allowNull: false
  },
  craving_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  },
  withdrawal_symptoms: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  alternative_activities: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  self_rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  tomorrow_goal: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  stress_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  stress_factors: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  achievements: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
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
      fields: ['user_id', 'date'],
      name: 'idx_user_date'
    }
  ]
});

// Define associations
DailyCheckin.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'UserID',
  as: 'user'
});

User.hasMany(DailyCheckin, {
  foreignKey: 'user_id',
  sourceKey: 'UserID',
  as: 'checkins'
});

// Instance methods
DailyCheckin.prototype.calculateStreak = async function() {
  const checkins = await DailyCheckin.findAll({
    where: {
      user_id: this.user_id,
      smoking_status: 'smoke-free'
    },
    order: [['date', 'DESC']],
    limit: 365
  });
  
  let streak = 0;
  const today = new Date();
  
  for (const checkin of checkins) {
    const checkinDate = new Date(checkin.date);
    const daysDiff = Math.floor((today - checkinDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

// Static methods
DailyCheckin.findByUserAndDate = async function(userId, date) {
  return await this.findOne({
    where: {
      user_id: userId,
      date: date
    }
  });
};

DailyCheckin.findByUserAndDateRange = async function(userId, startDate, endDate) {
  return await this.findAll({
    where: {
      user_id: userId,
      date: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    },
    order: [['date', 'ASC']]
  });
};

DailyCheckin.getUserStreak = async function(userId) {
  const latestCheckin = await this.findOne({
    where: { user_id: userId },
    order: [['date', 'DESC']]
  });
  
  if (!latestCheckin) return 0;
  
  return await latestCheckin.calculateStreak();
};

export default DailyCheckin;

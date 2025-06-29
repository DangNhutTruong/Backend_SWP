import { DataTypes, Op } from 'sequelize';
import sequelize from '../config/database.js';

const Progress = sequelize.define('Progress', {
  ProgressID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User',
      key: 'UserID'
    }
  },
  Date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  CigarettesSmoked: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  MoodRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  CravingLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  },
  Notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Triggers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: '[]'
  },
  HealthImprovements: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: '[]'
  },
  MoneySaved: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  TimeWithoutSmoking: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Minutes without smoking'
  },
  IsSuccessfulDay: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  UpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Progress',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  indexes: [
    {
      unique: true,
      fields: ['UserID', 'Date']
    }
  ]
});

// Instance methods
Progress.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Parse JSON fields nếu là string
  if (typeof values.Triggers === 'string') {
    try {
      values.Triggers = JSON.parse(values.Triggers);
    } catch (e) {
      values.Triggers = [];
    }
  }
  
  if (typeof values.HealthImprovements === 'string') {
    try {
      values.HealthImprovements = JSON.parse(values.HealthImprovements);
    } catch (e) {
      values.HealthImprovements = [];
    }
  }
  
  return values;
};

// Static methods
Progress.findByUserAndDateRange = async function(userId, startDate, endDate) {
  return await this.findAll({
    where: {
      UserID: userId,
      Date: {
        [Op.between]: [startDate, endDate]
      }
    },
    order: [['Date', 'ASC']]
  });
};

Progress.getStreakInfo = async function(userId) {
  const progressEntries = await this.findAll({
    where: { UserID: userId },
    order: [['Date', 'DESC']],
    attributes: ['Date', 'IsSuccessfulDay']
  });
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Tính current streak
  for (let entry of progressEntries) {
    if (entry.IsSuccessfulDay) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Tính longest streak
  for (let entry of progressEntries.reverse()) {
    if (entry.IsSuccessfulDay) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  return { currentStreak, longestStreak };
};

Progress.getWeeklyStats = async function(userId, weeks = 4) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (weeks * 7));
  
  return await this.findAll({
    where: {
      UserID: userId,
      Date: {
        [Op.between]: [startDate, endDate]
      }
    },
    order: [['Date', 'ASC']]
  });
};

export default Progress;

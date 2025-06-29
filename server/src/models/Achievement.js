import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Achievement = sequelize.define('Achievement', {
  AchievementID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  Icon: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  Type: {
    type: DataTypes.ENUM('milestone', 'streak', 'challenge', 'special'),
    allowNull: false,
    defaultValue: 'milestone'
  },
  Category: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Condition: {
    type: DataTypes.JSON,
    allowNull: false
  },
  Points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  IsActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  tableName: 'Achievement',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

const UserAchievement = sequelize.define('UserAchievement', {
  UserAchievementID: {
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
  AchievementID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Achievement',
      key: 'AchievementID'
    }
  },
  UnlockedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  IsShared: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  SharedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  CreatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'UserAchievement',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['UserID', 'AchievementID']
    }
  ]
});

// Instance methods
Achievement.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  if (typeof values.Condition === 'string') {
    try {
      values.Condition = JSON.parse(values.Condition);
    } catch (e) {
      values.Condition = {};
    }
  }
  
  return values;
};

// Static methods
Achievement.findByCategory = async function(category) {
  return await this.findAll({
    where: { 
      Category: category,
      IsActive: true 
    },
    order: [['Points', 'ASC']]
  });
};

Achievement.findOrCreateAchievement = async function(achievementData) {
  const [achievement, created] = await this.findOrCreate({
    where: { Name: achievementData.Name },
    defaults: achievementData
  });
  
  return { achievement, isNew: created };
};

UserAchievement.grantAchievement = async function(userId, achievementId) {
  const [userAchievement, created] = await this.findOrCreate({
    where: {
      UserID: userId,
      AchievementID: achievementId
    },
    defaults: {
      UserID: userId,
      AchievementID: achievementId,
      UnlockedAt: new Date()
    }
  });
  
  return { userAchievement, isNew: created };
};

// Define associations
Achievement.hasMany(UserAchievement, { foreignKey: 'AchievementID' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'AchievementID' });

export { Achievement, UserAchievement };
export default Achievement;

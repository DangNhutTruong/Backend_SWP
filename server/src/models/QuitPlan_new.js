import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QuitPlan = sequelize.define('QuitPlan', {
  PlanID: {
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
  Title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  Reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  StartDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  ExpectedQuitDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  Milestones: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: '[]'
  },
  Status: {
    type: DataTypes.ENUM('active', 'paused', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'active'
  },
  Progress: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  CompletedAt: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'QuitPlan',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

// Instance methods
QuitPlan.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Parse milestones nếu là string
  if (typeof values.Milestones === 'string') {
    try {
      values.Milestones = JSON.parse(values.Milestones);
    } catch (e) {
      values.Milestones = [];
    }
  }
  
  return values;
};

QuitPlan.prototype.calculateProgress = function() {
  let milestones = [];
  
  if (typeof this.Milestones === 'string') {
    try {
      milestones = JSON.parse(this.Milestones);
    } catch (e) {
      milestones = [];
    }
  } else if (Array.isArray(this.Milestones)) {
    milestones = this.Milestones;
  }
  
  if (milestones.length === 0) return 0;
  
  const completedCount = milestones.filter(m => m.completed).length;
  return Math.round((completedCount / milestones.length) * 100);
};

// Static methods
QuitPlan.findByUserId = async function(userId, options = {}) {
  return await this.findAll({
    where: { UserID: userId },
    ...options
  });
};

QuitPlan.findActiveByUserId = async function(userId) {
  return await this.findAll({
    where: { 
      UserID: userId,
      Status: 'active'
    },
    order: [['CreatedAt', 'DESC']]
  });
};

export default QuitPlan;

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const MembershipPlan = sequelize.define('MembershipPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in days'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  features: {
    type: DataTypes.JSON,
    allowNull: false
  },
  is_recommended: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  tableName: 'membership_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['type'],
      name: 'idx_type'
    }
  ]
});

// Instance methods
MembershipPlan.prototype.isFree = function() {
  return this.price === 0 || this.type === 'free';
};

MembershipPlan.prototype.getMonthlyPrice = function() {
  if (this.duration === 0) return 0;
  return Math.round((this.price / this.duration * 30) * 100) / 100;
};

// Static methods
MembershipPlan.findByType = async function(type) {
  return await this.findOne({ 
    where: { 
      type: type,
      is_active: true
    } 
  });
};

MembershipPlan.findActivePlans = async function(options = {}) {
  return await this.findAll({
    where: { is_active: true },
    order: [['price', 'ASC']],
    ...options
  });
};

MembershipPlan.findRecommended = async function() {
  return await this.findOne({
    where: {
      is_recommended: true,
      is_active: true
    }
  });
};

export default MembershipPlan;

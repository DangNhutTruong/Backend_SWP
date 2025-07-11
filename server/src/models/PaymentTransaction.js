const { DataTypes } = require('sequelize');
const sequelize = require('../config/database-mysql');

const PaymentTransaction = sequelize.define('PaymentTransaction', {
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
  subscription_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'user_subscriptions',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'VND'
  },
  payment_method: {
    type: DataTypes.ENUM('zalopay', 'paypal', 'vnpay', 'momo', 'bank_transfer'),
    allowNull: false
  },
  payment_gateway_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled'),
    defaultValue: 'pending'
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  gateway_response: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'payment_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PaymentTransaction;

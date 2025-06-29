import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Package from './Package.js';

const Payment = sequelize.define('Payment', {
  PaymentID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  UserID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'UserID'
    },
    onDelete: 'CASCADE'
  },
  PackageID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Package,
      key: 'PackageID'
    },
    onDelete: 'RESTRICT'
  },
  Amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  Currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'VND'
  },
  Status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  PaymentMethod: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'cash', 'crypto'),
    allowNull: false,
    defaultValue: 'credit_card'
  },
  PaymentGateway: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Payment gateway used (VNPay, Stripe, PayPal, etc.)'
  },
  TransactionID: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    comment: 'External transaction ID from payment gateway'
  },
  GatewayResponse: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('GatewayResponse');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('GatewayResponse', JSON.stringify(value || {}));
    }
  },
  OrderCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Internal order reference code'
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  PaidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Payment link expiration time'
  },
  RefundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  RefundReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  RefundedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  FailureReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  RetryCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  MetaData: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('MetaData');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('MetaData', JSON.stringify(value || {}));
    }
  }
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  indexes: [
    {
      name: 'idx_payments_user',
      fields: ['UserID']
    },
    {
      name: 'idx_payments_package',
      fields: ['PackageID']
    },
    {
      name: 'idx_payments_status',
      fields: ['Status']
    },
    {
      name: 'idx_payments_method',
      fields: ['PaymentMethod']
    },
    {
      name: 'idx_payments_gateway',
      fields: ['PaymentGateway']
    },
    {
      name: 'idx_payments_transaction',
      fields: ['TransactionID']
    },
    {
      name: 'idx_payments_order',
      fields: ['OrderCode']
    },
    {
      name: 'idx_payments_created',
      fields: ['CreatedAt']
    }
  ]
});

// Associations
Payment.belongsTo(User, {
  foreignKey: 'UserID',
  as: 'user'
});

Payment.belongsTo(Package, {
  foreignKey: 'PackageID',
  as: 'package'
});

User.hasMany(Payment, {
  foreignKey: 'UserID',
  as: 'payments'
});

Package.hasMany(Payment, {
  foreignKey: 'PackageID',
  as: 'payments'
});

export default Payment;

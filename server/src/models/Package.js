import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Package = sequelize.define('Package', {
  PackageID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  Name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ShortDescription: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  Price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  OriginalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  Currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'VND'
  },
  Duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in days'
  },
  DurationType: {
    type: DataTypes.ENUM('days', 'weeks', 'months', 'years'),
    allowNull: false,
    defaultValue: 'days'
  },
  Features: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('Features');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('Features', JSON.stringify(value || []));
    }
  },
  Type: {
    type: DataTypes.ENUM('basic', 'premium', 'pro', 'enterprise'),
    allowNull: false,
    defaultValue: 'basic'
  },
  Category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'coaching'
  },
  Status: {
    type: DataTypes.ENUM('active', 'inactive', 'archived'),
    allowNull: false,
    defaultValue: 'active'
  },
  IsPopular: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  IsFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  MaxUsers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Max number of users for this package'
  },
  MaxCoachSessions: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Max coaching sessions included'
  },
  MaxSupportTickets: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Max support tickets per month'
  },
  AccessLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Access level (1=basic, 2=advanced, 3=premium)'
  },
  TrialDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Free trial days'
  },
  SortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
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
  tableName: 'packages',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  indexes: [
    {
      name: 'idx_packages_type',
      fields: ['Type']
    },
    {
      name: 'idx_packages_category',
      fields: ['Category']
    },
    {
      name: 'idx_packages_status',
      fields: ['Status']
    },
    {
      name: 'idx_packages_popular',
      fields: ['IsPopular']
    },
    {
      name: 'idx_packages_featured',
      fields: ['IsFeatured']
    },
    {
      name: 'idx_packages_price',
      fields: ['Price']
    },
    {
      name: 'idx_packages_sort',
      fields: ['SortOrder']
    }
  ]
});

export default Package;

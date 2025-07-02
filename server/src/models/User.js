import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  UserID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  Name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  Email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  Password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  Age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  Gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: true
  },
  Phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  Address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  RoleID: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  RoleName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  Membership: {
    type: DataTypes.ENUM('free', 'basic', 'premium', 'pro'),
    allowNull: false,
    defaultValue: 'free'
  },
  StartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  DaysWithoutSmoking: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  CigarettesPerDay: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  CostPerPack: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  CigarettesPerPack: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  MoneySaved: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  LastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  LoginCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  IsActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  EmailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  EmailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  PasswordResetToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  PasswordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt'
});

export default User;

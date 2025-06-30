import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

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
    unique: true,
    validate: {
      isEmail: true
    }
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
    allowNull: false,
    defaultValue: 3 // Smoker role by default
  },
  RoleName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Smoker'
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
    allowNull: true,
    defaultValue: 20
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
  tableName: 'User',
  timestamps: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  hooks: {
    beforeCreate: async (user) => {
      if (user.Password) {
        const salt = await bcrypt.genSalt(12);
        user.Password = await bcrypt.hash(user.Password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('Password')) {
        const salt = await bcrypt.genSalt(12);
        user.Password = await bcrypt.hash(user.Password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.Password);
};

User.prototype.updateLoginInfo = async function() {
  this.LastLogin = new Date();
  this.LoginCount = (this.LoginCount || 0) + 1;
  await this.save();
};

User.prototype.calculateMoneySaved = function() {
  if (!this.StartDate || !this.CostPerPack || !this.CigarettesPerPack || !this.CigarettesPerDay) {
    return 0;
  }
  
  const daysSinceStart = Math.floor((new Date() - new Date(this.StartDate)) / (1000 * 60 * 60 * 24));
  const packsNotSmoked = (this.CigarettesPerDay * daysSinceStart) / this.CigarettesPerPack;
  return Math.round(packsNotSmoked * this.CostPerPack * 100) / 100;
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.Password;
  delete values.PasswordResetToken;
  delete values.EmailVerificationToken;
  
  // Calculate money saved
  values.MoneySaved = this.calculateMoneySaved();
  
  return values;
};

// Static methods
User.findByEmail = async function(email) {
  return await this.findOne({ where: { Email: email.toLowerCase() } });
};

User.findActiveUsers = async function(options = {}) {
  return await this.findAll({
    where: { IsActive: true },
    ...options
  });
};

export default User;

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const Coach = sequelize.define('Coach', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  specialization: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profile_image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  availability: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  review_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'on_leave'),
    allowNull: false,
    defaultValue: 'active'
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
  tableName: 'coaches',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (coach) => {
      if (coach.password) {
        const salt = await bcrypt.genSalt(12);
        coach.password = await bcrypt.hash(coach.password, salt);
      }
    },
    beforeUpdate: async (coach) => {
      if (coach.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        coach.password = await bcrypt.hash(coach.password, salt);
      }
    }
  }
});

// Instance methods
Coach.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

Coach.prototype.updateRating = async function(newRating) {
  const totalRating = this.rating * this.review_count + newRating;
  this.review_count += 1;
  this.rating = totalRating / this.review_count;
  await this.save();
};

Coach.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// Static methods
Coach.findByEmail = async function(email) {
  return await this.findOne({ where: { email: email.toLowerCase() } });
};

Coach.findActiveCoaches = async function(options = {}) {
  return await this.findAll({
    where: { status: 'active' },
    order: [['rating', 'DESC']],
    ...options
  });
};

Coach.findBySpecialization = async function(specialization, options = {}) {
  return await this.findAll({
    where: {
      specialization: {
        [sequelize.Op.like]: `%${specialization}%`
      },
      status: 'active'
    },
    order: [['rating', 'DESC']],
    ...options
  });
};

export default Coach;

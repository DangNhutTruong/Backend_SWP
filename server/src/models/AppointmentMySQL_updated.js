import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'UserID'
    }
  },
  coach_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  coach_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  appointment_type: {
    type: DataTypes.ENUM('consultation', 'follow_up', 'emergency'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
    allowNull: false,
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  meeting_link: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30
  },
  feedback: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
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
  tableName: 'appointments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['date'],
      name: 'idx_date'
    },
    {
      fields: ['status'],
      name: 'idx_status'
    }
  ]
});

// Define associations
Appointment.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'UserID',
  as: 'user'
});

User.hasMany(Appointment, {
  foreignKey: 'user_id',
  sourceKey: 'UserID',
  as: 'appointments'
});

// Instance methods
Appointment.prototype.canCancel = function() {
  const now = new Date();
  const appointmentTime = new Date(this.date);
  const hoursDifference = (appointmentTime - now) / (1000 * 60 * 60);
  
  return this.status === 'pending' || this.status === 'confirmed' && hoursDifference > 24;
};

Appointment.prototype.canReschedule = function() {
  const now = new Date();
  const appointmentTime = new Date(this.date);
  const hoursDifference = (appointmentTime - now) / (1000 * 60 * 60);
  
  return (this.status === 'pending' || this.status === 'confirmed') && hoursDifference > 12;
};

// Static methods
Appointment.findUpcoming = async function(userId, options = {}) {
  const now = new Date();
  return await this.findAll({
    where: {
      user_id: userId,
      date: {
        [sequelize.Op.gte]: now
      },
      status: {
        [sequelize.Op.in]: ['pending', 'confirmed']
      }
    },
    order: [['date', 'ASC']],
    ...options
  });
};

Appointment.findByDateRange = async function(userId, startDate, endDate, options = {}) {
  return await this.findAll({
    where: {
      user_id: userId,
      date: {
        [sequelize.Op.between]: [startDate, endDate]
      }
    },
    order: [['date', 'ASC']],
    ...options
  });
};

Appointment.findByStatus = async function(userId, status, options = {}) {
  return await this.findAll({
    where: {
      user_id: userId,
      status: status
    },
    order: [['date', 'DESC']],
    ...options
  });
};

export default Appointment;

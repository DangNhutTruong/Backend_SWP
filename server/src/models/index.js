import sequelize from '../config/database.js';
import User from './User.js';
import DailyCheckin from './DailyCheckin.js';

// Set up model associations
const models = {
  User,
  DailyCheckin
};

// Initialize associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Add reverse association for User -> DailyCheckin
User.hasMany(DailyCheckin, {
  foreignKey: 'user_id',
  as: 'dailyCheckins',
  onDelete: 'CASCADE'
});

export {
  sequelize,
  User,
  DailyCheckin
};

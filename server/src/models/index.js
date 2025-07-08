import sequelize from '../config/database.js';
import User from './User.js';
import DailyCheckin from './DailyCheckin.js';

// Define all models
const models = {
  User,
  DailyCheckin
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export {
  sequelize,
  User,
  DailyCheckin
};

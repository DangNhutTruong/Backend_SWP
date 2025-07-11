import sequelize from '../config/database.js';
import User from './User.js';
import DailyCheckin from './DailyCheckin.js';
import QuitSmokingPlan from './QuitSmokingPlan.js';
import Progress from './Progress.js';

// Set up model associations
const models = {
  User,
  DailyCheckin,
  QuitSmokingPlan,
  Progress
};

// Initialize associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Set up associations between models
User.hasMany(DailyCheckin, {
  foreignKey: 'user_id',
  as: 'dailyCheckins',
  onDelete: 'CASCADE'
});

User.hasMany(QuitSmokingPlan, {
  foreignKey: 'smoker_id',
  as: 'quitPlans',
  onDelete: 'CASCADE'
});

QuitSmokingPlan.hasMany(Progress, {
  foreignKey: 'plan_id',
  as: 'progressRecords',
  onDelete: 'CASCADE'
});

Progress.belongsTo(QuitSmokingPlan, {
  foreignKey: 'plan_id',
  as: 'plan'
});

export {
  sequelize,
  User,
  DailyCheckin,
  QuitSmokingPlan,
  Progress
};

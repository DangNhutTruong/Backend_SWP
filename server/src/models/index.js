import sequelize from '../config/database.js';
import User from './User.js';

// For now, just export User and sequelize to avoid relationship conflicts
// Will add other models and relationships later when needed

export {
  sequelize,
  User
};

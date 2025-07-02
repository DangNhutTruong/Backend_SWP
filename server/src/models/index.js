import sequelize from '../config/database.js';
import User from './User.js';
import Package from './Package.js';
import Register from './Register.js';
import Appointment from './Appointment.js';
import Feedback from './Feedback.js';
import BlogPost from './BlogPost.js';
import Achievement from './Achievement.js';
import UserAchievement from './UserAchievement.js';
import QuitSmokingPlan from './QuitSmokingPlan.js';
import SmokingStatus from './SmokingStatus.js';
import Progress from './Progress.js';
import CommunityPost from './CommunityPost.js';
import Share from './Share.js';

// Define relationships
// User relationships
User.hasMany(Register, { foreignKey: 'user_id', as: 'registers' });
Register.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Appointment, { foreignKey: 'coach_id', as: 'coachAppointments' });
User.hasMany(Appointment, { foreignKey: 'smoker_id', as: 'smokerAppointments' });
Appointment.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });
Appointment.belongsTo(User, { foreignKey: 'smoker_id', as: 'smoker' });

User.hasMany(Feedback, { foreignKey: 'coach_id', as: 'coachFeedbacks' });
User.hasMany(Feedback, { foreignKey: 'smoker_id', as: 'smokerFeedbacks' });
Feedback.belongsTo(User, { foreignKey: 'coach_id', as: 'coach' });
Feedback.belongsTo(User, { foreignKey: 'smoker_id', as: 'smoker' });

User.hasMany(BlogPost, { foreignKey: 'author_id', as: 'blogPosts' });
BlogPost.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

User.hasMany(UserAchievement, { foreignKey: 'smoker_id', as: 'achievements' });
UserAchievement.belongsTo(User, { foreignKey: 'smoker_id', as: 'smoker' });

User.hasMany(QuitSmokingPlan, { foreignKey: 'smoker_id', as: 'plans' });
QuitSmokingPlan.belongsTo(User, { foreignKey: 'smoker_id', as: 'smoker' });

User.hasMany(SmokingStatus, { foreignKey: 'smoker_id', as: 'smokingStatuses' });
SmokingStatus.belongsTo(User, { foreignKey: 'smoker_id', as: 'smoker' });

User.hasMany(CommunityPost, { foreignKey: 'author_id', as: 'communityPosts' });
CommunityPost.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

User.hasMany(Share, { foreignKey: 'smoker_id', as: 'shares' });
Share.belongsTo(User, { foreignKey: 'smoker_id', as: 'smoker' });

// Package relationships
Package.hasMany(Register, { foreignKey: 'package_id', as: 'registers' });
Register.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

// Achievement relationships
Achievement.hasMany(UserAchievement, { foreignKey: 'achievement_id', as: 'userAchievements' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievement_id', as: 'achievement' });

Achievement.hasMany(Share, { foreignKey: 'achievement_id', as: 'shares' });
Share.belongsTo(Achievement, { foreignKey: 'achievement_id', as: 'achievement' });

// QuitSmokingPlan relationships
QuitSmokingPlan.hasMany(Progress, { foreignKey: 'plan_id', as: 'progressRecords' });
Progress.belongsTo(QuitSmokingPlan, { foreignKey: 'plan_id', as: 'plan' });

// CommunityPost relationships
CommunityPost.hasMany(Share, { foreignKey: 'community_post_id', as: 'shares' });
Share.belongsTo(CommunityPost, { foreignKey: 'community_post_id', as: 'communityPost' });

export {
  sequelize,
  User,
  Package,
  Register,
  Appointment,
  Feedback,
  BlogPost,
  Achievement,
  UserAchievement,
  QuitSmokingPlan,
  SmokingStatus,
  Progress,
  CommunityPost,
  Share
};

export default {
  sequelize,
  User,
  Package,
  Register,
  Appointment,
  Feedback,
  BlogPost,
  Achievement,
  UserAchievement,
  QuitSmokingPlan,
  SmokingStatus,
  Progress,
  CommunityPost,
  Share
};

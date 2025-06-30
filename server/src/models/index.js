import User from './UserReal.js';
import PackageReal from './PackageReal.js';

// Export all models
export {
  User,
  PackageReal as Package
};

// Export default object with all models
export default {
  User,
  Package: PackageReal
};

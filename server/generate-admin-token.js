import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'nosmoke_super_secret_key_2024_very_long_and_secure';

// Create admin token
const adminToken = jwt.sign(
  {
    userId: 12,  // Real admin user ID
    email: 'huylqse182082@fpt.edu.vn',
    role: 'admin',
    isAdmin: true
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('🔐 Admin Token Generated:');
console.log(adminToken);
console.log('');
console.log('📋 Copy this token to localStorage:');
console.log(`localStorage.setItem('nosmoke_token', '${adminToken}');`);
console.log('');
console.log('🧪 Test command:');
console.log(`curl -H "Authorization: Bearer ${adminToken}" http://localhost:5000/api/admin/blog/posts`);

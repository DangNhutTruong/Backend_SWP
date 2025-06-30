import sequelize from './config/database.js';
import { User, DailyCheckin, Appointment, Coach, MembershipPlan } from './models/index.js';

const syncDatabase = async () => {
  try {
    console.log('🔄 Đang đồng bộ database models...');
    
    // Sync all models (tạo bảng nếu chưa có)
    await sequelize.sync({ 
      force: false, // set true để drop và recreate tables
      alter: true   // cập nhật cấu trúc bảng nếu có thay đổi
    });
    
    console.log('✅ Database models đã được đồng bộ thành công!');
    
    // Tạo dữ liệu mẫu cho membership plans nếu chưa có
    await createSampleData();
    
  } catch (error) {
    console.error('❌ Lỗi khi đồng bộ database models:', error);
  }
};

const createSampleData = async () => {
  try {
    // Kiểm tra xem đã có membership plans chưa
    const existingPlans = await MembershipPlan.count();
    
    if (existingPlans === 0) {
      console.log('📝 Tạo dữ liệu mẫu cho membership plans...');
      
      await MembershipPlan.bulkCreate([
        {
          name: 'Free',
          type: 'free',
          price: 0,
          duration: 0,
          description: 'Basic access to quit smoking tools',
          features: [
            'Basic progress tracking',
            'Daily check-ins', 
            'Community support',
            'Educational articles'
          ],
          is_recommended: false,
          is_active: true
        },
        {
          name: 'Premium',
          type: 'premium', 
          price: 9.99,
          duration: 30,
          description: 'Enhanced support for your quit journey',
          features: [
            'All free features',
            'Advanced progress analytics',
            'Personalized quit plan', 
            'Group coaching sessions',
            'Priority email support'
          ],
          is_recommended: true,
          is_active: true
        },
        {
          name: 'Professional',
          type: 'pro',
          price: 19.99, 
          duration: 30,
          description: 'Maximum support with personalized coaching',
          features: [
            'All premium features',
            'One-on-one coaching sessions',
            '24/7 priority support',
            'Custom meal and exercise plans', 
            'Advanced health tracking'
          ],
          is_recommended: false,
          is_active: true
        }
      ]);
      
      console.log('✅ Dữ liệu mẫu membership plans đã được tạo!');
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu mẫu:', error);
  }
};

export default syncDatabase;

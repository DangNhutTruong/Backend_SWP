# HỆ THỐNG TẠO KẾ HOẠCH CAI THUỐC - DOCUMENTATION

## 📋 TỔNG QUAN HỆ THỐNG

Hệ thống tạo kế hoạch cai thuốc là một trong những tính năng cốt lõi của ứng dụng NoSmoke, cho phép người dùng tạo ra các kế hoạch cai thuốc cá nhân hóa dựa trên thói quen và mức độ phụ thuộc của họ.

## 🔄 LUỒNG XỬ LÝ CHÍNH

### 1. Thu thập thông tin người dùng
- **Số điếu thuốc/ngày**: Để tính toán mức độ phụ thuộc
- **Giá gói thuốc**: Để tính toán lợi ích tài chính
- **Số năm hút thuốc**: Để đánh giá mức độ nghiện
- **Lý do cai thuốc**: Để tạo motivation

### 2. Tính toán mức độ phụ thuộc theo WHO
```javascript
// Dựa trên WHO Tobacco Dependence Guidelines
function calculateWHODependenceLevel() {
  let dependenceScore = 1; // Nhẹ
  
  if (cigarettesPerDay >= 5) dependenceScore = 2;   // Vừa phải
  if (cigarettesPerDay >= 15) dependenceScore = 3;  // Nặng  
  if (cigarettesPerDay >= 25) dependenceScore = 4;  // Rất nặng
  
  // Điều chỉnh theo thời gian hút
  if (smokingYears >= 10) dependenceScore += 1;
  else if (smokingYears >= 5) dependenceScore += 0.5;
  
  return Math.round(dependenceScore);
}
```

### 3. Sinh kế hoạch tự động
Dựa trên mức độ hút thuốc, hệ thống tạo ra 2 lựa chọn kế hoạch:

#### 🟢 Người hút nhẹ (<10 điếu/ngày)
- **Kế hoạch nhanh**: 4 tuần, giảm 30%/tuần
- **Kế hoạch từ từ**: 6 tuần, giảm 25%/tuần

#### 🟡 Người hút trung bình (10-20 điếu/ngày)  
- **Kế hoạch nhanh**: 6 tuần, giảm 20%/tuần
- **Kế hoạch từ từ**: 8 tuần, giảm 15%/tuần

#### 🔴 Người hút nặng (>20 điếu/ngày)
- **Kế hoạch nhanh**: 8 tuần, giảm 15%/tuần  
- **Kế hoạch từ từ**: 12 tuần, giảm 10%/tuần

### 4. Timeline chi tiết theo tuần
Mỗi kế hoạch có cấu trúc:
```javascript
{
  week: 1,
  amount: 8,           // Số điếu mục tiêu tuần này
  reduction: 2,        // Số điếu giảm so với tuần trước  
  phase: 'Thích nghi'  // Giai đoạn: Thích nghi → Ổn định → Hoàn thiện
}
```

### 5. Lưu trữ và đồng bộ hóa
- **Database**: Lưu kế hoạch chính thức qua API
- **localStorage**: Đồng bộ để truy cập nhanh
- **Event system**: Thông báo cho các component khác cập nhật

## 🏗️ KIẾN TRÚC HỆ THỐNG

### Frontend Components

#### 1. **JourneyStepper.jsx** - Component chính
```
📁 /client/src/components/JourneyStepper.jsx
🎯 Chức năng: UI wizard tạo kế hoạch, thu thập thông tin, hiển thị timeline
📊 States: formData, currentStep, selectedPlan, isCompleted
🔄 Key Functions:
  - generateLightSmokerPlans()
  - generateModerateSmokerPlans() 
  - generateHeavySmokerPlans()
  - handleSubmit() - Lưu kế hoạch vào database
  - calculateWHODependenceLevel()
```

#### 2. **QuitPlanList.jsx** - Quản lý danh sách
```
📁 /client/src/components/QuitPlanList.jsx  
🎯 Chức năng: Hiển thị, xóa, cập nhật trạng thái kế hoạch
📊 States: plans[], loading, error, updatingPlanId
🔄 Key Functions:
  - fetchPlans() - Load danh sách từ API
  - handleUpdateStatus() - Thay đổi trạng thái
  - handleDeletePlan() - Xóa kế hoạch
  - calculateProgress() - Tính % hoàn thành
```

#### 3. **JourneyRouter.jsx** - Router logic
```
📁 /client/src/components/JourneyRouter.jsx
🎯 Chức năng: Điều hướng giữa JourneyStepper và QuitPlanList
🔄 Logic: Nếu có kế hoạch → hiển thị QuitPlanList, nếu không → JourneyStepper
```

#### 4. **AdminQuitPlans.jsx** - Quản lý admin
```
📁 /client/src/page/admin/AdminQuitPlans.jsx
🎯 Chức năng: Tạo/sửa kế hoạch mẫu, quản lý templates
📊 Features: CRUD templates, phân loại user types, tracking usage
```

### Backend API Layer

#### 1. **quitPlanService.js** - Service layer
```
📁 /client/src/services/quitPlanService.js
🎯 Chức năng: API calls, authentication headers, error handling
🔄 Functions:
  - createQuitPlan(planData)
  - getUserPlans() 
  - getUserActivePlan()
  - updatePlanStatus(planId, status)
  - deletePlan(planId)
```

#### 2. **quitPlanController.js** - Backend controller
```
📁 /server/src/controllers/quitPlanController.js
🎯 Chức năng: Xử lý business logic, database operations
🔄 Endpoints:
  - POST /api/quit-plans - Tạo kế hoạch mới
  - GET /api/quit-plans/user - Lấy danh sách kế hoạch
  - GET /api/quit-plans/active - Lấy kế hoạch đang hoạt động
  - PUT /api/quit-plans/:id/status - Cập nhật trạng thái
  - DELETE /api/quit-plans/:id - Xóa kế hoạch
```

#### 3. **quitPlanRoutes.js** - Route definitions
```
📁 /server/src/routes/quitPlanRoutes.js
🎯 Chức năng: Define API routes, middleware authentication
🔒 Middleware: authenticateToken cho tất cả routes
```

### Database Schema

#### Table: quit_smoking_plan
```sql
CREATE TABLE quit_smoking_plan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  smoker_id INT NOT NULL,                    -- User ID
  plan_name VARCHAR(255) NOT NULL,           -- Tên kế hoạch
  plan_details JSON,                         -- Chi tiết kế hoạch (weeks, metadata)
  start_date DATE,                           -- Ngày bắt đầu
  end_date DATE,                             -- Ngày kết thúc dự kiến
  status ENUM('ongoing', 'completed', 'failed') DEFAULT 'ongoing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (smoker_id) REFERENCES users(id)
);
```

#### Cấu trúc plan_details JSON:
```json
{
  "strategy": "gradual",
  "goal": "health", 
  "initialCigarettes": 20,
  "totalWeeks": 8,
  "weeks": [
    {
      "week": 1,
      "target": 17,
      "phase": "Thích nghi"
    },
    {
      "week": 2, 
      "target": 14,
      "phase": "Thích nghi"
    }
  ],
  "metadata": {
    "packPrice": 25000,
    "smokingYears": 5,
    "selectedPlanId": 2
  }
}
```

## 🔗 DATA FLOW & INTEGRATION

### 1. Tạo kế hoạch mới
```
User Input → JourneyStepper → quitPlanService → Backend API → Database
                ↓
localStorage ← Event Dispatch ← API Response
                ↓  
Progress.jsx ← CheckinHistory.jsx ← QuitPlanList.jsx
```

### 2. Lấy kế hoạch hiện tại
```
Component Mount → quitPlanService.getUserActivePlan() → Backend → Database
                        ↓
ActivePlanSelector ← Progress.jsx ← Response Data
```

### 3. Cập nhật tiến độ
```
CheckinHistory Update → Progress.jsx → ActivePlan Load → Timeline Calculation
```

## 🎯 ĐIỂM NỔI BẬT

### 1. **Cá nhân hóa thông minh**
- Dựa trên guidelines y tế WHO
- Tính toán mức độ phụ thuộc chính xác
- Đề xuất timeline phù hợp

### 2. **Hệ thống Event-driven**
- Real-time updates giữa components
- Đồng bộ localStorage và database
- Automatic UI refresh

### 3. **Kiến trúc linh hoạt**
- Hỗ trợ nhiều loại kế hoạch
- Dễ dàng thêm template mới
- Scalable cho future features

### 4. **User Experience tốt**
- Wizard interface thân thiện
- Progress tracking visual
- Error handling comprehensive

## 🚀 CÁCH SỬ DỤNG

### Cho User:
1. Truy cập `/journey/create`
2. Điền thông tin hút thuốc hiện tại  
3. Chọn kế hoạch phù hợp
4. Xác nhận và bắt đầu

### Cho Admin:
1. Truy cập Admin Dashboard
2. Quản lý kế hoạch mẫu
3. Theo dõi usage statistics
4. Tạo template mới

### Cho Developer:
1. Extend `generateXXXSmokerPlans()` functions
2. Thêm fields vào `plan_details` JSON
3. Customize timeline calculation logic
4. Integrate với modules khác

## 🔧 CUSTOMIZATION

### Thêm loại kế hoạch mới:
```javascript
const generateCustomPlans = () => {
  // Logic tạo kế hoạch tùy chỉnh
  return [plan1, plan2];
};
```

### Thêm field mới vào database:
```sql
ALTER TABLE quit_smoking_plan 
ADD COLUMN new_field VARCHAR(255);
```

### Tạo endpoint API mới:
```javascript
// Trong quitPlanController.js
export const customFunction = async (req, res) => {
  // Logic xử lý
};

// Trong quitPlanRoutes.js  
router.post('/custom', authenticateToken, customFunction);
```

Hệ thống này tạo nền tảng vững chắc cho việc quản lý kế hoạch cai thuốc, có thể mở rộng và tùy chỉnh theo nhu cầu cụ thể của dự án.

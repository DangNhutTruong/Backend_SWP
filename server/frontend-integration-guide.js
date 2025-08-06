/**
 * Frontend Integration Guide for plan_id requirement
 * 
 * Vấn đề hiện tại:
 * - Backend đã được cập nhật để bắt buộc plan_id cho tất cả progress API
 * - Frontend vẫn sử dụng API cũ không có plan_id
 * - Khi xóa checkin, frontend không truyền plan_id nên không xóa được đúng record
 * - Khi load lại data, frontend không filter theo plan_id nên vẫn thấy data cũ
 * 
 * GIẢI PHÁP:
 */

// 1. CẬP NHẬT progressService.js
console.log(`
=== 1. CẬP NHẬT progressService.js ===

Tất cả functions trong progressService.js cần được cập nhật để nhận plan_id:

// TRƯỚC (không có plan_id):
createCheckin: async (userId, date, checkinData) => {
  // API call không có plan_id
}

// SAU (có plan_id):
createCheckin: async (userId, date, checkinData, planId) => {
  const dataToSend = {
    ...checkinData,
    plan_id: planId // BẮT BUỘC
  };
  
  const response = await fetch('/api/progress/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataToSend)
  });
}

// Các functions cần cập nhật:
- createCheckin(userId, date, checkinData, planId)
- getUserProgress(userId, planId, startDate, endDate, limit)
- getCheckinByDate(userId, date, planId)
- updateCheckin(userId, date, updateData, planId)
- deleteCheckin(userId, date, planId)
- getProgressStats(userId, planId, days)
- getChartData(userId, planId, days, type)
`);

// 2. CẬP NHẬT COMPONENTS
console.log(`
=== 2. CẬP NHẬT COMPONENTS ===

A. Progress.jsx:
- Import ActivePlanSelector
- Thêm state selectedPlan
- Truyền selectedPlan.id vào tất cả progressService calls

// Ví dụ:
const Progress = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  const handleDeleteCheckin = async (date) => {
    if (!selectedPlan?.id) {
      alert('Vui lòng chọn kế hoạch');
      return;
    }
    
    await progressService.deleteCheckin(userId, date, selectedPlan.id);
    // Reload data for selected plan
    await loadProgressData(selectedPlan.id);
  };
  
  const loadProgressData = async (planId) => {
    if (!planId) return;
    
    const data = await progressService.getUserProgress(userId, planId);
    setProgressData(data);
  };
  
  return (
    <div>
      <ActivePlanSelector 
        selectedPlan={selectedPlan}
        onPlanChange={(plan) => {
          setSelectedPlan(plan);
          loadProgressData(plan?.id);
        }}
      />
      {/* Rest of component */}
    </div>
  );
};

B. CheckinHistory.jsx:
- Nhận selectedPlan từ parent
- Filter data theo plan_id
- Truyền plan_id vào delete/update calls

C. DailyCheckin.jsx:
- Nhận selectedPlan từ parent
- Truyền plan_id vào createCheckin call
`);

// 3. FLOW HOẠT ĐỘNG MỊI
console.log(`
=== 3. FLOW HOẠT ĐỘNG MỚI ===

1. User chọn plan từ ActivePlanSelector
2. selectedPlan.id được store trong state
3. Tất cả API calls progress đều gửi kèm plan_id
4. Khi plan thay đổi:
   - Clear cache/data cũ
   - Load data mới cho plan được chọn
5. Khi không có plan được chọn:
   - Hiển thị message "Vui lòng chọn kế hoạch"
   - Disable các actions

=== 4. CÁC FILE CẦN SỬA ===

📁 client/src/services/progressService.js
- Thêm planId parameter cho tất cả functions
- Cập nhật API endpoints để gửi plan_id

📁 client/src/page/Progress.jsx  
- Import và sử dụng ActivePlanSelector
- Truyền selectedPlan.id vào progressService calls
- Handle plan change event

📁 client/src/components/CheckinHistory.jsx
- Nhận selectedPlan prop từ parent
- Truyền plan_id vào delete calls

📁 client/src/components/DailyCheckin.jsx
- Nhận selectedPlan prop từ parent  
- Truyền plan_id vào create calls

=== 5. TESTING ===

Sau khi cập nhật:
1. Chọn plan A → Tạo checkin → Verify data chỉ thuộc plan A
2. Chọn plan B → Tạo checkin → Verify data chỉ thuộc plan B  
3. Xóa checkin của plan A → Verify plan B data không bị ảnh hưởng
4. Switch giữa các plans → Verify data được filter đúng
`);

export { };

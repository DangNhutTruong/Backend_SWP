// Test script để debug dữ liệu Progress
// Chạy script này trong browser console để kiểm tra dữ liệu

async function testProgressData() {
  console.log("🔍 TESTING PROGRESS DATA...");
  
  // 1. Kiểm tra localStorage
  console.log("\n=== LOCALSTORAGE DATA ===");
  const activePlan = localStorage.getItem('activePlan');
  const dashboardStats = localStorage.getItem('dashboardStats');
  
  console.log("activePlan:", activePlan ? JSON.parse(activePlan) : "Không có");
  console.log("dashboardStats:", dashboardStats ? JSON.parse(dashboardStats) : "Không có");
  
  // 2. Kiểm tra database
  console.log("\n=== DATABASE DATA ===");
  const userId = localStorage.getItem('user_id') || localStorage.getItem('userId') || 
                JSON.parse(localStorage.getItem('user') || '{}')?.id;
  
  if (userId) {
    try {
      const response = await fetch(`/api/progress/${userId}`);
      console.log("Database response status:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log("Database result:", result);
        
        if (result.success && result.data) {
          console.log(`Found ${result.data.length} database records:`);
          result.data.forEach((item, index) => {
            console.log(`Record ${index + 1}:`, {
              date: item.date,
              target: item.target_cigarettes,
              actual: item.actual_cigarettes,
              health_score: item.health_score,
              cigarettes_avoided: item.cigarettes_avoided,
              money_saved: item.money_saved
            });
          });
          
          // 3. Tính toán thống kê
          console.log("\n=== CALCULATED STATS ===");
          let totalSaved = 0;
          let totalMoney = 0;
          
          result.data.forEach(item => {
            const saved = Math.max(0, (item.target_cigarettes || 0) - (item.actual_cigarettes || 0));
            totalSaved += saved;
            totalMoney += item.money_saved || 0;
          });
          
          console.log("Total cigarettes saved:", totalSaved);
          console.log("Total money saved:", totalMoney);
          console.log("Number of check-ins:", result.data.length);
        }
      }
    } catch (error) {
      console.error("Database error:", error);
    }
  } else {
    console.log("No user ID found");
  }
}

// Chạy test
testProgressData();

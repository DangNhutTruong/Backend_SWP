# CHUẨN BỊ PHỎNG VẤN FRONTEND - AMAZINGTECH
*Ngày phỏng vấn: 6/9/2025*

## 🎯 THÔNG TIN CÁ NHÂN
**Ứng viên:** Phạm Trung Tín  
**Vị trí:** Frontend Developer  
**Công ty:** AmazingTech  

---

## 📋 CHECKLIST CHUẨN BỊ TRƯỚC PHỎNG VẤN

### ✅ Tài liệu cần mang
- [ ] CV in sẵn (2-3 bản)
- [ ] Portfolio/Demo projects trên laptop
- [ ] Danh sách câu hỏi để hỏi nhà tuyển dụng
- [ ] Notebook và bút ghi chú

### ✅ Kiểm tra kỹ thuật
- [ ] Laptop/thiết bị demo hoạt động tốt
- [ ] Internet connection ổn định
- [ ] Code editor sẵn sàng (VS Code)
- [ ] Projects demo đã test và chạy được

---

## 🚀 DỰ ÁN NỔI BẬT CẦN DEMO

### 1. Smoking Cessation Support Platform
**Công nghệ:** React, JavaScript, CSS, Node.js  
**Mô tả:** Platform hỗ trợ người dùng bỏ thuốc lá

**Điểm nhấn khi demo:**
- ✨ Responsive design với Tailwind CSS
- ✨ Component-based architecture
- ✨ Real-time features (messaging, notifications)
- ✨ User management và authentication
- ✨ Progress tracking và achievements system
- ✨ Blog/Articles management
- ✨ Payment integration (ZaloPay)

**Kỹ năng thể hiện:**
- React Hooks (useState, useEffect, useContext)
- Component composition
- State management
- API integration
- Responsive design
- Modern JavaScript (ES6+)

---

## 💡 CÂU HỎI TECHNICAL THƯỜNG GẶP

### React & JavaScript
1. **"Giải thích về React Hooks"**
   ```javascript
   // useState example
   const [count, setCount] = useState(0);
   
   // useEffect example
   useEffect(() => {
     document.title = `Count: ${count}`;
   }, [count]);
   ```

2. **"Sự khác biệt giữa useState và useReducer?"**
   - useState: simple state
   - useReducer: complex state logic, multiple sub-values

3. **"Virtual DOM là gì?"**
   - In-memory representation of real DOM
   - Faster updates through diffing algorithm
   - Better performance

4. **"Props vs State?"**
   - Props: read-only data from parent
   - State: component's local data, mutable

### CSS & Styling
1. **"CSS Flexbox vs Grid?"**
   - Flexbox: 1-dimensional layout
   - Grid: 2-dimensional layout

2. **"Responsive design strategies?"**
   - Mobile-first approach
   - CSS Media queries
   - Flexible units (rem, em, %)
   - CSS Grid/Flexbox

### Performance & Optimization
1. **"Cách optimize React app?"**
   - Code splitting
   - Lazy loading
   - Memoization (React.memo, useMemo)
   - Bundle optimization

---

## 🎯 CÂU HỎI VỀ DỰ ÁN CỤ THỂ

### Về Smoking Cessation Platform:

**Q: "Tại sao chọn React cho dự án này?"**
**A:** 
- Component reusability cho UI elements
- Large ecosystem và community support
- Virtual DOM cho performance tốt
- Hooks giúp state management dễ dàng

**Q: "Thử thách lớn nhất trong dự án?"**
**A:**
- Tích hợp real-time messaging system
- Xử lý complex state cho user progress tracking
- Responsive design cho nhiều devices
- Payment integration với ZaloPay

**Q: "Làm thế nào handle state management?"**
**A:**
- Context API cho global state (user authentication)
- Local state với useState cho component-specific data
- Custom hooks cho reusable logic

---

## 🔧 TECHNICAL SKILLS HIGHLIGHT

### Frontend Technologies
- ✅ **JavaScript (ES6+):** Arrow functions, Destructuring, Async/Await
- ✅ **React:** Hooks, Context, Component lifecycle
- ✅ **CSS:** Flexbox, Grid, Responsive design, Tailwind CSS
- ✅ **Tools:** Vite, ESLint, Git/GitHub

### Additional Skills
- ✅ **API Integration:** RESTful APIs, Fetch/Axios
- ✅ **Version Control:** Git, GitHub collaboration
- ✅ **Build Tools:** Vite configuration
- ✅ **Package Management:** npm, package.json

---

## 🎨 CODE EXAMPLES ĐỂ DEMO

### 1. React Component Example
```jsx
// Achievement Component
import React, { useState, useEffect } from 'react';

const Achievement = ({ userId }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`/api/achievements/${userId}`);
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="achievements-grid">
      {achievements.map(achievement => (
        <div key={achievement.id} className="achievement-card">
          <h3>{achievement.title}</h3>
          <p>{achievement.description}</p>
          <span className="badge">{achievement.points} points</span>
        </div>
      ))}
    </div>
  );
};

export default Achievement;
```

### 2. CSS/Tailwind Example
```css
/* Responsive grid layout */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.achievement-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1.5rem;
  color: white;
  transform: translateY(0);
  transition: transform 0.3s ease;
}

.achievement-card:hover {
  transform: translateY(-5px);
}

@media (max-width: 768px) {
  .achievements-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}
```

---

## 📚 CÂU HỎI SOFT SKILLS

### 1. "Tại sao bạn muốn làm Frontend?"
**Gợi ý trả lời:**
- Đam mê tạo ra user experience tốt
- Thích sự kết hợp giữa logic và creativity
- Muốn xây dựng products có impact đến users

### 2. "Làm thế nào bạn stay updated với technology?"
**Gợi ý:**
- Follow React documentation và release notes
- Đọc tech blogs (Medium, Dev.to)
- Tham gia communities (Reddit, Discord)
- Practice với personal projects

### 3. "Describe a challenging bug you fixed"
**Có thể kể về:**
- Performance issues với large datasets
- Cross-browser compatibility problems
- State management complexity
- API integration challenges

---

## 🏢 CÂU HỎI VỀ CÔNG TY AMAZINGTECH

### Research trước về công ty:
- [ ] Company mission và values
- [ ] Recent projects/products
- [ ] Company culture
- [ ] Technology stack họ sử dụng

### Câu hỏi để hỏi interviewer:
1. "Team structure như thế nào?"
2. "Công nghệ chính team đang sử dụng?"
3. "Opportunities for learning và growth?"
4. "Challenging projects team đang work on?"
5. "Code review process như thế nào?"

---

## ⏰ TIMELINE NGÀY PHỎNG VẤN

### Trước phỏng vấn 2-3 tiếng:
- [ ] Review lại technical concepts chính
- [ ] Test demo projects một lần nữa
- [ ] Chuẩn bị câu hỏi để hỏi
- [ ] Ăn nhẹ, nghỉ ngơi đầy đủ

### 30 phút trước:
- [ ] Kiểm tra thiết bị lần cuối
- [ ] Review company info
- [ ] Relax và tự tin

---

## 🎯 TIPS THÀNH CÔNG

### During Interview:
- 🎯 **Be confident:** Nói về achievements một cách tự tin
- 🎯 **Show passion:** Thể hiện đam mê với technology
- 🎯 **Ask questions:** Quan tâm đến company và role
- 🎯 **Be honest:** Thành thật về skill level và experience
- 🎯 **Show learning attitude:** Sẵn sàng học hỏi và adapt

### Demo Tips:
- Start với overview của project
- Highlight technical challenges và solutions
- Show responsive design
- Explain code structure và decisions
- Demo user interactions

---

## 📝 PRACTICE QUESTIONS

### Technical Practice:
1. Code a simple React component live
2. Explain how you would implement a feature
3. Discuss performance optimization strategies
4. Walk through your debugging process

### Behavioral Practice:
1. "Tell me about yourself"
2. "Why should we hire you?"
3. "Where do you see yourself in 3 years?"
4. "Describe a time you had to learn something quickly"

---

## 🚀 FINAL CHECKLIST

**Day Before:**
- [ ] Review all materials
- [ ] Good night sleep
- [ ] Prepare clothes
- [ ] Set multiple alarms

**Day Of:**
- [ ] Arrive 10-15 minutes early
- [ ] Bring positive energy
- [ ] Stay calm and confident
- [ ] Follow up with thank you email

---

**GOOD LUCK! BẠN ĐÃ CHUẨN BỊ RẤT TỐT! 🌟**

*Remember: They invited you for a reason. Show them why you're the right fit!*

## 🎯 MEMBERSHIP ISSUE FIX GUIDE

### Vấn đề: Đã có gói PRE nhưng vẫn bị yêu cầu nâng cấp

### 🔧 Nguyên nhân có thể:
1. Membership được lưu là "pre" thay vì "premium"
2. User data không được sync đúng cách
3. RequireMembership component không nhận diện đúng membership format

### ✅ Đã sửa:
1. **RequireMembership.jsx** - Thêm mapping "pre" → "premium"
2. **Enhanced debug tools** - Kiểm tra membership logic
3. **Membership normalization** - Handle different formats

### 🧪 Cách test ngay bây giờ:

#### Bước 1: Kiểm tra membership hiện tại
```javascript
// Chạy trong browser console
window.debugAuthNew.checkMembershipLogic()
```

#### Bước 2: Test membership API
```javascript
// Kiểm tra API membership
window.debugAuthNew.testMembershipApi()
```

#### Bước 3: Nếu cần fix membership mapping
```javascript
// Copy và paste script này vào console:
fetch('/membership-fix.js').then(r => r.text()).then(eval)
```

#### Bước 4: Manual fix nếu cần
```javascript
// Nếu membership hiện tại là "pre", update thành "premium"
const userData = JSON.parse(localStorage.getItem('nosmoke_user'));
userData.membership = 'premium';
userData.membershipType = 'premium';
localStorage.setItem('nosmoke_user', JSON.stringify(userData));
console.log('✅ Membership updated to premium');

// Reload page to see changes
location.reload();
```

### 🎯 Expected Results:
- ✅ "pre" membership được map thành "premium"  
- ✅ RequireMembership cho phép access với premium
- ✅ BookAppointment page không hiển thị modal upgrade
- ✅ User có thể book coach appointment

### 🚨 Nếu vẫn có vấn đề:

#### Option 1: Clear và login lại
```javascript
window.debugAuthNew.clearAllAuth();
// Sau đó navigate to /login
```

#### Option 2: Check backend membership data
- Kiểm tra database xem membership có được lưu đúng không
- Verify purchase history có record gói PRE

#### Option 3: Contact support
- Nếu database có vấn đề về membership record
- Nếu payment không được process đúng cách

### 🔧 Debug Commands:
```javascript
// Full diagnostic
window.debugAuthNew.fullAuthReport()

// Check membership specifically  
window.debugAuthNew.checkMembershipLogic()

// Test membership API
window.debugAuthNew.testMembershipApi()

// Run membership fix
fetch('/membership-fix.js').then(r => r.text()).then(eval)
```

# Cập nhật HistoryProfile - Hiển thị tất cả ngày từ kế hoạch

## Những thay đổi đã thực hiện:

### 1. **Hiển thị tất cả ngày từ lập kế hoạch**
- ✅ Lấy thông tin kế hoạch hiện tại để có `startDate` và `endDate`
- ✅ Tạo danh sách tất cả ngày từ ngày bắt đầu đến ngày kết thúc kế hoạch
- ✅ Hiển thị cả những ngày chưa check-in (N/A) và những ngày đã check-in
- ✅ Sử dụng `generateDaysArray()` để tạo danh sách ngày đầy đủ

### 2. **Nền trắng chữ đen**
- ✅ Loại bỏ hoàn toàn dark mode support
- ✅ Giữ nguyên theme sáng với nền trắng và chữ đen
- ✅ Đảm bảo contrast tốt cho accessibility

### 3. **Logic giống CheckinHistory**
- ✅ Thêm các helper functions từ CheckinHistory:
  - `generateDaysArray()` - Tạo danh sách ngày
  - `createEmptyCheckin()` - Tạo record trống cho ngày chưa check-in
  - `getInitialCigarettesFromPlan()` - Lấy số điếu ban đầu từ kế hoạch
  - `getTargetCigarettesForDate()` - Tính mục tiêu theo ngày dựa trên kế hoạch

### 4. **Cải thiện thống kê**
- ✅ **Tổng ngày**: Hiển thị tất cả ngày trong kế hoạch
- ✅ **Đã check-in**: Chỉ đếm những ngày có dữ liệu thực tế
- ✅ **Tuần này**: Chỉ đếm những ngày đã check-in trong tuần

### 5. **Sắp xếp và phân trang**
- ✅ Sắp xếp theo ngày tăng dần (ngày bắt đầu kế hoạch ở trang đầu)
- ✅ Tăng số entries mỗi trang từ 10 lên 15 (giống CheckinHistory)
- ✅ Hiển thị ngày trống với style khác biệt (opacity 0.7)

### 6. **Xử lý dữ liệu**
- ✅ Xử lý đúng trường hợp `actualCigarettes = null` (hiển thị N/A)
- ✅ Xử lý đúng trường hợp `cigarettes_avoided = null`
- ✅ Xử lý đúng trường hợp `money_saved = null`
- ✅ Hiển thị health score với thanh tiến trình

## Cách hoạt động:

### 1. **Khi có kế hoạch:**
```
1. Lấy thông tin kế hoạch hiện tại
2. Tạo danh sách tất cả ngày từ startDate đến endDate
3. Với mỗi ngày:
   - Nếu có dữ liệu check-in → hiển thị dữ liệu thực
   - Nếu chưa có → tạo record trống với mục tiêu từ kế hoạch
4. Sắp xếp theo ngày tăng dần
```

### 2. **Khi không có kế hoạch:**
```
1. Chỉ hiển thị những ngày có dữ liệu check-in thực tế
2. Sắp xếp theo ngày tăng dần
```

## Giao diện:

### 📊 **Thống kê:**
- **Tổng ngày**: Tất cả ngày trong kế hoạch (bao gồm cả ngày trống)
- **Đã check-in**: Chỉ những ngày có dữ liệu thực tế  
- **Tuần này**: Số ngày đã check-in trong tuần hiện tại

### 📋 **Bảng dữ liệu:**
| Cột | Mô tả | Xử lý ngày trống |
|-----|-------|------------------|
| Ngày | Format: Hôm nay/Hôm qua/dd/mm/yy | Luôn hiển thị |
| Mục tiêu | Từ kế hoạch theo tuần | Hiển thị mục tiêu |
| Đã hút | Số điếu thực tế | N/A nếu chưa nhập |
| Đã tránh | Tính toán | N/A nếu chưa nhập |
| Điểm sức khỏe | Thanh % | N/A nếu chưa nhập |
| Tiết kiệm | Tính theo pack price | N/A nếu chưa nhập |
| Ghi chú | Text từ user | "-" nếu trống |

### 🎨 **Styling ngày trống:**
- Background: `#fafbfc` với opacity 0.7
- Hover: opacity tăng lên 0.8
- Text "N/A": màu xám italic

## So sánh với CheckinHistory:

| Tính năng | CheckinHistory | HistoryProfile |
|-----------|----------------|----------------|
| Hiển thị tất cả ngày | ✅ | ✅ |
| Phân trang | 7/trang | 15/trang |
| Sắp xếp | Tăng dần | Tăng dần |
| Edit/Delete | ✅ | ❌ (read-only) |
| Nền/Chữ | Trắng/Đen | Trắng/Đen |
| Responsive | ✅ | ✅ |

Giờ HistoryProfile hoạt động giống hệt CheckinHistory về logic hiển thị dữ liệu! 🎉

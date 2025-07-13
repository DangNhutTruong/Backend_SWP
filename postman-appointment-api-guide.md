# Hướng dẫn chi tiết test API Appointment trên Postman

## Mục lục
1. [Thiết lập môi trường (Environment)](#1-thiết-lập-môi-trường-environment)
2. [Đăng nhập và lấy token](#2-đăng-nhập-và-lấy-token)
3. [Test các API Appointment](#3-test-các-api-appointment)
4. [Xử lý lỗi thường gặp](#4-xử-lý-lỗi-thường-gặp)
5. [Phụ lục](#5-phụ-lục)

## 1. Thiết lập môi trường (Environment)

1. Nhấn vào biểu tượng bánh răng ở góc trên bên phải và chọn "Environments"

2. Nhấn vào "+" để tạo môi trường mới

3. Đặt tên môi trường là "NoSmoke API"
4. Thêm các biến môi trường:
   - `base_url` với giá trị ban đầu là `http://localhost:5000` (điều chỉnh port nếu cần)
   - `token` để trống giá trị ban đầu
   - `appointment_id` để trống giá trị ban đầu

5. Nhấn "Save" để lưu môi trường
6. Chọn môi trường "NoSmoke API" từ dropdown ở góc trên bên phải

## 2. Đăng nhập và lấy token

1. Tạo request POST mới với URL: `{{base_url}}/api/auth/login`
2. Trong tab "Body", chọn định dạng "raw" và "JSON", sau đó nhập một trong hai cách sau:
   
   Đăng nhập với email:
   ```json
   {
     "email": "your_email@example.com",
     "password": "your_password"
   }
   ```
   
   Hoặc đăng nhập với username:
   ```json
   {
     "username": "your_username",
     "password": "your_password"
   }
   ```
3. Tùy chọn: Thêm script test để tự động lưu token. Trong tab "Tests", thêm:
   ```javascript
   if (pm.response.code === 200) {
     var jsonData = pm.response.json();
     pm.environment.set("token", jsonData.token);
   }
   ```
4. Nhấn nút "Send" để gửi yêu cầu đăng nhập
5. Nếu đăng nhập thành công, sao chép token từ phản hồi và lưu vào biến môi trường `token`
6. Bạn có thể kiểm tra token đã được lưu bằng cách nhấn vào biểu tượng "eye" bên cạnh dropdown môi trường

## 3. Test các API Appointment

### Thiết lập cơ bản cho mỗi request

Tất cả các API liên quan đến lịch hẹn đều yêu cầu xác thực JWT. Đối với mỗi request, hãy đảm bảo:

1. Trong tab "Headers", thêm header `Authorization` với giá trị `Bearer {{token}}`
2. Trong tab "Body", chọn định dạng "raw" và "JSON" để gửi dữ liệu

### 3.1. Tạo lịch hẹn mới

1. Tạo request POST mới với URL: `{{base_url}}/api/appointments`
2. Trong tab "Headers", thêm header `Authorization` với giá trị `Bearer {{token}}`
3. Trong tab "Body", chọn định dạng "raw" và "JSON", sau đó nhập:
   ```json
   {
     "coach_id": 13,
     "appointment_time": "2025-07-08T10:00:00Z",
     "duration_minutes": 60
   }
   ```
   
   **Chú ý**:
   - `coach_id` phải là số nguyên và tồn tại trong hệ thống với vai trò là coach
   - `appointment_time` phải là định dạng ISO chuẩn (YYYY-MM-DDTHH:MM:SSZ) và đảm bảo:
     - Tháng và ngày phải có 2 chữ số (ví dụ: 07 thay vì 7)
     - Giờ, phút, giây phải có 2 chữ số (ví dụ: 09:00:00 thay vì 9:0:0)
     - Chữ "T" phải được đặt giữa phần ngày và phần giờ
     - Chữ "Z" ở cuối đại diện cho múi giờ UTC
   - `appointment_time` phải là thời gian trong tương lai
   - `duration_minutes` phải là số nguyên
   - Thời gian hẹn phải nằm trong lịch làm việc của coach (ngày trong tuần và giờ làm việc)
4. Tùy chọn: Thêm script test để lưu ID lịch hẹn. Trong tab "Tests", thêm:
   ```javascript
   if (pm.response.code === 201) {
     var jsonData = pm.response.json();
     pm.environment.set("appointment_id", jsonData.data.id);
   }
   ```
5. Nhấn "Send" để gửi yêu cầu

### 3.2. Lấy danh sách lịch hẹn của người dùng

1. Tạo request GET mới với URL: `{{base_url}}/api/appointments`
2. Trong tab "Headers", thêm header `Authorization` với giá trị `Bearer {{token}}`
3. Nhấn "Send" để gửi yêu cầu
4. Xem danh sách lịch hẹn của bạn trong phần Response

### 3.3. Lấy thông tin chi tiết lịch hẹn

1. Tạo request GET mới với URL: `{{base_url}}/api/appointments/{{appointment_id}}`
   * Hoặc thay thế `{{appointment_id}}` bằng ID cụ thể của lịch hẹn
2. Trong tab "Headers", thêm header `Authorization` với giá trị `Bearer {{token}}`
3. Nhấn "Send" để gửi yêu cầu
4. Xem thông tin chi tiết lịch hẹn trong phần Response

### 3.4. Cập nhật lịch hẹn

1. Tạo request PUT mới với URL: `{{base_url}}/api/appointments/{{appointment_id}}`
   * Hoặc thay thế `{{appointment_id}}` bằng ID cụ thể của lịch hẹn
2. Trong tab "Headers", thêm header `Authorization` với giá trị `Bearer {{token}}`
3. Trong tab "Body", chọn định dạng "raw" và "JSON", sau đó nhập:
   ```json
   {
     "appointment_time": "2025-07-10T14:00:00Z",
     "duration_minutes": 45
   }
   ```

   **Chú ý**:
   - `appointment_time` phải là định dạng ISO chuẩn (YYYY-MM-DDTHH:MM:SSZ) và đảm bảo:
     - Tháng và ngày phải có 2 chữ số (ví dụ: 07 thay vì 7)
     - Giờ, phút, giây phải có 2 chữ số (ví dụ: 09:00:00 thay vì 9:0:0)
     - Chữ "T" phải được đặt giữa phần ngày và phần giờ
     - Chữ "Z" ở cuối đại diện cho múi giờ UTC
   - `appointment_time` phải là thời gian trong tương lai
   - Thời gian hẹn phải nằm trong lịch làm việc của coach (ngày trong tuần và giờ làm việc)
   - Bạn có thể chỉ cập nhật một trường, không cần cập nhật cả hai

4. Nhấn "Send" để gửi yêu cầu
5. Xem thông tin lịch hẹn đã cập nhật trong phần Response

### 3.5. Hủy lịch hẹn

1. Tạo request POST mới với URL: `{{base_url}}/api/appointments/{{appointment_id}}/cancel`
   * Hoặc thay thế `{{appointment_id}}` bằng ID cụ thể của lịch hẹn
2. Trong tab "Headers", thêm header `Authorization` với giá trị `Bearer {{token}}`
3. Nhấn "Send" để gửi yêu cầu
4. Xem thông tin lịch hẹn đã hủy trong phần Response (trạng thái sẽ chuyển thành `cancelled`)

### 3.6. Đánh giá buổi tư vấn

1. Tạo request POST mới với URL: `{{base_url}}/api/appointments/{{appointment_id}}/rate`
   * Hoặc thay thế `{{appointment_id}}` bằng ID cụ thể của lịch hẹn
2. Trong tab "Headers", thêm header `Authorization` với giá trị `Bearer {{token}}`
3. Trong tab "Body", chọn định dạng "raw" và "JSON", sau đó nhập:
   ```json
   {
     "rating": 5,
     "content": "Buổi tư vấn rất hữu ích, coach đã giúp tôi hiểu rõ vấn đề."
   }
   ```
4. Nhấn "Send" để gửi yêu cầu
5. Lưu ý: 
   - Bạn chỉ có thể đánh giá các lịch hẹn có trạng thái `completed`
   - Trường `rating` phải là số từ 1 đến 5
   - Trường `content` là nội dung đánh giá chi tiết

### 3.7. Xóa lịch hẹn

1. Tạo request DELETE mới với URL: `{{base_url}}/api/appointments/{{appointment_id}}`
   * Hoặc thay thế `{{appointment_id}}` bằng ID cụ thể của lịch hẹn
2. Trong tab "Headers", thêm header `Authorization` với giá trị `Bearer {{token}}`
3. Nhấn "Send" để gửi yêu cầu
4. Xác nhận lịch hẹn đã bị xóa trong phần Response

## 4. Xử lý lỗi thường gặp

### 4.1. Lỗi xác thực (Unauthorized)

- **Triệu chứng**: Nhận phản hồi mã lỗi 401
- **Nguyên nhân**: Token hết hạn hoặc không hợp lệ
- **Giải pháp**: Thực hiện lại request "Login" để lấy token mới

### 4.2. Lỗi không tìm thấy (Not Found)

- **Triệu chứng**: Nhận phản hồi mã lỗi 404
- **Nguyên nhân**: ID lịch hẹn không tồn tại
- **Giải pháp**: Kiểm tra lại ID lịch hẹn, sử dụng "Get User Appointments" để xem danh sách lịch hẹn hợp lệ

### 4.3. Lỗi quyền truy cập (Forbidden)

- **Triệu chứng**: Nhận phản hồi mã lỗi 403
- **Nguyên nhân**: Bạn không có quyền truy cập vào lịch hẹn này
- **Giải pháp**: Đảm bảo bạn đang sử dụng tài khoản đúng (user hoặc coach) và có quyền với lịch hẹn đang thao tác

### 4.4. Lỗi dữ liệu không hợp lệ (Bad Request)

- **Triệu chứng**: Nhận phản hồi mã lỗi 400
- **Nguyên nhân**: Dữ liệu gửi lên không hợp lệ (ví dụ: thiếu trường bắt buộc, định dạng không đúng)
- **Giải pháp**: Kiểm tra lại dữ liệu trong Body của request

Một số lỗi thường gặp:
- **Định dạng ngày giờ không đúng**: Đảm bảo `appointment_time` đúng định dạng ISO chuẩn (YYYY-MM-DDTHH:MM:SSZ) với:
  - Tháng và ngày bắt buộc phải có 2 chữ số, ví dụ: "2025-07-08" thay vì "2025-7-8"
  - Giờ, phút, giây phải có 2 chữ số (ví dụ: 09:00:00 thay vì 9:0:0)
  - Chữ "T" phải được đặt giữa phần ngày và phần giờ
  - Chữ "Z" ở cuối đại diện cho múi giờ UTC
- **Thời gian hẹn trong quá khứ**: Đảm bảo `appointment_time` là thời gian trong tương lai
- **Coach không tồn tại**: Đảm bảo `coach_id` là ID hợp lệ của một người dùng có vai trò là coach trong hệ thống
- **Xung đột lịch hẹn**: Thời gian hẹn bị trùng với một lịch hẹn khác của coach
- **Coach không có lịch làm việc**: Coach phải có lịch làm việc đã đăng ký trong bảng `coach_availability` vào ngày và giờ bạn muốn hẹn. Lưu ý ngày trong tuần được lưu theo tên tiếng Anh (Monday, Tuesday, Wednesday, v.v.) trong cơ sở dữ liệu.

## 5. Phụ lục

### 5.1. Thiết lập lịch làm việc cho coach

Trước khi có thể đặt lịch hẹn với một coach, coach đó cần có lịch làm việc trong hệ thống. Sử dụng SQL để thêm lịch làm việc cho coach:

```sql
-- Thêm lịch làm việc cho coach (thay coach_id bằng ID của coach thực tế)
INSERT INTO coach_availability (coach_id, day_of_week, start_time, end_time)
VALUES 
(13, 'Monday', '08:00:00', '22:00:00'),
(13, 'Tuesday', '08:00:00', '22:00:00'),
(13, 'Wednesday', '08:00:00', '22:00:00'),
(13, 'Thursday', '08:00:00', '22:00:00'),
(13, 'Friday', '08:00:00', '22:00:00');
```

Câu lệnh SQL trên sẽ thiết lập lịch làm việc cho coach có ID = 13 từ 8 giờ sáng đến 10 giờ tối, từ thứ Hai đến thứ Sáu. Lưu ý rằng ngày trong tuần được lưu dưới dạng chuỗi tiếng Anh ('Monday', 'Tuesday', v.v.) chứ không phải số. Bạn có thể thực hiện câu lệnh này trong phpMyAdmin hoặc bất kỳ công cụ quản lý cơ sở dữ liệu MySQL nào.

### 5.2. Xem logs để debug lỗi

Khi gặp lỗi, bạn có thể xem logs trên console của server để hiểu chi tiết hơn:

1. Trong Postman, thêm phần sau vào tab "Tests" để log response:
   ```javascript
   console.log(pm.response.json());
   ```

2. Trong console của server Node.js, các thông báo lỗi sẽ được hiển thị với prefix như:
   - `⚠️ Invalid coach ID or not a coach`: ID coach không tồn tại hoặc không phải là coach
   - `⚠️ Invalid appointment time format`: Định dạng ngày giờ không đúng
   - `⚠️ Appointment time must be in the future`: Thời gian hẹn phải trong tương lai
   - `⚠️ Appointment time not within coach availability`: Thời gian hẹn không nằm trong lịch làm việc của coach
   - `⚠️ Appointment time conflicts with existing appointment`: Thời gian hẹn trùng với một lịch hẹn khác

3. Kiểm tra ID của các coaches trong hệ thống:
   ```sql
   SELECT id, username, email, role FROM users WHERE role = 'coach';
   ```

---

Mọi thắc mắc hoặc cần hỗ trợ thêm, vui lòng liên hệ với đội phát triển.

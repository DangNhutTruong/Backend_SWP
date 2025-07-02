# 🚂 Hướng dẫn setup Railway Database cho NoSmoke

## Bước 1: Tạo tài khoản Railway

1. Vào https://railway.app
2. Click **"Start a New Project"**
3. Login bằng GitHub account
4. Verify email nếu cần

## Bước 2: Tạo MySQL Database

1. Từ màn hình "New Project", click **"Deploy MySQL"** (icon database màu xanh)
2. Railway sẽ tự động provision MySQL database
3. Đợi 2-3 phút để setup hoàn tất
4. Sau khi xong, bạn sẽ thấy MySQL service trong project
5. Database sẽ có URL dạng: `mysql://root:password@containers-us-west-xxx.railway.app:3306/railway`

![Railway MySQL Setup](https://docs.railway.app/assets/images/mysql-service.png)

## 📸 **Chi tiết từng bước với hình ảnh:**

### **Bước 2a: Click "Deploy MySQL"**

```
Từ màn hình hiện tại của bạn:
┌─────────────────────────────────────┐
│ What can we help with?              │
│                                     │
│ 🚀 Deploy from GitHub repo          │
│ 📋 Deploy a template                │
│ 🐘 Deploy PostgreSQL                │
│ 🔴 Deploy Redis                     │
│ 🍃 Deploy MongoDB                   │
│ 🗄️ Deploy MySQL          ← CLICK   │
│ 📂 Empty project                    │
└─────────────────────────────────────┘
```

## ⚡ **Ngay sau khi click "Deploy MySQL":**

### **1. Ngay lập tức - Railway sẽ:**

- Redirect bạn đến project dashboard
- Bắt đầu tạo MySQL container
- Hiển thị progress bar hoặc spinning icon

### **2. Trong 1-2 phút đầu:**

```
🔄 MySQL service đang được tạo...
📦 Allocating resources...
🌐 Setting up networking...
```

### **3. Sau 2-3 phút:**

```
✅ MySQL service ready!
📊 Database: railway
👤 User: root
🔑 Password: [auto-generated]
🌐 Host: containers-us-west-xxx.railway.app
🔌 Port: 3306
```

### **4. Màn hình cuối sẽ như thế này:**

```
Project: "Your Project Name"
├── 🗄️ MySQL
│   ├── Status: ✅ Running
│   ├── URL: mysql://root:xxx@containers-us-west-xxx.railway.app:3306/railway
│   └── Memory: ~45MB
```

## 🔍 **Lấy thông tin kết nối (Bước quan trọng!):**

Sau khi MySQL ready, **click vào MySQL service**, sau đó:

1. **Click tab "Variables"**
2. **Copy các giá trị này:**

   ```
   DATABASE_URL=mysql://root:xxx@containers-us-west-xxx.railway.app:3306/railway
   MYSQL_ROOT_PASSWORD=xxx
   MYSQL_URL=mysql://root:xxx@containers-us-west-xxx.railway.app:3306/railway
   MYSQLDATABASE=railway
   MYSQLHOST=containers-us-west-xxx.railway.app
   MYSQLPASSWORD=xxx
   MYSQLPORT=3306
   MYSQLUSER=root
   ```

3. **Copy vào notepad** để lưu lại!

## Bước 3: Lấy connection string

1. Click vào MySQL service trong project
2. Vào tab **"Variables"**
3. Copy các thông tin:
   ```
   DATABASE_URL=mysql://root:xxx@containers-us-west-xxx.railway.app:3306/railway
   MYSQL_ROOT_PASSWORD=xxx
   MYSQL_URL=mysql://root:xxx@containers-us-west-xxx.railway.app:3306/railway
   ```

## Bước 4: Cập nhật .env file

Trong `server/.env`, thêm/cập nhật:

```env
# Railway Database
DATABASE_URL=mysql://root:your-password@containers-us-west-xxx.railway.app:3306/railway

# Hoặc dùng individual parameters
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-railway-password
DB_NAME=railway

# Other settings...
JWT_SECRET=your-jwt-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
CLIENT_URL=http://localhost:5173
```

## Bước 5: Test connection

```bash
cd server
npm start
```

Bạn sẽ thấy log:

```
✅ Database connected successfully
📍 Connected to Railway MySQL via connection string
🌐 Database host: containers-us-west-xxx.railway.app
```

## Bước 6: Verify data

1. Vào Railway dashboard → MySQL service → "Data" tab
2. Hoặc dùng DBeaver/MySQL Workbench connect với thông tin từ Variables
3. Kiểm tra tables được tạo tự động:
   - users
   - packages
   - achievements
   - coaches
   - appointments
   - etc.

## 🎯 **HIỆN TẠI - Bạn đang ở đây:**

Từ màn hình MySQL dashboard hiện tại:

### **Bước tiếp theo ngay lập tức:**

1. **Click tab "Variables"** (bên cạnh tab "Data" hiện tại)
2. **Sẽ thấy list các variables như:**
   ```
   DATABASE_URL=mysql://root:xxxxxxxxxxxx@containers-us-west-xxxx.railway.app:3306/railway
   MYSQL_ROOT_PASSWORD=xxxxxxxxxxxx
   MYSQL_URL=mysql://root:xxxxxxxxxxxx@containers-us-west-xxxx.railway.app:3306/railway
   MYSQLDATABASE=railway
   MYSQLHOST=containers-us-west-xxxx.railway.app
   MYSQLPASSWORD=xxxxxxxxxxxx
   MYSQLPORT=3306
   MYSQLUSER=root
   ```

3. **Copy DATABASE_URL** - Đây là thông tin quan trọng nhất!

### **Sau khi copy được DATABASE_URL:**

1. **Mở notepad** và paste vào để lưu lại
2. **Format sẽ như:** `mysql://root:password@host:3306/railway`
3. **Ví dụ:** `mysql://root:abc123xyz@containers-us-west-123.railway.app:3306/railway`

## 👁️ **COPY THÔNG TIN KẾT NỐI:**

Từ màn hình Variables hiện tại, bạn cần:

### **1. Reveal các values:**
Click vào icon **👁️** (eye) bên cạnh mỗi dòng để show actual values:
- **MYSQL_URL** - Click eye icon → Copy value này (quan trọng nhất!)
- **MYSQL_ROOT_PASSWORD** - Click eye icon → Copy password
- **MYSQL_HOST** - Click eye icon → Copy hostname  
- **MYSQL_PORT** - Thường là 3306
- **MYSQL_USER** - Thường là root
- **MYSQL_DATABASE** - Thường là railway

### **2. Ưu tiên copy MYSQL_URL:**
```
MYSQL_URL sẽ có format:
mysql://root:password@containers-us-west-xxx.railway.app:3306/railway

Ví dụ:
mysql://root:abc123xyz789@containers-us-west-456.railway.app:3306/railway
```

### **3. Lưu vào notepad:**
Copy toàn bộ MYSQL_URL value và paste vào notepad để backup.

## Lưu ý quan trọng

⚠️ **Free tier limitations**:

- 500 hours/month (khoảng 20 ngày)
- 1GB storage
- Shared CPU/RAM

⚠️ **Security**:

- Không commit .env file lên GitHub
- Dùng different passwords cho production
- Enable 2FA cho Railway account

💡 **Tips**:

- Railway tự động backup database
- Có thể upgrade to paid plan nếu cần
- Support multiple environments (dev/staging/prod)

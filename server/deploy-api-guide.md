# Hướng Dẫn Triển Khai API lên Web Online

## 1. Lựa chọn dịch vụ hosting

Có nhiều dịch vụ hosting có thể sử dụng để triển khai API của bạn:

### Dịch vụ miễn phí hoặc chi phí thấp:

- **Render**: Miễn phí cho các web service cơ bản.
- **Railway**: Free tier giới hạn.
- **Fly.io**: Free tier tốt.
- **Heroku**: Có free tier giới hạn.

### Dịch vụ đám mây chuyên nghiệp:

- **AWS (Amazon Web Services)**: EC2, Elastic Beanstalk, Lambda + API Gateway
- **Microsoft Azure**: App Service
- **Google Cloud Platform**: Cloud Run, App Engine
- **Digital Ocean**: Droplets hoặc App Platform

### Đề xuất tốt nhất cho sinh viên:

- **Render** hoặc **Railway** cho triển khai đơn giản
- **AWS (với free tier của sinh viên)** cho hệ thống lớn hơn

## 2. Cơ sở dữ liệu MySQL Online

Bạn cần một dịch vụ MySQL trực tuyến:

### Các lựa chọn phổ biến:

- **PlanetScale**: Có free tier rất tốt
- **AWS RDS**: Dịch vụ cơ sở dữ liệu quan hệ của Amazon
- **Google Cloud SQL**: Dịch vụ MySQL được quản lý của Google
- **Azure Database for MySQL**: Dịch vụ MySQL của Microsoft
- **DigitalOcean Managed MySQL**: Chi phí phải chăng và dễ cấu hình

### Miễn phí hoặc chi phí thấp:

- **PlanetScale**: Free tier với giới hạn hợp lý
- **ElephantSQL**: Có tier miễn phí (PostgreSQL)
- **Supabase**: Có free tier (PostgreSQL)

## 3. Điều chỉnh cấu hình dự án

### Quản lý biến môi trường:

Tạo tệp `.env` để lưu các thông tin nhạy cảm và cấu hình:

```
PORT=5000
NODE_ENV=production

# Database
DB_HOST=your-db-host.com
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=quit_smoking_app
DB_PORT=3306

# JWT
JWT_SECRET=your-production-jwt-secret-key
JWT_EXPIRES_IN=30d

# Frontend URL
CORS_ORIGIN=https://your-frontend-domain.com
```

### Cập nhật kết nối cơ sở dữ liệu:

Sửa file `api-server-jwt.cjs`:

```javascript
// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: true,
        }
      : undefined,
});
```

### Cập nhật CORS để chấp nhận domain chính thức:

```javascript
// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5175",
      "http://localhost:5176",
      process.env.CORS_ORIGIN,
    ],
    credentials: true,
  })
);
```

## 4. Chuẩn bị cho triển khai

### Tạo file Procfile (nếu dùng Heroku):

```
web: node backend/api-server-jwt.cjs
```

### Tạo script start trong package.json (thư mục backend):

```json
{
  "scripts": {
    "start": "node api-server-jwt.cjs",
    "dev": "nodemon api-server-jwt.cjs"
  }
}
```

### Thêm cấu hình engines trong package.json:

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 5. Kết nối Frontend với API

Sửa file apiService.js:

```javascript
import axios from "axios";

// Lấy API URL từ biến môi trường hoặc sử dụng giá trị mặc định
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://your-api-url.com";

// Tạo instance axios với cấu hình mặc định
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ... Rest of the file remains the same
```

Tạo file `.env.production` trong thư mục gốc dự án Frontend:

```
VITE_API_URL=https://your-api-url.com
```

## 6. Triển khai dự án

### Triển khai Backend API:

#### Với Render:

1. Tạo tài khoản trên Render.com
2. Tạo Web Service mới
3. Kết nối với repository GitHub
4. Cấu hình:
   - Build Command: `npm install`
   - Start Command: `node backend/api-server-jwt.cjs`
5. Thêm các biến môi trường như mô tả trong phần 3
6. Deploy

#### Với Railway:

1. Tạo tài khoản Railway
2. Tạo dự án mới
3. Kết nối với repository GitHub
4. Cấu hình:
   - Root Directory: `backend`
   - Start Command: `node api-server-jwt.cjs`
5. Thêm các biến môi trường
6. Deploy

### Triển khai Frontend:

1. Xây dựng dự án: `npm run build`
2. Triển khai lên dịch vụ hosting tĩnh như Netlify, Vercel, GitHub Pages hoặc Firebase Hosting

## 7. Theo dõi và bảo trì

### Công cụ giám sát:

- **Sentry.io**: Theo dõi lỗi (có free tier)
- **LogRocket**: Phân tích trải nghiệm người dùng
- **UptimeRobot**: Theo dõi thời gian uptime của API

### Bảo mật:

- Đảm bảo dùng HTTPS cho API
- Luân chuyển JWT_SECRET định kỳ
- Cân nhắc thêm rate limiting để ngăn tấn công DDoS

## 8. Tối ưu hóa hiệu năng

### Caching:

Thêm Redis hoặc Memcached để cache dữ liệu phổ biến

```javascript
// Ví dụ với Redis
const redis = require("redis");
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

// Trong route handler
app.get("/api/popular-data", async (req, res) => {
  // Kiểm tra cache trước
  const cachedData = await client.get("popular-data");
  if (cachedData) {
    return res.json(JSON.parse(cachedData));
  }

  // Nếu không có trong cache, lấy từ database
  const [rows] = await pool.query("SELECT * FROM popular_table");

  // Lưu vào cache với thời gian hết hạn là 1 giờ
  await client.set("popular-data", JSON.stringify(rows), "EX", 3600);

  res.json(rows);
});
```

### Load balancing:

Cân nhắc dùng Nginx hoặc dịch vụ có sẵn của nhà cung cấp hosting để phân phối tải

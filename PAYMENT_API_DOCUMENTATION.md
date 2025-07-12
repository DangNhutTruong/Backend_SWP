# Payment & Membership APIs Documentation

## 📦 Package APIs

### 1. Get All Packages
```http
GET /api/packages
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Free",
      "type": "free",
      "description": "Gói miễn phí với tính năng cơ bản",
      "price": 0,
      "duration_days": 30,
      "features": ["daily_tracking", "basic_plan"],
      "is_active": true,
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "message": "Packages retrieved successfully"
}
```

### 2. Get Package by ID
```http
GET /api/packages/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Premium",
    "type": "premium",
    "price": 99000,
    "features": ["daily_tracking", "personal_plan", "community_access", "coach_chat"]
  },
  "message": "Package retrieved successfully"
}
```

### 3. Purchase Package
```http
POST /api/packages/purchase
Authorization: Bearer <token>
Content-Type: application/json

{
  "package_id": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": 123,
    "package": {
      "id": 2,
      "name": "Premium",
      "price": 99000
    },
    "amount": 99000,
    "tx_content": "UPGRADEPREMIUM12345678ABCD",
    "qr_code_url": "https://img.vietqr.io/image/VCB-1234567890-compact2.jpg?amount=99000&addInfo=UPGRADEPREMIUM12345678ABCD",
    "bank_info": {
      "bank_name": "Vietcombank",
      "account_number": "1234567890",
      "account_name": "NOUPGRADE PAYMENT",
      "content": "UPGRADEPREMIUM12345678ABCD"
    }
  },
  "message": "Payment created successfully. Please transfer money and wait for verification."
}
```

### 4. Get User Current Membership
```http
GET /api/packages/user/current
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_membership": "premium",
    "start_date": "2025-01-01T00:00:00.000Z",
    "end_date": "2025-01-31T00:00:00.000Z",
    "is_expired": false,
    "package_info": {
      "id": 2,
      "name": "Premium",
      "features": ["daily_tracking", "coach_chat"]
    }
  },
  "message": "Current membership retrieved successfully"
}
```

### 5. Get User Package History
```http
GET /api/packages/user/history
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "package_name": "Premium",
      "amount": 99000,
      "status": "completed",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "message": "User package history retrieved successfully"
}
```

## 💳 Payment APIs

### 1. Create Payment
```http
POST /api/payments/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "package_id": 2,
  "method": "bank_transfer"
}
```

### 2. Verify Payment
```http
POST /api/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_id": 123
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "payment_id": 123,
    "status": "completed",
    "verified_at": "2025-01-01T12:00:00.000Z"
  },
  "message": "Payment verified and membership updated successfully"
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "data": {
    "payment_id": 123,
    "status": "pending"
  },
  "message": "Payment not found in bank records yet. Please try again later."
}
```

### 3. Get Payment History
```http
GET /api/payments/user/history?status=completed&limit=10&offset=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": 123,
        "package_name": "Premium",
        "amount": 99000,
        "method": "bank_transfer",
        "status": "completed",
        "tx_content": "UPGRADEPREMIUM12345678ABCD",
        "verified_at": "2025-01-01T12:00:00.000Z",
        "created_at": "2025-01-01T10:00:00.000Z"
      }
    ],
    "total": 5,
    "limit": 10,
    "offset": 0
  },
  "message": "Payment history retrieved successfully"
}
```

### 4. Get Payment by ID
```http
GET /api/payments/123
Authorization: Bearer <token>
```

### 5. Refund Payment
```http
POST /api/payments/123/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "User requested refund"
}
```

### 6. Get Pending Payments (Admin Only)
```http
GET /api/payments/admin/pending
Authorization: Bearer <admin_token>
```

## 🔧 Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Package not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

## 🔄 Payment Flow

1. **Client:** Gọi `POST /api/packages/purchase` với `package_id`
2. **Server:** Tạo payment record với status `pending`, sinh QR code
3. **Client:** Hiển thị QR code cho user chuyển khoản
4. **User:** Chuyển khoản với nội dung `tx_content` chính xác
5. **Client:** Ping `POST /api/payments/verify` để kiểm tra
6. **Server:** Dùng Python script check MBBank API
7. **Server:** Nếu tìm thấy giao dịch khớp → cập nhật membership

## 🏦 Bank Transfer Info

- **Bank:** Vietcombank (VCB)
- **Account Number:** `process.env.BANK_ACCOUNT_NUMBER`
- **Account Name:** NOUPGRADE PAYMENT
- **Content:** Exactly as provided in `tx_content`

## 🔐 Authentication

All protected routes require `Authorization: Bearer <jwt_token>` header.

## 📝 Notes

- QR codes are generated using VietQR API
- Payment verification will be implemented with Python MBBank script
- All monetary amounts are in VND
- Membership duration is calculated from purchase date

# Daily Check-in APIs Documentation

## Overview

Daily Check-in APIs cho phép users ghi lại tiến trình cai thuốc hàng ngày, bao gồm mood, cravings, activities và thống kê.

## Base URL

`http://localhost:5000/api/daily-checkins`

## Authentication

Tất cả endpoints đều yêu cầu JWT token trong header:

```
Authorization: Bearer <your-jwt-token>
```

---

## API Endpoints

### 1. Create Daily Check-in

**POST** `/api/daily-checkins`

Tạo check-in mới cho ngày hôm nay.

**Request Body:**

```json
{
  "mood_rating": 4,
  "craving_level": 2,
  "cigarettes_avoided": 5,
  "money_saved": 25000,
  "notes": "Had a great day! Felt some cravings after lunch but used breathing exercises.",
  "activities_done": ["exercise", "meditation", "reading"],
  "triggers_faced": ["stress", "social_pressure"],
  "coping_strategies_used": ["deep_breathing", "chewing_gum"],
  "is_smoke_free": true,
  "health_improvements": ["better_breathing", "improved_taste"],
  "motivation_level": 5,
  "checkin_time": "20:30:00"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Daily check-in created successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "checkin_date": "2025-07-08",
    "mood_rating": 4,
    "craving_level": 2,
    "cigarettes_avoided": 5,
    "money_saved": "25000.00",
    "notes": "Had a great day!...",
    "activities_done": ["exercise", "meditation", "reading"],
    "triggers_faced": ["stress", "social_pressure"],
    "coping_strategies_used": ["deep_breathing", "chewing_gum"],
    "is_smoke_free": true,
    "streak_count": 15,
    "health_improvements": ["better_breathing", "improved_taste"],
    "motivation_level": 5,
    "checkin_time": "20:30:00",
    "created_at": "2025-07-08T20:30:00.000Z",
    "updated_at": "2025-07-08T20:30:00.000Z"
  }
}
```

---

### 2. Get Daily Check-ins

**GET** `/api/daily-checkins`

Lấy danh sách check-ins của user với pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 30)
- `start_date` (optional): Start date filter (YYYY-MM-DD)
- `end_date` (optional): End date filter (YYYY-MM-DD)

**Example:** `GET /api/daily-checkins?page=1&limit=10&start_date=2025-07-01&end_date=2025-07-08`

**Response:**

```json
{
  "success": true,
  "data": {
    "checkins": [
      {
        "id": 1,
        "user_id": 123,
        "checkin_date": "2025-07-08",
        "mood_rating": 4,
        "craving_level": 2,
        "is_smoke_free": true,
        "streak_count": 15,
        "money_saved": "25000.00",
        "created_at": "2025-07-08T20:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### 3. Get Today's Check-in

**GET** `/api/daily-checkins/today`

Lấy check-in của ngày hôm nay.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 123,
    "checkin_date": "2025-07-08",
    "mood_rating": 4,
    "craving_level": 2,
    "cigarettes_avoided": 5,
    "money_saved": "25000.00",
    "notes": "Had a great day!...",
    "activities_done": ["exercise", "meditation"],
    "is_smoke_free": true,
    "streak_count": 15,
    "checkin_time": "20:30:00",
    "created_at": "2025-07-08T20:30:00.000Z",
    "updated_at": "2025-07-08T20:30:00.000Z"
  }
}
```

---

### 4. Update Today's Check-in

**PUT** `/api/daily-checkins/today`

Cập nhật check-in của ngày hôm nay.

**Request Body:**

```json
{
  "mood_rating": 5,
  "craving_level": 1,
  "notes": "Updated: Evening went even better!",
  "motivation_level": 5
}
```

**Response:**

```json
{
  "success": true,
  "message": "Daily check-in updated successfully",
  "data": {
    "id": 1,
    "user_id": 123,
    "checkin_date": "2025-07-08",
    "mood_rating": 5,
    "craving_level": 1,
    "notes": "Updated: Evening went even better!",
    "motivation_level": 5,
    "updated_at": "2025-07-08T22:15:00.000Z"
  }
}
```

---

### 5. Get Check-in Statistics

**GET** `/api/daily-checkins/stats`

Lấy thống kê check-ins trong khoảng thời gian.

**Query Parameters:**

- `days` (optional): Number of days to analyze (default: 30)

**Example:** `GET /api/daily-checkins/stats?days=7`

**Response:**

```json
{
  "success": true,
  "data": {
    "period_days": 7,
    "total_checkins": 7,
    "smoke_free_days": 6,
    "current_streak": 15,
    "success_rate": 86,
    "total_money_saved": 175000,
    "total_cigarettes_avoided": 35,
    "average_mood_rating": 4.2,
    "average_craving_level": 2.1,
    "checkins": [
      {
        "id": 1,
        "checkin_date": "2025-07-08",
        "mood_rating": 4,
        "craving_level": 2,
        "is_smoke_free": true,
        "streak_count": 15
      }
    ]
  }
}
```

---

### 6. Delete Check-in

**DELETE** `/api/daily-checkins/:date`

Xóa check-in của ngày cụ thể.

**URL Parameters:**

- `date`: Date in YYYY-MM-DD format

**Example:** `DELETE /api/daily-checkins/2025-07-07`

**Response:**

```json
{
  "success": true,
  "message": "Check-in deleted successfully"
}
```

---

## Data Types & Validation

### Mood Rating (1-5)

- 1: Very Bad 😢
- 2: Bad 😕
- 3: Neutral 😐
- 4: Good 😊
- 5: Excellent 😃

### Craving Level (1-5)

- 1: No craving
- 2: Mild craving
- 3: Moderate craving
- 4: Strong craving
- 5: Very strong craving

### Motivation Level (1-5)

- 1: Very low motivation
- 2: Low motivation
- 3: Moderate motivation
- 4: High motivation
- 5: Very high motivation

### Common Activities

```json
[
  "exercise",
  "meditation",
  "reading",
  "walking",
  "music",
  "gaming",
  "cooking",
  "socializing",
  "work",
  "hobbies",
  "breathing_exercises"
]
```

### Common Triggers

```json
[
  "stress",
  "alcohol",
  "social_pressure",
  "boredom",
  "work_pressure",
  "relationship_issues",
  "traffic",
  "morning_coffee",
  "after_meals",
  "phone_calls"
]
```

### Common Coping Strategies

```json
[
  "deep_breathing",
  "chewing_gum",
  "drink_water",
  "exercise",
  "call_friend",
  "distraction",
  "meditation",
  "positive_self_talk",
  "hobby_activity"
]
```

### Health Improvements

```json
[
  "better_breathing",
  "improved_taste",
  "improved_smell",
  "more_energy",
  "better_sleep",
  "clearer_skin",
  "reduced_cough",
  "whiter_teeth",
  "fresh_breath"
]
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "You have already checked in today. Use PUT to update your check-in."
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "No check-in found for today"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to create daily check-in",
  "error": "Database connection error"
}
```

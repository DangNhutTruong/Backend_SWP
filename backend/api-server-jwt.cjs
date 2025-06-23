console.log('🚀 Khởi động Backend API Server với MySQL và JWT...');

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-super-secret-jwt-key-for-quit-smoking-app-2025';

// Middleware
app.use(cors());
app.use(express.json());

console.log('✅ Setup middleware thành công');

// MySQL connection pool
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '12345',
  database: 'SmokingCessationDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test MySQL connection
(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ MySQL kết nối thành công!');
    
    // Kiểm tra và thêm dữ liệu mẫu nếu cần thiết
    try {
      await insertSampleDataIfNeeded();
      console.log('✅ Đã kiểm tra và thêm dữ liệu mẫu (nếu cần)');
    } catch (sampleError) {
      console.error('❌ Lỗi khi thêm dữ liệu mẫu:', sampleError.message);
    }
  } catch (error) {
    console.error('❌ MySQL kết nối thất bại:', error.message);
  }
})();

// Hàm thêm dữ liệu mẫu nếu chưa có
async function insertSampleDataIfNeeded() {
  // Kiểm tra xem đã có dữ liệu trong các bảng chưa
  const [userCount] = await pool.query('SELECT COUNT(*) as count FROM User');
  const [planCount] = await pool.query('SELECT COUNT(*) as count FROM QuitSmokingPlan');
  const [appointmentCount] = await pool.query('SELECT COUNT(*) as count FROM Appointment');
  
  if (userCount[0].count > 0 && planCount[0].count > 0 && appointmentCount[0].count > 0) {
    console.log('Đã có dữ liệu trong cơ sở dữ liệu, không cần thêm dữ liệu mẫu');
    return;
  }
  
  console.log('Thêm dữ liệu mẫu vào cơ sở dữ liệu để test...');
  
  // Đảm bảo đã có Role
  await pool.query(`
    INSERT IGNORE INTO Role (RoleID, RoleName, Description)
    VALUES 
    (1, 'Admin', 'Administrator with full access'),
    (2, 'Coach', 'Smoking cessation coach'),
    (3, 'Smoker', 'Regular user trying to quit')
  `);
  
  // Thêm người dùng mẫu nếu chưa có
  if (userCount[0].count === 0) {
    // Mật khẩu mẫu: 12345
    const hashedPassword = await bcrypt.hash('12345', 10);
    
    await pool.query(`
      INSERT INTO User (Name, Email, Password, Age, Gender, Phone, RoleID, Membership, IsActive, RegisterDate)
      VALUES 
      ('Admin User', 'admin@nosmoke.com', ?, 35, 'Male', '0901234567', 1, 'premium', 1, NOW()),
      ('Coach Example', 'coach@nosmoke.com', ?, 42, 'Female', '0909876543', 2, 'premium', 1, NOW()),
      ('Test User', 'user@nosmoke.com', ?, 28, 'Male', '0912345678', 3, 'free', 1, NOW())
    `, [hashedPassword, hashedPassword, hashedPassword]);
    
    console.log('✅ Đã thêm người dùng mẫu');
  }
  
  // Thêm kế hoạch cai thuốc nếu chưa có
  if (planCount[0].count === 0) {
    await pool.query(`
      INSERT INTO QuitSmokingPlan (UserID, Title, Reason, StartDate, ExpectedQuitDate, Description, Status, SuccessRate)
      VALUES 
      (3, 'Kế hoạch cai thuốc 30 ngày', 'Vì sức khỏe và gia đình', CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'Kế hoạch từng bước giảm số điếu thuốc hút mỗi ngày trong 30 ngày', 'In Progress', 0),
      (3, 'Kế hoạch ngừng đột ngột', 'Bác sĩ khuyên nghị', DATE_SUB(CURRENT_DATE, INTERVAL 15 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 'Dừng hút thuốc hoàn toàn từ ngày đầu tiên', 'In Progress', 50)
    `);
    
    console.log('✅ Đã thêm kế hoạch cai thuốc mẫu');
  }
  
  // Thêm dữ liệu theo dõi tiến trình
  const [progressCount] = await pool.query('SELECT COUNT(*) as count FROM ProgressTracking');
  if (progressCount[0].count === 0) {
    await pool.query(`
      INSERT INTO ProgressTracking (PlanID, TrackingDate, Status, Note, CravingLevel)
      VALUES 
      (1, CURRENT_DATE, 'Good', 'Ngày đầu tiên thực hiện kế hoạch, giảm được 3 điếu thuốc', 7),
      (1, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), 'Neutral', 'Cảm giác thèm thuốc khá mạnh nhưng có thể kiểm soát', 8),
      (2, CURRENT_DATE, 'Struggling', 'Cảm thấy khó khăn khi ngừng đột ngột', 9)
    `);
    
    console.log('✅ Đã thêm dữ liệu tiến trình mẫu');
  }
  
  // Thêm booking và appointment nếu chưa có
  if (appointmentCount[0].count === 0) {
    // Thêm booking
    const [bookingResult] = await pool.query(`
      INSERT INTO Booking (UserID, CoachUserID, BookingDate, Status)
      VALUES (3, 2, NOW(), 'Approved')
    `);
    
    // Thêm appointment
    await pool.query(`
      INSERT INTO Appointment (BookingID, AppointmentDate, DurationMinutes, Location, Notes, Status)
      VALUES (?, DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), 60, 'Online Meeting', 'Buổi tư vấn đầu tiên về kế hoạch cai thuốc', 'Scheduled')
    `, [bookingResult.insertId]);
    
    console.log('✅ Đã thêm booking và appointment mẫu');
  }
}

// JWT Middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có token, quyền truy cập bị từ chối'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

// ====== ROOT ROUTES ======

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Quit Smoking Backend API với JWT',
    version: '1.0.0',
    endpoints: [
      'GET / - API info',
      'GET /health - Health check',
      'POST /api/auth/register - Đăng ký',
      'POST /api/auth/login - Đăng nhập',
      'GET /api/users - Danh sách người dùng',
      'GET /api/users/:id - Chi tiết người dùng',
      'GET /api/plans - Danh sách kế hoạch',
      'POST /api/plans - Tạo kế hoạch mới',
      'GET /api/appointments - Danh sách cuộc hẹn',
      'POST /api/appointments - Tạo cuộc hẹn',
      'GET /api/progress/:userId - Tiến trình người dùng',
      'POST /api/progress - Cập nhật tiến trình'
    ]
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      message: 'Server và database hoạt động tốt!',
      database: 'MySQL connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message
    });
  }
});

// ====== AUTH ROUTES ======

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, age, gender, phone } = req.body;
    
    // Check if user exists
    const [existingUsers] = await pool.query('SELECT Email FROM User WHERE Email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Get Smoker role ID
    const [roles] = await pool.query('SELECT RoleID FROM Role WHERE RoleName = "Smoker"');
    const roleId = roles[0]?.RoleID || 3;
    
    // Insert user
    const [result] = await pool.query(`
      INSERT INTO User (Name, Email, Password, Age, Gender, Phone, RoleID, Membership, IsActive, RegisterDate) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'free', 1, NOW())
    `, [name, email, hashedPassword, age || null, gender || null, phone || null, roleId]);
    
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng ký',
      error: error.message
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await pool.query(`
      SELECT u.UserID, u.Name, u.Email, u.Password, u.Membership, r.RoleName
      FROM User u
      JOIN Role r ON u.RoleID = r.RoleID
      WHERE u.Email = ? AND u.IsActive = 1
    `, [email]);
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }
    
    const user = users[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.Password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.UserID, 
        email: user.Email, 
        role: user.RoleName,
        membership: user.Membership 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Update last login
    await pool.query('UPDATE User SET LastLogin = NOW() WHERE UserID = ?', [user.UserID]);
    
    // Remove password from response
    delete user.Password;
    
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token: token,
      user: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập',
      error: error.message
    });
  }
});

// ====== USER ROUTES ======

// DEBUG endpoint - Get all users (no auth required - only for testing)
app.get('/api/users/debug/all', async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.UserID, u.Name, u.Email, u.Age, u.Gender, u.Phone, 
             u.RegisterDate, u.Membership, u.IsActive, r.RoleName 
      FROM User u
      JOIN Role r ON u.RoleID = r.RoleID
      ORDER BY u.RegisterDate DESC
    `);
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách người dùng',
      error: error.message
    });
  }
});

// Get all users (protected)
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.UserID, u.Name, u.Email, u.Age, u.Gender, u.Phone, 
             u.RegisterDate, u.Membership, u.IsActive, r.RoleName 
      FROM User u
      JOIN Role r ON u.RoleID = r.RoleID
      WHERE u.IsActive = 1
      ORDER BY u.RegisterDate DESC
    `);
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách người dùng',
      error: error.message
    });
  }
});

// Get user by ID (protected)
app.get('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.query(`
      SELECT u.UserID, u.Name, u.Email, u.Age, u.Gender, u.Phone, 
             u.Address, u.RegisterDate, u.Membership, r.RoleName 
      FROM User u
      JOIN Role r ON u.RoleID = r.RoleID
      WHERE u.UserID = ? AND u.IsActive = 1
    `, [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin người dùng',
      error: error.message
    });
  }
});

// Get current user from token (protected)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [users] = await pool.query(`
      SELECT u.UserID, u.Name, u.Email, u.Age, u.Gender, u.Phone, 
             u.Address, u.RegisterDate, u.Membership, r.RoleName 
      FROM User u
      JOIN Role r ON u.RoleID = r.RoleID
      WHERE u.UserID = ? AND u.IsActive = 1
    `, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin người dùng hiện tại',
      error: error.message
    });
  }
});

// Update user information (protected)
app.put('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Đảm bảo người dùng chỉ có thể cập nhật thông tin của chính họ hoặc là admin
    if (parseInt(id) !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông tin của người dùng khác'
      });
    }
    
    // Extract updatable fields
    const { name, age, gender, phone, address, membership } = req.body;
    
    // Validate membership if provided
    if (membership && !['free', 'premium', 'pro'].includes(membership)) {
      return res.status(400).json({
        success: false,
        message: 'Membership không hợp lệ'
      });
    }
    
    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('Name = ?');
      updateValues.push(name);
    }
    
    if (age !== undefined) {
      updateFields.push('Age = ?');
      updateValues.push(age);
    }
    
    if (gender !== undefined) {
      updateFields.push('Gender = ?');
      updateValues.push(gender);
    }
    
    if (phone !== undefined) {
      updateFields.push('Phone = ?');
      updateValues.push(phone);
    }
    
    if (address !== undefined) {
      updateFields.push('Address = ?');
      updateValues.push(address);
    }
    
    if (membership !== undefined) {
      updateFields.push('Membership = ?');
      updateValues.push(membership);
    }
    
    // Exit if nothing to update
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có trường nào được cập nhật'
      });
    }
    
    // Complete the query
    const updateQuery = `
      UPDATE User 
      SET ${updateFields.join(', ')} 
      WHERE UserID = ?
    `;
    
    // Execute the update
    await pool.query(updateQuery, [...updateValues, id]);
    
    // Get updated user info
    const [updatedUsers] = await pool.query(`
      SELECT UserID, Name, Email, Age, Gender, Phone, Address, Membership, RegisterDate
      FROM User
      WHERE UserID = ?
    `, [id]);
    
    if (updatedUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng sau khi cập nhật'
      });
    }
    
    res.json({
      success: true,
      message: 'Cập nhật thông tin người dùng thành công',
      data: updatedUsers[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông tin người dùng',
      error: error.message
    });
  }
});

// ====== QUIT PLAN ROUTES ======

// Get all quit plans
app.get('/api/plans', async (req, res) => {
  try {
    const [plans] = await pool.query(`
      SELECT qsp.PlanID, qsp.Title, qsp.Reason, qsp.StartDate, qsp.ExpectedQuitDate,
             qsp.Description, qsp.Status, qsp.SuccessRate, u.Name as CreatorName
      FROM QuitSmokingPlan qsp
      LEFT JOIN User u ON qsp.UserID = u.UserID
      ORDER BY qsp.StartDate DESC
    `);
    
    res.json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách kế hoạch',
      error: error.message
    });
  }
});

// Create new quit plan (protected)
app.post('/api/plans', verifyToken, async (req, res) => {
  try {
    const { title, reason, startDate, expectedQuitDate, description } = req.body;
    const userId = req.user.userId;
    
    const [result] = await pool.query(`
      INSERT INTO QuitSmokingPlan (UserID, Title, Reason, StartDate, ExpectedQuitDate, Description, Status)
      VALUES (?, ?, ?, ?, ?, ?, 'In Progress')
    `, [userId, title, reason, startDate, expectedQuitDate, description]);
    
    res.status(201).json({
      success: true,
      message: 'Tạo kế hoạch thành công',
      planId: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo kế hoạch',
      error: error.message
    });
  }
});

// ====== APPOINTMENT ROUTES ======

// Get appointments (protected)
app.get('/api/appointments', verifyToken, async (req, res) => {
  try {
    const [appointments] = await pool.query(`
      SELECT a.AppointmentID, a.AppointmentDate, a.DurationMinutes, a.Location, a.Notes, a.Status,
             b.BookingID, u.Name as UserName, c.Name as CoachName
      FROM Appointment a
      JOIN Booking b ON a.BookingID = b.BookingID
      JOIN User u ON b.UserID = u.UserID
      JOIN User c ON b.CoachUserID = c.UserID
      ORDER BY a.AppointmentDate DESC
    `);
    
    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách cuộc hẹn',
      error: error.message
    });
  }
});

// Create appointment (protected)
app.post('/api/appointments', verifyToken, async (req, res) => {
  try {
    const { coachId, appointmentDate, duration, location, notes } = req.body;
    const userId = req.user.userId;
    
    // First create a booking
    const [bookingResult] = await pool.query(`
      INSERT INTO Booking (UserID, CoachUserID, BookingDate, Status)
      VALUES (?, ?, NOW(), 'Approved')
    `, [userId, coachId]);
    
    // Then create the appointment
    const [appointmentResult] = await pool.query(`
      INSERT INTO Appointment (BookingID, AppointmentDate, DurationMinutes, Location, Notes, Status)
      VALUES (?, ?, ?, ?, ?, 'Scheduled')
    `, [bookingResult.insertId, appointmentDate, duration || 30, location || 'Online Meeting', notes]);
    
    res.status(201).json({
      success: true,
      message: 'Tạo cuộc hẹn thành công',
      appointmentId: appointmentResult.insertId,
      bookingId: bookingResult.insertId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo cuộc hẹn',
      error: error.message
    });
  }
});

// ====== PROGRESS ROUTES ======

// Get all progress entries 
app.get('/api/progress', async (req, res) => {
  try {
    const [progressEntries] = await pool.query(`
      SELECT pt.TrackingID, pt.PlanID, pt.TrackingDate, pt.Status, pt.Note, pt.CravingLevel,
             qsp.Title as PlanTitle, u.Name as UserName
      FROM ProgressTracking pt
      JOIN QuitSmokingPlan qsp ON pt.PlanID = qsp.PlanID
      JOIN User u ON qsp.UserID = u.UserID
      ORDER BY pt.TrackingDate DESC
      LIMIT 30
    `);
    
    res.json({
      success: true,
      count: progressEntries.length,
      data: progressEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy dữ liệu tiến trình',
      error: error.message
    });
  }
});

// Get user progress (protected)
app.get('/api/progress/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Lấy các QuitSmokingPlan của người dùng
    const [plans] = await pool.query(`
      SELECT PlanID FROM QuitSmokingPlan WHERE UserID = ?
    `, [userId]);
    
    if (plans.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // Lấy tất cả các TrackingID cho tất cả các plans của người dùng
    const planIds = plans.map(plan => plan.PlanID);
    const placeholders = planIds.map(() => '?').join(',');
    
    const [progressEntries] = await pool.query(`
      SELECT pt.TrackingID, pt.PlanID, pt.TrackingDate, pt.Status, pt.Note, pt.CravingLevel,
             qsp.Title as PlanTitle
      FROM ProgressTracking pt
      JOIN QuitSmokingPlan qsp ON pt.PlanID = qsp.PlanID
      WHERE pt.PlanID IN (${placeholders})
      ORDER BY pt.TrackingDate DESC
      LIMIT 30
    `, [...planIds]);
    
    res.json({
      success: true,
      count: progressEntries.length,
      data: progressEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy tiến trình',
      error: error.message
    });
  }
});

// Add progress entry (protected)
app.post('/api/progress', verifyToken, async (req, res) => {
  try {
    console.log('POST /api/progress - Request body:', req.body);
    console.log('User from token:', req.user);

    const { planId, status, note, cravingLevel } = req.body;
    const userId = req.user.userId;
    
    // Validate required fields
    if (!planId || !status) {
      return res.status(400).json({
        success: false,
        message: 'PlanId và status là bắt buộc'
      });
    }

    // Validate craving level
    if (cravingLevel !== undefined && (cravingLevel < 0 || cravingLevel > 10)) {
      return res.status(400).json({
        success: false,
        message: 'CravingLevel phải từ 0 đến 10'
      });
    }
    
    // DEBUG: Hiển thị tất cả kế hoạch trong database
    const [allPlans] = await pool.query(`SELECT PlanID, UserID FROM QuitSmokingPlan`);
    console.log('All plans in database:', allPlans);
    
    // Kiểm tra xem kế hoạch có tồn tại không
    const [plans] = await pool.query(`
      SELECT PlanID, UserID FROM QuitSmokingPlan 
      WHERE PlanID = ?
    `, [planId]);
    
    console.log('Found plans matching ID:', plans);
    
    if (plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kế hoạch với ID này'
      });
    }

    // Kiểm tra xem kế hoạch có thuộc user không
    if (parseInt(plans[0].UserID) !== parseInt(userId)) {
      console.log(`Plan owner ID (${plans[0].UserID}) does not match user ID (${userId})`);
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật tiến trình cho kế hoạch này'
      });
    }
    
    const [result] = await pool.query(`
      INSERT INTO ProgressTracking (PlanID, TrackingDate, Status, Note, CravingLevel)
      VALUES (?, CURRENT_DATE, ?, ?, ?)
    `, [planId, status, note || null, cravingLevel || null]);
    
    console.log('Progress tracking created:', result);
    
    res.status(201).json({
      success: true,
      message: 'Cập nhật tiến trình thành công',
      trackingId: result.insertId
    });
  } catch (error) {
    console.error('Progress tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật tiến trình',
      error: error.message
    });
  }
});

// Test progress entry (no auth required - for testing)
app.post('/api/progress/test', async (req, res) => {
  try {
    const { planId, status, note, cravingLevel } = req.body;
    console.log('POST /api/progress/test - Request body:', req.body);

    // Validate required fields
    if (!planId || !status) {
      return res.status(400).json({
        success: false,
        message: 'PlanId và status là bắt buộc'
      });
    }
    
    // Kiểm tra xem kế hoạch có tồn tại không
    const [plans] = await pool.query(`
      SELECT PlanID, UserID FROM QuitSmokingPlan 
      WHERE PlanID = ?
    `, [planId]);
    
    console.log('Found plans for test:', plans);
    
    if (plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kế hoạch với ID này'
      });
    }
    
    const [result] = await pool.query(`
      INSERT INTO ProgressTracking (PlanID, TrackingDate, Status, Note, CravingLevel)
      VALUES (?, CURRENT_DATE, ?, ?, ?)
    `, [planId, status, note || null, cravingLevel || null]);
    
    res.status(201).json({
      success: true,
      message: 'Cập nhật tiến trình thành công (test)',
      trackingId: result.insertId
    });
  } catch (error) {
    console.error('Test progress tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật tiến trình (test)',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Backend API Server với JWT đang chạy!
📍 Port: ${PORT}
🌐 URL: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
🔐 Auth: http://localhost:${PORT}/api/auth/login
👥 Users: http://localhost:${PORT}/api/users
📋 Plans: http://localhost:${PORT}/api/plans
📅 Appointments: http://localhost:${PORT}/api/appointments
📈 Progress: http://localhost:${PORT}/api/progress/:userId
  `);
});

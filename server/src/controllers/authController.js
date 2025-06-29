import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      gender,
      phone,
      address,
      cigarettesPerDay,
      costPerPack,
      cigarettesPerPack
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc (tên, email, mật khẩu)'
      });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Kiểm tra độ mạnh password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Tạo user mới
    const userData = {
      Name: name.trim(),
      Email: email.toLowerCase().trim(),
      Password: password,
      Age: age ? parseInt(age) : null,
      Gender: gender,
      Phone: phone,
      Address: address,
      CigarettesPerDay: cigarettesPerDay ? parseInt(cigarettesPerDay) : null,
      CostPerPack: costPerPack ? parseFloat(costPerPack) : null,
      CigarettesPerPack: cigarettesPerPack ? parseInt(cigarettesPerPack) : 20,
      StartDate: cigarettesPerDay ? new Date() : null,
      DaysWithoutSmoking: 0,
      Membership: 'free',
      EmailVerificationToken: crypto.randomBytes(32).toString('hex')
    };

    const user = await User.create(userData);

    // Tạo JWT token
    const token = generateToken(user.UserID);

    // Cập nhật thông tin login
    await user.updateLoginInfo();

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        userId: user.UserID,
        user: user.toJSON(),
        token,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    
    // Xử lý lỗi validation của Sequelize
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: messages
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký'
    });
  }
};

// @desc    Đăng nhập user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Kiểm tra thông tin đầu vào
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm user theo email
    const user = await User.findByEmail(email);
    
    if (!user || !user.IsActive) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra password
    const isPasswordCorrect = await user.matchPassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Tạo JWT token
    const token = generateToken(user.UserID);

    // Cập nhật thông tin login
    await user.updateLoginInfo();

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: user.toJSON(),
        token,
        expiresIn: rememberMe ? '30d' : (process.env.JWT_EXPIRE || '7d')
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập'
    });
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    // req.user đã được set trong auth middleware
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user'
    });
  }
};

// @desc    Cập nhật thông tin user
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.UserID;
    const allowedUpdates = [
      'Name',
      'Age',
      'Gender',
      'Phone',
      'Address',
      'CigarettesPerDay',
      'CostPerPack',
      'CigarettesPerPack'
    ];

    // Lọc chỉ những field được phép update
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có thông tin nào để cập nhật'
      });
    }

    // Cập nhật user
    const [updatedRowsCount] = await User.update(updates, {
      where: { UserID: userId }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    // Lấy thông tin user đã cập nhật
    const updatedUser = await User.findOne({
      where: { UserID: userId }
    });

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: updatedUser.toJSON()
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin'
    });
  }
};

// @desc    Đổi mật khẩu
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Lấy user hiện tại từ middleware
    const user = req.user;

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);
    
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }

    // Cập nhật mật khẩu mới (Sequelize sẽ tự động hash trong hook)
    user.Password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu'
    });
  }
};

// @desc    Đăng xuất (soft logout - chỉ client xóa token)
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
  try {
    // Trong JWT stateless, server không cần làm gì
    // Client sẽ xóa token
    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng xuất'
    });
  }
};

// @desc    Xóa tài khoản
// @route   DELETE /api/auth/delete-account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản'
      });
    }

    // Lấy user hiện tại
    const user = req.user;

    // Kiểm tra mật khẩu
    const isPasswordCorrect = await user.matchPassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu không đúng'
      });
    }

    // Soft delete - chỉ đánh dấu IsActive = false
    user.IsActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Tài khoản đã được xóa thành công'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa tài khoản'
    });
  }
};

// @desc    Quên mật khẩu - gửi email reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email'
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      // Không tiết lộ email có tồn tại hay không vì lý do bảo mật
      return res.json({
        success: true,
        message: 'Nếu email tồn tại, link reset mật khẩu đã được gửi'
      });
    }

    // Tạo reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    user.PasswordResetToken = resetToken;
    user.PasswordResetExpires = resetTokenExpires;
    await user.save();

    // TODO: Gửi email với reset token
    // Hiện tại chỉ trả về token cho testing
    res.json({
      success: true,
      message: 'Link reset mật khẩu đã được gửi đến email',
      resetToken: resetToken // Chỉ để testing, production nên gửi qua email
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý quên mật khẩu'
    });
  }
};

// @desc    Reset mật khẩu
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mật khẩu mới'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Tìm user với token hợp lệ và chưa hết hạn
    const user = await User.findOne({
      where: {
        PasswordResetToken: token,
        PasswordResetExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    // Cập nhật mật khẩu mới
    user.Password = newPassword;
    user.PasswordResetToken = null;
    user.PasswordResetExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Reset mật khẩu thành công'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi reset mật khẩu'
    });
  }
};

// @desc    Xác thực email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: {
        EmailVerificationToken: token
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token xác thực không hợp lệ'
      });
    }

    user.EmailVerified = true;
    user.EmailVerificationToken = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email đã được xác thực thành công'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực email'
    });
  }
};

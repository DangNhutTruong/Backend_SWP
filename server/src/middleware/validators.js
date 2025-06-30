import { body } from 'express-validator';

// Validation rules cho register
export const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên phải có từ 2-100 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage('Tên chỉ được chứa chữ cái và khoảng trắng'),
    
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email không được vượt quá 100 ký tự'),
    
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Mật khẩu phải có từ 6-128 ký tự'),
    
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('Tuổi phải từ 13-120'),
    
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Số điện thoại không hợp lệ')
    .isLength({ max: 20 })
    .withMessage('Số điện thoại không được vượt quá 20 ký tự'),
    
  body('cigarettesPerDay')
    .optional()
    .isInt({ min: 0, max: 200 })
    .withMessage('Số điếu thuốc mỗi ngày phải từ 0-200'),
    
  body('costPerPack')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('Giá tiền một gói thuốc không hợp lệ')
];

// Validation rules cho login
export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
    
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống')
    .isLength({ max: 128 })
    .withMessage('Mật khẩu quá dài')
];

// Validation rules cho change password
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được để trống'),
    
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('Mật khẩu mới phải có từ 6-128 ký tự'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Xác nhận mật khẩu không khớp');
      }
      return true;
    })
];

import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Generate random token
export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate email verification token
export const generateEmailVerificationToken = () => {
  return generateToken(32);
};

// Generate 6-digit OTP for email verification
export const generateEmailVerificationOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create Gmail transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS  // Your Gmail app password
    }
  });
};

// Send email function (real email)
export const sendEmail = async (to, subject, text, html) => {
  try {
    console.log('📧 Sending email to:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 Checking Gmail credentials...');
    
    // Check Gmail credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ EMAIL_USER or EMAIL_PASS not configured in .env');
      console.log(`❌ EMAIL_USER: ${process.env.EMAIL_USER || 'undefined'}`);
      console.log(`❌ EMAIL_PASS: ${process.env.EMAIL_PASS ? 'SET' : 'undefined'}`);
      console.log('📧 Email content:', text);
      return {
        success: false,
        message: 'Gmail credentials not configured',
        isSimulated: true
      };
    }

    console.log('✅ Gmail credentials found');
    console.log(`📧 From: ${process.env.EMAIL_USER}`);
    
    const transporter = createTransporter();
    
    console.log('📧 Creating email...');
    const mailOptions = {
      from: `"NoSmoke App" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html
    };
    
    console.log('📧 Sending via Gmail SMTP...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully via Gmail!');
    console.log('📧 Message ID:', result.messageId);
    
    return {
      success: true,
      message: 'Email sent successfully via Gmail',
      messageId: result.messageId,
      isSimulated: false
    };
    
  } catch (error) {
    console.error('❌ Gmail send error:', error.message);
    console.error('❌ Full error:', error);
    
    // Fallback to simulation in case of error
    console.log('📧 Falling back to simulated email...');
    console.log('📧 Email content:', text);
    
    return {
      success: false,
      message: `Gmail error: ${error.message}`,
      error: error.message,
      isSimulated: true
    };
  }
};

// Send password reset email
// Send verification OTP email
export const sendVerificationOTP = async (user, otp) => {
  const subject = 'Mã xác thực email - NoSmoke App';
  const text = `
    Xin chào ${user.username},
    
    Mã xác thực email của bạn là: ${otp}
    
    Vui lòng nhập mã này vào trang xác thực để hoàn tất đăng ký.
    Mã có hiệu lực trong 10 phút.
    
    Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.
    
    Trân trọng,
    Đội ngũ NoSmoke
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4CAF50; margin: 0;">NoSmoke</h1>
        <p style="color: #666; margin: 5px 0;">Ứng dụng hỗ trợ cai thuốc lá</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
        <h2 style="color: #333; margin-bottom: 20px;">Mã xác thực email</h2>
        <p style="color: #555; margin-bottom: 30px;">Xin chào <strong>${user.username}</strong>,</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #333; margin-bottom: 10px; font-size: 16px;">Mã xác thực của bạn là:</p>
          <div style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; margin: 15px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">Mã có hiệu lực trong 10 phút</p>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          Vui lòng nhập mã này vào trang xác thực để hoàn tất đăng ký.<br>
          Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
        <p>© 2025 NoSmoke. Tất cả quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  return await sendEmail(user.email, subject, text, html);
};

// Send password reset OTP email
export const sendPasswordResetOTP = async (user, otp) => {
  const subject = 'Mã khôi phục mật khẩu - NoSmoke App';
  const text = `
    Xin chào ${user.username},
    
    Mã khôi phục mật khẩu của bạn là: ${otp}
    
    Vui lòng nhập mã này vào trang đặt lại mật khẩu.
    Mã có hiệu lực trong 10 phút.
    
    Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
    
    Trân trọng,
    Đội ngũ NoSmoke
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4CAF50; margin: 0;">NoSmoke</h1>
        <p style="color: #666; margin: 5px 0;">Ứng dụng hỗ trợ cai thuốc lá</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
        <h2 style="color: #333; margin-bottom: 20px;">Khôi phục mật khẩu</h2>
        <p style="color: #555; margin-bottom: 30px;">Xin chào <strong>${user.username}</strong>,</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #333; margin-bottom: 10px; font-size: 16px;">Mã khôi phục mật khẩu của bạn là:</p>
          <div style="font-size: 32px; font-weight: bold; color: #dc3545; letter-spacing: 5px; margin: 15px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">Mã có hiệu lực trong 10 phút</p>
        </div>
        
        <p style="color: #555; line-height: 1.6;">
          Vui lòng nhập mã này vào trang đặt lại mật khẩu.<br>
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #888; font-size: 12px;">
        <p>© 2025 NoSmoke. Tất cả quyền được bảo lưu.</p>
      </div>
    </div>
  `;

  return await sendEmail(user.email, subject, text, html);
};

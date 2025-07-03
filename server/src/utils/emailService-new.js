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

// Generate password reset token
export const generatePasswordResetToken = () => {
  return generateToken(32);
};

// Create Gmail transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
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

// Send verification email
export const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const subject = 'Verify Your Email - NoSmoke App';
  const text = `
    Hello ${user.username},
    
    Please verify your email by clicking the link below:
    ${verificationUrl}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, please ignore this email.
    
    Best regards,
    NoSmoke Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email</h2>
      <p>Hello <strong>${user.username}</strong>,</p>
      <p>Please verify your email by clicking the button below:</p>
      <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Verify Email
      </a>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p><small>This link will expire in 24 hours.</small></p>
      <p>If you didn't create an account, please ignore this email.</p>
      <hr>
      <p><small>Best regards,<br>NoSmoke Team</small></p>
    </div>
  `;
  
  return await sendEmail(user.email, subject, text, html);
};

// Send password reset email
export const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  const subject = 'Reset Your Password - NoSmoke App';
  const text = `
    Hello ${user.username},
    
    You requested to reset your password. Click the link below to reset it:
    ${resetUrl}
    
    This link will expire in 1 hour.
    
    If you didn't request this, please ignore this email.
    
    Best regards,
    NoSmoke Team
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hello <strong>${user.username}</strong>,</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Reset Password
      </a>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p><small>This link will expire in 1 hour.</small></p>
      <p>If you didn't request this reset, please ignore this email.</p>
      <hr>
      <p><small>Best regards,<br>NoSmoke Team</small></p>
    </div>
  `;
  
  return await sendEmail(user.email, subject, text, html);
};

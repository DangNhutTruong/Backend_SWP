# 🛡️ MBBank Automation - Safety Testing Guide

## ⚠️ CRITICAL SAFETY MEASURES

### 1. Account Protection
- **Never** run the script more than once every 2-5 minutes
- The script auto-manages session reuse to minimize logins
- Account lockout protection is built-in with cooldowns

### 2. Before First Run
```bash
# 1. Verify credentials in .env.mbbank
# 2. Check internet connection
# 3. Make sure no other banking apps are running
```

## 🔥 How to Test Safely

### Step 1: Initial Test
```bash
cd server/scripts
py mbbank_real_checker.py
```

### Step 2: Monitor the Output
- **GREEN**: ✅ Login successful, session saved
- **YELLOW**: ⚠️ No transactions found (normal)
- **RED**: ❌ Error - check logs

### Step 3: Session Management
- First run: Creates `mbbank_session.json`
- Subsequent runs: Reuses session (safer)
- Auto-expires after 30 minutes for security

## 🚨 Emergency Stop
- Press `Ctrl+C` to stop the script immediately
- Delete `mbbank_session.json` to force fresh login

## 📊 Expected Behavior

### First Run (Fresh Login)
```
🔄 Starting MBBank transaction checker...
🔑 No existing session, logging in...
✅ Login successful! Session saved.
🔍 Checking for transactions...
⚠️ No matching transactions found
⏰ Waiting 300 seconds before next check...
```

### Subsequent Runs (Session Reuse)
```
🔄 Starting MBBank transaction checker...
✅ Using existing session
🔍 Checking for transactions...
⚠️ No matching transactions found
⏰ Waiting 300 seconds before next check...
```

## 🎯 Testing Payment Flow

### 1. Start the Script
```bash
py mbbank_real_checker.py
```

### 2. Make a Test Payment
- Go to your React app payment page
- Generate QR code
- Pay exactly the amount shown
- Use the transaction content from QR

### 3. Verify Detection
- Script should detect within 5 minutes
- Payment status updates automatically
- Transaction logged to file

## 🔧 Troubleshooting

### "Login Failed"
- Check username/password in `.env.mbbank`
- Wait 10 minutes and try again
- Ensure no other banking sessions active

### "Session Expired"
- Normal behavior after 30 minutes
- Script will automatically re-login
- Session file will be regenerated

### "Rate Limit Hit"
- Built-in protection activated
- Wait for cooldown period
- Never override this protection

## 📝 Monitoring

### Log Files
- `mbbank_real_checker.log` - All activity
- `mbbank_session.json` - Session state
- Console output - Real-time status

### Success Indicators
- ✅ Session reuse working
- ✅ Transaction detection
- ✅ Payment confirmation
- ✅ No error loops

## 🎮 Production Usage

Once testing is successful:

1. **Integrate with Backend**
   - Replace manual confirmation button
   - Auto-update payment status
   - Send notifications

2. **Monitoring Dashboard**
   - Track payment success rate
   - Monitor script uptime
   - Log transaction history

3. **Backup Plans**
   - Keep manual confirmation as fallback
   - Monitor for API changes
   - Regular credential rotation

## 🔐 Security Reminders

- ✅ Session files auto-expire (30 min)
- ✅ Rate limiting prevents spam
- ✅ Mobile User-Agent for safety
- ✅ Comprehensive error handling
- ✅ Account lockout protection

**Ready to test? Run: `py mbbank_real_checker.py`**

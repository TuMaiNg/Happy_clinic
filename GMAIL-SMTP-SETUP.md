# 📧 Gmail SMTP Setup Guide

## 🔐 Cách lấy Gmail SMTP Credentials

### Option 1: Gmail App Password (Khuyên dùng)

#### Bước 1: Bật 2-Step Verification
1. Vào **Google Account**: https://myaccount.google.com/
2. Chọn **Security** (Bảo mật)
3. Tìm **2-Step Verification** (Xác minh 2 bước)
4. Bật **2-Step Verification** (cần số điện thoại)

#### Bước 2: Tạo App Password
1. Vào **Security** → **2-Step Verification**
2. Cuộn xuống tìm **App passwords** (Mật khẩu ứng dụng)
3. Chọn **App**: "Mail"
4. Chọn **Device**: "Other (Custom name)"
5. Nhập tên: "Happy Care Clinic Backend"
6. Click **Generate**
7. **Copy mật khẩu 16 ký tự** (không có khoảng trắng)

#### Bước 3: Cấu hình trong `.env`
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  # App Password (16 ký tự)
EMAIL_FROM=Happy Care Clinic <your-email@gmail.com>
```

---

### Option 2: Gmail OAuth2 (Production)

#### Bước 1: Tạo Google Cloud Project
1. Vào **Google Cloud Console**: https://console.cloud.google.com/
2. Tạo project mới: "Happy Care Clinic"
3. Enable **Gmail API**

#### Bước 2: Tạo OAuth2 Credentials
1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Chọn **Application type**: "Web application"
4. Add **Authorized redirect URIs**
5. Download **credentials.json**

#### Bước 3: Cấu hình
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=oauth2_token  # OAuth2 token
EMAIL_FROM=Happy Care Clinic <your-email@gmail.com>
```

---

## 🚀 Quick Setup (Gmail App Password)

### 1. Tạo App Password
```
Google Account → Security → 2-Step Verification → App passwords
→ Generate → Copy 16-character password
```

### 2. Cấu hình `.env`
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # App Password (16 ký tự, bỏ khoảng trắng)
EMAIL_FROM=Happy Care Clinic <your-email@gmail.com>
```

### 3. Test Email
```bash
cd backend
npm run dev
```

Check console for email logs.

---

## 📝 Alternative: SendGrid (Production)

### 1. Đăng ký SendGrid
- Website: https://sendgrid.com/
- Free tier: 100 emails/day

### 2. Tạo API Key
1. Dashboard → **Settings** → **API Keys**
2. Click **Create API Key**
3. Copy API key

### 3. Cấu hình
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxxxxxxxxxx  # SendGrid API Key
EMAIL_FROM=Happy Care Clinic <noreply@yourdomain.com>
```

---

## 📝 Alternative: Mailgun (Production)

### 1. Đăng ký Mailgun
- Website: https://www.mailgun.com/
- Free tier: 5,000 emails/month

### 2. Lấy SMTP Credentials
1. Dashboard → **Sending** → **Domain Settings**
2. Copy **SMTP credentials**

### 3. Cấu hình
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASS=your-mailgun-password
EMAIL_FROM=Happy Care Clinic <noreply@yourdomain.com>
```

---

## 🔧 Code Implementation

### Current Implementation
**File**: `backend/src/services/email.service.ts`

```typescript
this.transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

### Gmail SMTP Settings
- **Host**: `smtp.gmail.com`
- **Port**: `587` (TLS) hoặc `465` (SSL)
- **Secure**: `false` (port 587) hoặc `true` (port 465)
- **Auth**: Gmail email + App Password

---

## ✅ Test Email Configuration

### 1. Check Environment Variables
```bash
cd backend
cat .env | grep EMAIL
```

### 2. Test trong Code
```typescript
// backend/src/test-email.ts
import { emailService } from './services/email.service';

async function testEmail() {
  try {
    await emailService.sendEmail(
      'test@example.com',
      'Test Email',
      '<h1>Test</h1><p>This is a test email</p>'
    );
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
}

testEmail();
```

### 3. Run Test
```bash
npx ts-node src/test-email.ts
```

---

## 🐛 Troubleshooting

### Error: "Invalid login"
- ✅ Check App Password (16 ký tự, không có khoảng)
- ✅ Check 2-Step Verification đã bật
- ✅ Check email address đúng

### Error: "Connection timeout"
- ✅ Check firewall/network
- ✅ Try port 465 (SSL)
- ✅ Check Gmail không bị block

### Error: "Authentication failed"
- ✅ Regenerate App Password
- ✅ Check EMAIL_USER và EMAIL_PASS trong .env
- ✅ Restart server sau khi đổi .env

---

## 📊 Email Service Providers Comparison

| Provider | Free Tier | SMTP | API | Best For |
|----------|-----------|------|-----|----------|
| **Gmail** | Unlimited* | ✅ | ❌ | Development, Small scale |
| **SendGrid** | 100/day | ✅ | ✅ | Production, Medium scale |
| **Mailgun** | 5,000/month | ✅ | ✅ | Production, Large scale |
| **AWS SES** | 62,000/month | ✅ | ✅ | Production, Enterprise |

*Gmail: Có giới hạn 500 emails/day cho free account

---

## 🎯 Recommended Setup

### Development
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-dev-email@gmail.com
EMAIL_PASS=gmail-app-password
EMAIL_FROM=Happy Care Clinic <your-dev-email@gmail.com>
```

### Production
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxxxxxxxxxx
EMAIL_FROM=Happy Care Clinic <noreply@happycare.vn>
```

---

## 📝 Quick Start

1. **Bật 2-Step Verification** trên Gmail
2. **Tạo App Password**: Google Account → Security → App passwords
3. **Copy 16-character password**
4. **Cấu hình `.env`**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   EMAIL_FROM=Happy Care Clinic <your-email@gmail.com>
   ```
5. **Restart backend server**
6. **Test**: Book appointment → Check email

---

**Status**: ✅ Ready to configure!



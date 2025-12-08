# 🔐 Google Cloud OAuth2 Setup - Chi tiết từng bước

## 📋 Tổng quan

Bạn đang setup **OAuth2 Consent Screen** để dùng Gmail API. Đây là cách phức tạp hơn nhưng phù hợp cho production.

---

## 🎯 Bước hiện tại: Contact Information

### Bạn đang ở đây:
**Step 3: Contact Information**

### Điền như sau:

1. **Email addresses** (Required):
   ```
   your-email@gmail.com
   ```
   - Nhập email Gmail của bạn (email admin)
   - Có thể thêm nhiều email (mỗi email một dòng)
   - Email này sẽ nhận thông báo về OAuth consent screen

2. **Application home page** (Optional):
   ```
   https://happycare.vn
   ```
   - Hoặc để trống nếu chưa có domain

3. **Application privacy policy link** (Optional):
   ```
   https://happycare.vn/privacy
   ```
   - Hoặc để trống

4. **Application terms of service link** (Optional):
   ```
   https://happycare.vn/terms
   ```
   - Hoặc để trống

5. **Authorized domains** (Optional):
   ```
   happycare.vn
   ```
   - Chỉ cần nếu có custom domain
   - Có thể bỏ qua

6. **Developer contact information**:
   - Email: `your-email@gmail.com` (tự động điền từ email addresses)

### Click "Next" để tiếp tục

---

## 📝 Các bước tiếp theo

### Step 4: Finish
1. Review lại thông tin
2. Click **"Back to Dashboard"**

---

## 🔧 Bước tiếp theo: Tạo OAuth2 Credentials

### 1. Vào Credentials
- **APIs & Services** → **Credentials**
- Click **"+ CREATE CREDENTIALS"**
- Chọn **"OAuth client ID"**

### 2. Cấu hình OAuth Client
- **Application type**: Chọn **"Web application"**
- **Name**: `Happy Care Clinic Email Client`
- **Authorized redirect URIs**: 
  ```
  http://localhost:3000/api/auth/google/callback
  ```
  (Nếu dùng localhost cho development)

### 3. Download Credentials
- Click **"Create"**
- Download file JSON
- Lưu vào: `backend/credentials/google-oauth.json`

---

## 🔑 Bước tiếp theo: Enable Gmail API

### 1. Vào API Library
- **APIs & Services** → **Library**

### 2. Enable Gmail API
- Tìm **"Gmail API"**
- Click **"Enable"**

---

## 💻 Cấu hình Backend

### 1. Cài đặt thư viện
```bash
cd backend
npm install googleapis google-auth-library
```

### 2. Tạo OAuth2 Service
**File**: `backend/src/services/gmail-oauth.service.ts`

```typescript
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

class GmailOAuthService {
  private oauth2Client: any;
  private gmail: any;

  constructor() {
    // Load credentials
    const credentialsPath = path.join(__dirname, '../../credentials/google-oauth.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.warn('⚠️ Gmail OAuth credentials not found. Using SMTP fallback.');
      return;
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    this.oauth2Client = new google.auth.OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      credentials.web.redirect_uris[0]
    );

    // Load token if exists
    const tokenPath = path.join(__dirname, '../../credentials/gmail-token.json');
    if (fs.existsSync(tokenPath)) {
      const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      this.oauth2Client.setCredentials(token);
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  }

  async getToken(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    
    // Save token
    const tokenPath = path.join(__dirname, '../../credentials/gmail-token.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokens));
    
    return tokens;
  }

  async sendEmail(to: string, subject: string, html: string) {
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=utf-8`,
      '',
      html,
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
  }
}

export const gmailOAuthService = new GmailOAuthService();
```

---

## ⚠️ Lưu ý quan trọng

### OAuth2 Flow phức tạp:
1. ✅ Tạo OAuth consent screen (bạn đang làm)
2. ✅ Tạo OAuth2 credentials
3. ✅ Enable Gmail API
4. ✅ Get authorization code (cần user consent lần đầu)
5. ✅ Exchange code for token
6. ✅ Refresh token khi hết hạn

### Vấn đề:
- **Lần đầu**: Cần user (bạn) login và authorize
- **Token hết hạn**: Cần refresh hoặc authorize lại
- **Phức tạp hơn SMTP** rất nhiều

---

## 💡 Khuyến nghị

### Cho Development:
✅ **Dùng Gmail App Password** (đơn giản hơn 100 lần)
- Setup trong 2 phút
- Không cần OAuth2
- Hoạt động ngay

### Cho Production:
✅ **Dùng SendGrid hoặc Mailgun**
- Dễ setup hơn OAuth2
- Free tier tốt
- Professional
- Không cần OAuth2 flow

### Chỉ dùng OAuth2 nếu:
- Bắt buộc phải dùng Gmail
- Có team chuyên về Google Cloud
- Cần enterprise-level control

---

## 🎯 Action ngay bây giờ

### Nếu muốn đơn giản:
1. **Đóng Google Cloud Console**
2. **Dùng Gmail App Password** (xem `GMAIL-SETUP-QUICK.md`)
3. **Xong trong 2 phút!**

### Nếu muốn tiếp tục OAuth2:
1. **Điền email**: `your-email@gmail.com`
2. **Click "Next"**
3. **Review và Finish**
4. **Làm theo các bước tiếp theo** (tạo credentials, enable API, etc.)

---

**Tôi vẫn khuyên dùng App Password cho development!** 🚀



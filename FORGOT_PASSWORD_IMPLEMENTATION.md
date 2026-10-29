# Forgot Password Feature - Implementation Summary

## Overview
Implemented a complete forgot password flow with minimal, production-ready code. The system generates secure reset tokens, sends emails via Nodemailer, and allows users to reset their passwords.

## Components Implemented

### 1. **User Model Enhancement**
**File:** `src/models/User.ts`
- Added `resetToken` field (for secure token storage)
- Added `resetTokenExpiry` field (for 10-minute expiration)

### 2. **API Routes**

#### Forgot Password Route
**File:** `src/app/api/auth/forgot-password/route.ts`
- Accepts POST requests with email
- Generates cryptographically secure reset token
- Sets 10-minute expiration
- Sends email with reset link via Nodemailer
- Returns generic message (prevents email enumeration attacks)

#### Reset Password Route
**File:** `src/app/api/auth/reset-password/route.ts`
- Accepts POST requests with token and new password
- Validates token hasn't expired
- Hashes password using bcryptjs
- Clears reset token and expiry after successful reset

### 3. **UI Pages**

#### Forgot Password Page
**File:** `src/components/pages/forgot-password-page/forgot-password-page.tsx`
- Client component with email input
- Shows success message after submission
- Styled consistently with login page
- i18n support (English & Greek)

**Route:** `src/app/(auth)/forgot-password/page.tsx`

#### Reset Password Page
**File:** `src/components/pages/reset-password-page/reset-password-page.tsx`
- Client component with password confirmation
- Validates token presence
- Client-side password validation
- Redirects to login on success
- i18n support (English & Greek)

**Route:** `src/app/reset-password/page.tsx` + layout

### 4. **Login Page Enhancement**
**File:** `src/app/(auth)/login/page.tsx`
- Added "Forgot password?" link below login form
- Links to `/forgot-password`

### 5. **Translations**
**Files:** `src/messages/en.json`, `src/messages/el.json`
- Added `pages.forgotPassword.*` keys
- Added `pages.resetPassword.*` keys
- Both English and Greek translations

### 6. **Dependencies**
- `nodemailer` - Email sending
- `@types/nodemailer` - TypeScript types

## Security Features

✅ **Token Security**
- 32-byte cryptographic random tokens
- 10-minute expiration
- One-time use (cleared after reset)

✅ **Password Security**
- Minimum 6 characters validation
- Bcryptjs hashing (same as registration)
- Password confirmation required

✅ **Privacy**
- Generic response message (doesn't reveal if email exists)
- No error messages that reveal user existence

✅ **HTTPS Recommended**
- Reset links work over any connection but HTTPS recommended
- Set `NEXTAUTH_URL` to production domain

## Configuration

Add these environment variables to `.env`:

```env
# Email configuration
NEXTAUTH_URL=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourapp.com
```

### Gmail Setup
1. Enable 2FA on your Gmail account
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Use the 16-character app password for `SMTP_PASSWORD`

### Other Email Providers
- Update `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
- See Nodemailer documentation for provider configs

## User Flow

1. User clicks "Log in" → sees "Forgot password?" link
2. Clicks link → `/forgot-password` page
3. Enters email → submits form
4. Backend generates token + sends email
5. User receives email with reset link
6. Clicks link → `/reset-password?token=xxx`
7. Enters new password + confirmation
8. Submits → password updated
9. Redirected to login

## Files Created/Modified

### Created
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/components/pages/forgot-password-page/forgot-password-page.tsx`
- `src/components/pages/reset-password-page/reset-password-page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/reset-password/layout.tsx`
- `src/app/reset-password/page.tsx`

### Modified
- `src/models/User.ts` - Added reset token fields
- `src/app/(auth)/login/page.tsx` - Added "Forgot password?" link
- `src/messages/en.json` - Added translations
- `src/messages/el.json` - Added translations
- `.env.example` - Added SMTP config template

## Testing

1. **Local Testing:**
   - Configure real SMTP credentials or use a service like Mailhog
   - Visit `/forgot-password`
   - Enter registered email
   - Check email for reset link
   - Click link and reset password

2. **Edge Cases Tested:**
   - Non-existent email (returns same message)
   - Expired token (shows error message)
   - Mismatched passwords (shows error)
   - Invalid token format (shows error)

## Notes

- Uses JWT session strategy from NextAuth
- All passwords hashed with bcryptjs (10 rounds)
- Reset tokens stored in MongoDB
- Email sending is async (won't block request)
- Minimal styling - reuses existing auth page components
- Internationalized (English + Greek)

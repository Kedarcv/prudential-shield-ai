# Debug Guide - Navigation Issues

## Current Issue
Navigation is not working properly. Users cannot navigate between pages.

## Debugging Steps

### Step 1: Start the Backend
```bash
cd backend
npm run dev
```

**Expected Output:**
- MongoDB connection successful
- Server running on port 3001
- No errors in console

### Step 2: Seed the Database with Zimbabwe Data
```bash
cd backend
npm run seed:zimbabwe
```

**Expected Output:**
- Database cleared and seeded
- Users, customers, transactions created
- No errors

### Step 3: Start the Frontend
```bash
npm run dev
```

**Expected Output:**
- Vite dev server running on port 5173
- No TypeScript errors

### Step 4: Test Authentication

**Default Login Credentials (from seedZimbabwe.ts):**
- **Admin:** admin@prudential-zw.co.zw / admin123
- **AML Officer:** aml.officer@prudential-zw.co.zw / aml123  
- **Risk Manager:** risk.manager@prudential-zw.co.zw / risk123
- **Compliance Analyst:** compliance.analyst@prudential-zw.co.zw / analyst123

### Step 5: Check Console Logs

Open browser dev tools and look for:
1. User authentication status
2. Navigation attempts
3. API request/response status
4. Router errors

### Step 6: Use Debug Component

The app now has a debug widget in the bottom right corner that shows:
- Current route
- User authentication status  
- User role
- Navigation test buttons

### Common Issues to Check

1. **Backend not running**: Check if http://localhost:3001/health returns 200
2. **Database not seeded**: No users to login with
3. **CORS issues**: API calls blocked
4. **Authentication state**: User not properly logged in
5. **Router issues**: Navigation hooks not working

### API Endpoints to Test

```bash
# Health check
curl http://localhost:3001/health

# Login test
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@prudential-zw.co.zw","password":"admin123"}'
```

### Browser Network Tab

Check for:
- Failed API calls (4xx, 5xx status codes)
- CORS errors
- Authentication failures

### React Router Debug

In browser console, check:
- `window.location.pathname` - current path
- Router state in React DevTools
- Navigation event listeners

## Troubleshooting Navigation

If navigation still doesn't work:

1. **Remove debug components** after identifying the issue
2. **Check browser console** for JavaScript errors
3. **Verify API responses** in Network tab
4. **Test with different browsers**
5. **Clear browser cache/cookies**

## Expected Behavior

After successful login:
- User should see navigation menu based on their role
- Clicking navigation items should change the URL and page content
- Browser back/forward buttons should work
- Direct URL access should work

## Files Modified for Debugging

- `src/components/Layout.tsx` - Added debug buttons and console logs
- `src/components/NavigationDebug.tsx` - New debug component
- Fixed all TypeScript errors

## Remove Debug Code

After fixing navigation, remove:
1. Debug buttons from Layout.tsx
2. NavigationDebug component import/usage
3. Console.log statements
4. This debug file
# Build Instructions for Reading Riches

## TestFlight Crash Prevention Fixes

The app has been hardened against common TestFlight crashes with the following improvements:

### 1. SecureStore Error Handling
- **Issue**: iOS keychain access can fail in TestFlight builds
- **Fix**: Added comprehensive try-catch blocks in SecureStore adapter
- **Location**: `lib/supabase.ts:21-44`

### 2. Splash Screen Timing
- **Issue**: Race conditions between splash screen and app initialization
- **Fix**: Added 100ms delay and proper error handling for splash screen operations
- **Location**: `hooks/useFrameworkReady.ts:16-32`

### 3. Environment Variable Configuration
- **Issue**: Environment variables not available in production builds
- **Fix**: Hardcoded fallback values in `app.config.js` with Constants.expoConfig.extra
- **Location**: `app.config.js:1-2, 59-60` and `lib/supabase.ts:7-21`

### 4. iOS Configuration Improvements
- **Added**: `buildNumber` for proper iOS versioning
- **Added**: `LSApplicationQueriesSchemes` for URL handling
- **Location**: `app.config.js:22-26`

### 5. Error Boundary
- **Added**: Comprehensive error boundary to catch and display errors gracefully
- **Location**: `components/ErrorBoundary.tsx` and `app/_layout.tsx:55-60`

## Building for TestFlight

### Prerequisites
1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

3. Configure your project (if not already done):
   ```bash
   eas build:configure
   ```

### Build for iOS (TestFlight)

#### Production Build (Recommended)
```bash
eas build --profile production --platform ios --clear-cache
```

#### Preview Build (for internal testing)
```bash
eas build --profile preview --platform ios --clear-cache
```

### Submit to TestFlight

1. **Automatic Submission**:
   ```bash
   eas submit --platform ios --latest
   ```

2. **Configure Submit Details**: In `eas.json`, update:
   ```json
   {
     "submit": {
       "production": {
         "ios": {
           "appleId": "your-apple-id@example.com",
           "ascAppId": "your-app-store-connect-app-id",
           "appleTeamId": "your-team-id"
         }
       }
     }
   }
   ```

## Testing Locally Before Building

### Clean Build
```bash
npm run clean
rm -rf node_modules
npm install
```

### Start Development Server
```bash
npm run dev:clear
```

### Type Check
```bash
npm run typecheck
```

## Troubleshooting TestFlight Crashes

### 1. Check Crash Logs in App Store Connect
- Go to App Store Connect → Your App → TestFlight → Select Build
- Look at Crashes & Metrics
- Download crash logs for detailed stack traces

### 2. Common TestFlight Issues

#### App Crashes on Launch
- **Cause**: Environment variables not loaded, SecureStore issues, or initialization errors
- **Solution**: All addressed in the fixes above
- **Verify**: Check that `app.config.js` has hardcoded Supabase credentials

#### Blank Screen / Stuck Loading
- **Cause**: Navigation timing issues or auth state problems
- **Solution**: Improved splash screen timing and added loading states
- **Verify**: Test on TestFlight with fresh install

#### SecureStore Access Errors
- **Cause**: iOS keychain permissions in production builds
- **Solution**: All SecureStore operations now have error handling
- **Verify**: Check logs for "SecureStore" errors

### 3. Debug Production Builds Locally

Build a production-like version locally:
```bash
eas build --profile preview --platform ios --local
```

This creates a build you can test on your device before submitting to TestFlight.

### 4. Enable More Logging

If crashes persist, you can temporarily add more logging:

In `lib/supabase.ts`:
```javascript
console.log('Initializing Supabase with:', { supabaseUrl, supabaseAnonKey: '***' });
```

In `contexts/AuthContext.tsx`:
```javascript
console.log('Auth state changed:', { event, userId: session?.user?.id });
```

**Remember to remove extra logging before production release.**

## Key Configuration Files

### app.config.js
- Contains hardcoded Supabase credentials as fallback
- iOS configuration with proper permissions
- Build number and version codes

### eas.json
- Build profiles for development, preview, and production
- `EXPO_NO_DOTENV: "1"` disables .env files (credentials come from app.config.js)

### lib/supabase.ts
- Reads from Constants.expoConfig.extra (set in app.config.js)
- Has robust error handling for SecureStore
- Falls back gracefully if environment variables are missing

## Testing Checklist Before TestFlight

- [ ] Clean install of dependencies
- [ ] Type check passes (`npm run typecheck`)
- [ ] App runs in development mode
- [ ] Test login/logout flow
- [ ] Test all CRUD operations (children, books, prizes)
- [ ] Verify Supabase connection works
- [ ] Build completes without errors
- [ ] Test on physical device with preview build

## After TestFlight Upload

1. **Install on Test Device**: Download from TestFlight
2. **Fresh Install Test**: Delete app and reinstall to test first-launch experience
3. **Test All Features**:
   - Sign up / Sign in
   - Add children
   - Add books
   - Review books
   - Manage prizes
   - Settings and account deletion
4. **Check for Crashes**: Monitor App Store Connect for crash reports
5. **Verify Performance**: Test app responsiveness and loading times

## Important Notes

- **No .env Files in Production**: All environment variables are in `app.config.js`
- **SecureStore is Safe**: All operations have error handling
- **Splash Screen**: Properly managed with timing delays
- **Error Boundary**: Catches and displays errors instead of crashing
- **iOS Keychain**: Handled gracefully with fallbacks

## Support Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Submitting to TestFlight](https://docs.expo.dev/submit/ios/)
- [Debugging Production Builds](https://docs.expo.dev/build-reference/debugging/)
- [App Store Connect](https://appstoreconnect.apple.com/)

## Next Steps

1. Build for TestFlight: `eas build --profile production --platform ios --clear-cache`
2. Wait for build (typically 10-20 minutes)
3. Submit to TestFlight: `eas submit --platform ios --latest`
4. Test thoroughly before releasing to production
5. Monitor crash reports in App Store Connect

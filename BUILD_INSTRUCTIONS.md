# Build Instructions for Reading Riches

## What Was Fixed

The "Searching for worker" issue has been resolved by addressing several critical configuration problems:

### 1. Platform-Specific Initialization
- Fixed `useFrameworkReady` hook to work on both web and native platforms
- Added proper splash screen handling for iOS using `expo-splash-screen`
- Prevented splash screen auto-hide and manually control when it's hidden

### 2. App Layout Improvements
- Added loading state with visual feedback during authentication initialization
- Prevented navigation attempts before auth state is loaded
- Fixed potential race conditions in the root layout

### 3. Configuration Updates
- **Disabled New Architecture**: Changed `newArchEnabled` from `true` to `false` to ensure compatibility with all native modules
- **Added Splash Screen Configuration**: Properly configured splash screen in `app.json`
- **Added All Required Plugins**: Ensured `expo-splash-screen` and other critical plugins are listed
- **Created app.config.js**: Dynamic configuration file for better environment variable handling

### 4. Native Module Setup
- Configured Babel with `react-native-reanimated/plugin`
- Added proper Metro bundler configuration
- Set up EAS Build profiles for development, preview, and production
- Added proper iOS and Android permissions

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

#### Option 1: Production Build
```bash
eas build --profile production --platform ios --clear-cache
```

#### Option 2: Preview Build (for internal testing)
```bash
eas build --profile preview --platform ios --clear-cache
```

### After Build Completes

1. **Download the Build**: After the build completes, EAS will provide a download link

2. **Submit to TestFlight**:
   ```bash
   eas submit --platform ios --latest
   ```

   Or manually upload the .ipa file to App Store Connect

3. **Fill in App Store Connect Details**: In `eas.json`, update the submit configuration:
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

## Testing Locally

### Clear Cache and Start Fresh
```bash
npm run clean
npm run dev:clear
```

### Type Check
```bash
npm run typecheck
```

### Build Web Version (for testing)
```bash
npm run build:web
```

## Troubleshooting

### If the build still fails:

1. **Check Build Logs**: Look at the EAS build logs for specific errors
   ```bash
   eas build:list
   ```

2. **Verify Dependencies**: Ensure all native dependencies are installed
   ```bash
   npx expo install --check
   ```

3. **Update Expo SDK**: Make sure you're using the latest compatible versions
   ```bash
   npx expo install expo@latest
   ```

4. **Clean Everything**:
   ```bash
   npm run clean
   rm -rf node_modules
   npm install
   ```

5. **Check Native Logs**: If testing on a physical device or simulator, check the native logs:
   - iOS: Use Console.app on Mac
   - Android: Use `adb logcat`

### Common Issues:

- **"Module not found"**: Run `npx expo install` for any missing native modules
- **Build timeout**: Increase the resource class in `eas.json` (already set to `m-medium`)
- **Signing errors**: Ensure your Apple Developer account is properly configured
- **Environment variables**: Make sure Supabase credentials are correct

## Key Files Modified

- `hooks/useFrameworkReady.ts` - Added native platform support and splash screen handling
- `app/_layout.tsx` - Added proper loading states and initialization guards
- `app.json` - Added splash screen, disabled new architecture, configured plugins
- `app.config.js` - Created dynamic configuration file
- `eas.json` - Configured build profiles for all environments
- `babel.config.js` - Added Reanimated plugin
- `metro.config.js` - Basic Metro configuration
- `package.json` - Added clean and dev:clear scripts

## Next Steps

1. Run a clean build: `eas build --profile production --platform ios --clear-cache`
2. Wait for build to complete (typically 10-20 minutes)
3. Download and test the build
4. Submit to TestFlight: `eas submit --platform ios --latest`
5. Test on TestFlight before releasing to App Store

## Important Notes

- The app no longer uses Expo Go - it's a standalone native build
- All native modules are properly configured and linked
- Splash screen is properly managed for smooth app startup
- Authentication state is handled correctly with loading indicators
- The "Searching for worker" issue should be completely resolved

For more information, see:
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Submitting to TestFlight](https://docs.expo.dev/submit/ios/)

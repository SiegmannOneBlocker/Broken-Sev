# test — Employee shift tracking (Android + iPhone)

Cross-platform Expo app named **test**. Employees start shifts and submit reports. Employers see location traveled, time spent in one spot, and elevation.

## App folder

```bash
cd test-app
npm install
npx expo start
```

Then scan the QR code with **Expo Go** (Android / iPhone) or press `a` / `i` for a simulator.

## Features

- **Login** with employee ID (or admin email) + password
- **Create account**: name + employee ID → password screen
- **Administrator option** with a specific email; signing in sends a **confirmation to the employer** to accept
- **Employer / creator setup** from the login screen (first-time email setup)
- **Start Shift** records start time + location and begins tracking
- Employee tools during a shift (text boxes): Daily / Incident / Suggestions / Requests / Activity reports
- **Employer-only** dashboard: distance traveled, dwell time per spot, elevation, approvals, reports

## Downloadable builds (APK / IPA)

Install [EAS CLI](https://docs.expo.dev/build/setup/) and log in, then from `test-app`:

```bash
npx eas-cli@latest build --platform android --profile preview   # downloadable APK
npx eas-cli@latest build --platform ios --profile preview       # iOS (Apple developer account)
```

## Roles

| Role | Can do |
|------|--------|
| Employee | Start/end shift, submit reports (no tracking UI) |
| Administrator | After employer accepts: view employer dashboards |
| Employer | Approve accounts, view all tracking + reports |

Data is stored on-device (AsyncStorage) for this first version so you can run without a backend.

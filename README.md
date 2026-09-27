# Bug Ninja

Bug Ninja is a browser-based bug tally and sound-triggered zap counter. Version 1.2.0 adds a manual Field Tally mode and offline app-shell caching.

## Android Setup

Open [Bug Ninja](https://jeffharr1s.github.io/gitbug/) in Chrome on Android while online. From Chrome's menu, choose **Install app** or **Add to Home screen**. The app needs to be opened online once so its files can be cached for offline use. Installation requires the HTTPS site; opening the project files directly from disk does not enable installation or microphone access.

Bug counts, settings, and session history are stored in this browser on this device. They are not synced to an account or backed up to the cloud. Clearing the browser's site data can erase them.

## Field Tally

1. Open the app and enter a player name.
2. On first use, choose **Skip for now** on the calibration screen if you only want manual tallying.
3. Choose **Field Tally**. This mode does not request microphone access.
4. Tap **TALLY** once per bug. Tap **END** when finished.
5. The results show the session total. Open **Leaderboard** from the main menu to see saved session totals and dates.

The app shell works offline after the first successful online load. Speech recognition and microphone-based modes depend on browser support and permissions; speech recognition may require an internet connection.

## Checks

There is no automated test suite yet. From the project directory, run JavaScript syntax checks:

```powershell
node --check app.js
node --check sw.js
```

For a browser smoke test, open the HTTPS app on Android, start Field Tally, tap **TALLY** several times, end the session, and confirm the total appears in both results and Leaderboard. Also verify the app opens in airplane mode after it has been loaded online once.

## Current Gaps

- Manual tally records the total per session, but does not categorize bug species.
- History is limited to the latest 100 sessions and cannot be exported or synced.
- Endurance mode has no implemented miss/life-loss mechanic, so its advertised challenge is incomplete.
- Combo mode currently shares the regular zap scoring behavior rather than having a distinct challenge.
- This is an installable web app, not a Play Store APK.

## Roadmap

1. Add bug-type buttons to Field Tally and an all-time/day total summary.
2. Add CSV or JSON export so field records can be backed up or shared.
3. Finish the advertised game rules, especially misses/accuracy and Endurance mode.
4. Improve install assets and test installation/offline behavior across Android devices.
5. Consider optional cloud sync only if cross-device access is needed.
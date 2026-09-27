# Bug Ninja

Bug Ninja is a browser-based bug tally and sound-triggered zap counter. Version 1.2.0 adds a manual Field Tally mode and offline app-shell caching.

## Android Setup

Open [Bug Ninja](https://jeffharr1s.github.io/gitbug/) in Chrome on Android while online. From Chrome's menu, choose **Install app** or **Add to Home screen**. The app needs to be opened online once so its files can be cached for offline use. Installation requires the HTTPS site; opening the project files directly from disk does not enable installation or microphone access.

Bug counts, settings, and session history are stored in this browser on this device. You can open the app link from another device, but it will have separate data; counts are not synced or backed up to the cloud. Clearing the browser's site data can erase them.

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

1. Open directly into Field Tally for faster starts in the field.
2. Add quick bug-type buttons, including an unknown/other option.
3. Add Undo and +/- controls to correct missed or accidental taps.
4. Add optional outing notes for location, weather, and field observations.
5. Show outing duration and support pause/resume.
6. Add summaries and trends by day, outing, and bug type.
7. Export and back up records as CSV or JSON.
8. Show offline readiness and app-update status.
9. Add optional account-based cloud sync so session history can be shared across devices.
10. Finish and test the other game modes, including Endurance lives, misses, accuracy, and distinct Combo rules.
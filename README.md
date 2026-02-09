# ⚾ Hardball Scorebook

A professional-grade baseball/softball scorekeeping application built with **React Native** and **Expo**. This app provides a "Purist" scoring experience featuring a fixed lineup column and a scrollable 9-inning grid.

## 🚀 Features

- **Fixed Lineup Column**: Keep track of the batter while scrolling through innings.
- **Scrollable Inning Grid**: 9-inning horizontal scroll with vertical synchronization.
- **Classic UI**: Includes purist details like count dots and diamond-shaped scoring zones.
- **Mobile Optimized**: Custom layout logic to handle physical Android device rendering and notches using `react-native-safe-area-context`.

## 🛠️ Tech Stack & Capabilities

- **Core Model**: Gemini 3 Flash (Free Tier)
- **Generative Abilities**: Text, Image (Nano Banana), and Video (Veo) generation.
- **Framework**: [Expo](https://expo.dev/) / React Native
- **Language**: TypeScript
- **Styling**: StyleSheet (Flexbox optimized for cross-platform)

## 📱 Getting Started

1. **Clone the repo**
   ```bash
   git clone <your-repo-url>
Install dependencies

Bash
npm install
Start the app

Bash
npx expo start
Run on Android Emulator / Physical Device

Press a in the terminal to open on an emulator.

Scan the QR code with the Expo Go app to run on a physical device.

🚧 Challenges Overcome
1. Android Rendering Quirks
Fixed a critical bug where physical Android devices (unlike the emulator) collapsed the horizontal ScrollView to a width of 0. Resolved this by implementing hard-coded widths and using contentContainerStyle to force the layout engine to respect the grid dimensions.

2. Deep Caching & Ghost Bundles
Encountered "Stale Code" issues where physical hardware would not reflect code changes. Solved by:

Using npx expo start -c to clear the packager cache.

Utilizing --tunnel mode to ensure a reliable handshake between the dev machine and physical hardware.

Clearing the Expo Go app cache manually on the Android device.

3. Structural Layout Sync
Rebuilt the component hierarchy to use a nested ScrollView approach (Vertical inside Horizontal) to ensure the lineup and the innings stay perfectly aligned during navigation.

📝 Roadmap
[ ] Interactive Scoring: Save hit types (1B, 2B, HR, etc.) to state.

[ ] Diamond Visualization: Dynamically fill base paths based on at-bat outcomes.

[ ] Pitch Counting: Integrated tracker for pitcher performance.

[ ] Persistence: Local storage support via SQLite or AsyncStorage.
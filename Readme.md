# 📖 Bible Companion

A spiritual productivity app to help Jehovah's Witnesses track and complete their weekly Bible reading schedule, daily text, and meeting preparation. Built with **Expo**, **React Native**, and **SQLite** for offline-first functionality.

---

## ✨ Features

- ✅ Track daily and weekly spiritual tasks  
- 📅 Supports Bible reading schedules by weekday  
- 💾 Offline data persistence using SQLite  
- 🔄 Pull-to-refresh and dynamic checklists  
- 📌 Modal confirmations for completed tasks  
- 📊 Visual reading progress tracking  
- 🎨 Themed UI with Material 3 design  
- ☁️ Seamless publishing with EAS Update  

---

## 🧑‍💻 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) 0.79.5 with [Expo](https://expo.dev/) 53.0.20  
- **Language**: TypeScript 5.8.3  
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) 15.2.14 (SQLite 3.45.1)  
- **UI Library**: [React Native Paper](https://callstack.github.io/react-native-paper/) 5.14.5  
- **Navigation**: Expo Router 5.1.4  
- **Publishing**: [EAS Update](https://docs.expo.dev/eas-update/introduction/)  
- **Icons**: Expo Vector Icons 14.1.0  

---

## 🚀 Getting Started

### Prerequisites

- Node.js (16.x or higher)  
- npm  
- Expo CLI  
- iOS Simulator / Android Studio (optional for device testing)  

### 1. Clone the repository

```bash
git clone https://github.com/mkamenicky/bible-companion.git
cd bible-companion
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npx expo start
```

### 4. Run on your device

- Scan the QR code with the Expo Go app (iOS/Android)  
- Press `i` for iOS simulator  
- Press `a` for Android emulator  

---

## 📦 Publishing (EAS Update)

```bash
npx expo login
npx eas update:configure
npx eas update --branch preview
```

---

## 📁 Project Structure

```
.
├── app/
│   ├── (tabs)/
│   │   ├── HomeScreen.tsx         # Main dashboard with daily/weekly tasks
│   │   ├── ProgressScreen.tsx     # Reading progress visualization
│   │   ├── FeedbackScreen.tsx     # Chapter feedback and notes
│   │   └── SettingsScreen.tsx     # User preferences
│   ├── +html.tsx                  # Web configuration
│   ├── +not-found.tsx             # 404 error page
│   └── _layout.tsx                # Root layout with theme provider
├── assets/
│   ├── bible.db                   # Pre-seeded Bible database
│   └── init.sql                   # Database initialization script
├── components/
│   └── ScreenContainer.tsx        # Reusable screen wrapper
├── services/
│   ├── db.native.ts               # SQLite database initialization
│   └── repository/
│       └── reading.repository.ts  # Data access layer
├── utils/
│   └── readingPlans.ts            # Weekly reading schedule definitions
├── app.json                       # Expo configuration
└── README.md
```

---

## 🗄️ Database Schema

### User Data Tables

- `readings`: User reading progress tracking  
- `feedback`: User feedback on chapters  
- `tasks`: Reading tasks and assignments  
- `chapter_verse_counts`: Metadata about chapters  

### Bible Reference Tables

- `BibleBook`: Contains Bible book information  
- `BibleChapter`: Individual chapters with content  
- `BibleVerse`: Individual verses  

---

## 📅 Roadmap

- [x] Weekly task checklist  
- [x] Daily text tracking  
- [x] Modal confirmation  
- [ ] Reading progress chart  
- [ ] Local notifications & reminders  
- [ ] Language/theme preferences  
- [ ] Export/import progress data  

---

## 🛠️ Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npx eas build --platform android
npx eas build --platform ios
```

### Troubleshooting

- Clear Expo cache: `npx expo start --clear`  
- Reset modules: `rm -rf node_modules && npm install`  
- Type check: `npx tsc --noEmit`  
- Confirm `bible.db` is correctly placed in assets

---

## 📜 License

TBD

## 🙏 Acknowledgments

Inspired by the daily routines and spiritual goals of Jehovah's Witnesses.  
Not affiliated with the Watch Tower Bible and Tract Society.  
**Made with ❤️ using React Native and Expo**

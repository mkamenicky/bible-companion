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
- 📚 Bible overview to mark books, chapters and verses as read  
- 🎨 Themed UI with Material 3 design  
- ☁️ Seamless publishing with EAS Update  

---

## 🧑‍💻 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) 0.81.5 with [Expo](https://expo.dev/) 54  
- **Language**: TypeScript 5.9  
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) 16  
- **UI Library**: [React Native Paper](https://callstack.github.io/react-native-paper/) 5.14.5  
- **Navigation**: Expo Router 6  
- **Publishing**: [EAS Update](https://docs.expo.dev/eas-update/introduction/)  
- **Icons**: Expo Vector Icons 15  

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
│   │   ├── index.tsx              # Home: today's reading, daily text, weekly checklist
│   │   ├── BibleScreen.tsx        # Bible overview: all 66 books with reading progress
│   │   ├── ProgressScreen.tsx     # Streak, statistics, achievements
│   │   ├── CalendarScreen.tsx     # Reading days per month
│   │   └── SettingsScreen.tsx     # Goal, reminders, theme, language, backup
│   ├── bible/[bookId]/
│   │   ├── index.tsx              # Chapters of a book
│   │   └── [chapter].tsx          # Verses of a chapter
│   └── _layout.tsx                # Startup (database, localization), providers
├── assets/
│   ├── bible.db                   # Pre-populated database, copied on first launch
│   └── db/
│       ├── init.sql               # App tables (runs once)
│       └── migrations/            # Versioned schema changes
├── components/                    # UI building blocks, grouped by screen
├── constants/bible-books.ts       # Short book names per language
├── hooks/                         # One data hook per screen
├── localization/locales/          # en, de, es, fr
├── models/                        # Entity and view types
├── repository/                    # SQL access, one class per table
├── services/
│   ├── database/                  # Open/copy/migrate/backup the SQLite file
│   ├── bible/                     # Book / chapter / verse structure
│   ├── progress/                  # Read-state, streak, statistics, achievements
│   ├── readings/                  # Daily reading plan
│   ├── notifications/             # Reminder scheduling and texts
│   ├── settings/ task/ theme/ localization/
├── tests/integration/             # Service tests against the real database
└── utils/                         # Dates, logging, validation
```

---

## 🧭 How the pieces fit

- **Read-state** lives in `BibleVerseProgress`: one row per verse and day. Everything else
  (Bible progress, streak, calendar, achievements, what the plan offers next) is derived from it.
  `ProgressService` is the only place that writes it.
- **Dates** are local calendar days (`YYYY-MM-DD`), produced by `utils/date.utils.ts`.
  Do not use `toISOString()` for dates - it converts to UTC and shifts the day.
- **Verse ids start at 0** (Genesis 1:1). Never test ids for truthiness.
- **Reminders** cannot compute their text when they fire, so the goal and streak reminders are
  scheduled one per day for the next 7 days and rewritten by `notificationService.syncReminders()`
  on app start, on return to the foreground and after every progress or settings change.
- **Marks from the Bible overview** are stored as `backfill` ("read earlier": progress only) or
  `manual` ("read today": also counts for goal, streak and calendar); the daily plan stores `plan`.

---

## 🗄️ Database

`assets/bible.db` is copied to the app's SQLite directory on first launch; afterwards only
migrations run (`services/(services)/database`). To add a migration, put a
`V<version>__<name>.sql` file into `assets/db/migrations` and list it in `MigrationProvider.ts`.

- Bible reference: `BibleBook`, `BibleChapter`, `BibleVerse`
- Reading: `BibleVerseProgress`, `daily_reading_assignments`, `reading_plan_config`,
  `reading_topics`, `bible_book_topics`
- Progress: `reading_streaks`, `achievements`, `achievement_rules`, `achievement_progress`
- Other: `tasks`, `reading_preferences`, `schema_migrations`

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
npm run test:integration   # services against a real copy of the database (Node 22.13+)
npx tsc --noEmit           # type check
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

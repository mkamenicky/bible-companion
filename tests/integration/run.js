// Run with: npm run test:integration
require('./setup');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const state = global.__state;
const PROJECT = global.__projectRoot;

// --- controllable clock -----------------------------------------------------
const RealDate = Date;
let fakeNow = null;
global.Date = class extends RealDate {
    constructor(...args) { if (args.length === 0 && fakeNow !== null) super(fakeNow); else super(...args); }
    static now() { return fakeNow !== null ? fakeNow : RealDate.now(); }
};
const setNow = (y, m, d, h = 12, min = 0) => { fakeNow = new RealDate(y, m - 1, d, h, min).getTime(); };

const tempDirs = [];
const freshDir = name => { const d = fs.mkdtempSync(path.join(os.tmpdir(), name)); tempDirs.push(d); state.docDir = d; return d; };
// Each scenario works on its own ~60 MB copy of the database; tidy up afterwards.
process.on('exit', () => tempDirs.forEach(d => fs.rmSync(d, {recursive: true, force: true})));
let passed = 0;
const check = (name, fn) => Promise.resolve().then(fn).then(() => { passed++; console.log('  ok  ' + name); });

(async () => {
    // The database module reads documentDirectory once at load (a constant on a
    // real device), so every scenario with its own directory reloads it.
    let Database;
    const reload = () => { for (const k of Object.keys(require.cache)) if (k.startsWith(PROJECT) && !k.includes('node_modules')) delete require.cache[k]; Database = require('@/services/(services)/database/Database'); };
    const {DatabaseSync} = require('node:sqlite');
    const sqlPath = () => path.join(state.docDir, 'SQLite', 'bible.db');
    const raw = sql => { const db = new DatabaseSync(sqlPath()); const r = db.prepare(sql).all(); db.close(); return r; };

    console.log('DATABASE SETUP');
    await check('fresh Android install copies the bundled database and migrates it', async () => {
        state.platform = 'android'; freshDir('fresh-android-'); reload();
        await Database.initDatabase();
        assert.ok(fs.statSync(sqlPath()).size > 50e6);
        assert.ok(!fs.existsSync(sqlPath() + '.copying'));
        await Database.closeDatabase();
        assert.deepStrictEqual(raw('SELECT version, success FROM schema_migrations ORDER BY id').map(r => r.version + ':' + r.success),
            ['0.0.0-initial:1', '1.0.0:1', '1.1.0:1', '1.1.1:1', '1.1.2:1', '1.2.0:1']);
        assert.strictEqual(raw('SELECT COUNT(*) c FROM achievement_rules')[0].c, 35);
    });
    await check('fresh iOS install works the same way', async () => {
        state.platform = 'ios'; freshDir('fresh-ios-'); reload();
        await Database.initDatabase(); await Database.closeDatabase();
        assert.strictEqual(raw('SELECT COUNT(*) c FROM BibleBook')[0].c, 66);
    });
    await check('an empty stub left by a failed earlier start is replaced', async () => {
        state.platform = 'ios'; const dir = freshDir('stub-');
        fs.mkdirSync(path.join(dir, 'SQLite')); new DatabaseSync(sqlPath()).close(); reload();
        assert.ok(fs.statSync(sqlPath()).size < 1e6);
        await Database.initDatabase(); await Database.closeDatabase();
        assert.strictEqual(raw('SELECT COUNT(*) c FROM BibleBook')[0].c, 66);
    });
    // Uses a database written by app version 1.0.x. backup.db is a local,
    // git-ignored file; without it this upgrade scenario is skipped.
    const legacyDatabase = path.join(PROJECT, 'backup.db');
    if (!fs.existsSync(legacyDatabase)) console.log('  --  skipped: no backup.db for the upgrade scenario');
    else await check('existing Android data in the legacy location is moved, not lost', async () => {
        state.platform = 'android'; const dir = freshDir('legacy-');
        fs.copyFileSync(legacyDatabase, path.join(dir, 'bible.db'));
        fs.mkdirSync(path.join(dir, 'SQLite')); new DatabaseSync(sqlPath()).close(); reload(); // stub created by old code
        await Database.initDatabase(); await Database.closeDatabase();
        assert.ok(!fs.existsSync(path.join(dir, 'bible.db')));
        assert.strictEqual(raw('SELECT COUNT(*) c FROM BibleVerseProgress')[0].c, 10);
        assert.strictEqual(raw("SELECT COUNT(*) c FROM BibleVerseProgress WHERE source = 'plan'")[0].c, 10);
        assert.strictEqual(raw("SELECT success FROM schema_migrations WHERE version = '1.1.0'")[0].success, 1);
        // Dates written by 1.0.x (UTC) are moved to the local day they belong to.
        if (new Date().getTimezoneOffset() < 0) {
            assert.deepStrictEqual(raw('SELECT date, completed_at FROM daily_reading_assignments').map(r => r.date + '/' + r.completed_at), ['2025-08-03/2025-08-03']);
            assert.deepStrictEqual(raw("SELECT DISTINCT date FROM tasks WHERE task_name LIKE '%_WEEKLY_%' ORDER BY date").map(r => r.date), ['2025-07-28', '2025-08-04']);
            assert.strictEqual(raw("SELECT COUNT(*) c FROM tasks WHERE task_name LIKE '%_WEEKLY_%' AND task_name NOT LIKE '%_WEEKLY_' || date")[0].c, 0);
        } else {
            assert.deepStrictEqual(raw('SELECT date FROM daily_reading_assignments').map(r => r.date), ['2025-08-02']);
            assert.match(raw("SELECT name FROM schema_migrations WHERE version = '1.1.1'")[0].name, /not applicable/);
        }
    });
    await check('second start with existing database runs no migration twice', async () => {
        await Database.initDatabase();
        if (fs.existsSync(legacyDatabase)) {
            // statistics still work on data written by the old version
            const {progressService} = require('@/services/(services)/progress/ProgressService');
            const stats = await progressService.getProgressStats();
            assert.strictEqual(stats.totalVersesRead, 10);
            assert.strictEqual(stats.totalReadingDays, 1);
        }
        await Database.closeDatabase();
        assert.strictEqual(raw('SELECT COUNT(*) c FROM schema_migrations')[0].c, 6);
    });
    await check('a damaged database reports an error instead of starting empty', async () => {
        state.platform = 'ios'; const dir = freshDir('damaged-');
        fs.mkdirSync(path.join(dir, 'SQLite')); fs.writeFileSync(sqlPath(), Buffer.alloc(2 * 1024 * 1024, 7)); reload();
        await assert.rejects(Database.initDatabase(), /damaged|open/i);
        assert.strictEqual(Database.isDatabaseReady(), false);
        await Database.resetDatabase(); await Database.closeDatabase();
        assert.strictEqual(raw('SELECT COUNT(*) c FROM BibleBook')[0].c, 66);
    });

    // ---- services on a fresh database, in Japan time -----------------------
    state.platform = 'android'; freshDir('services-'); reload();
    setNow(2026, 11, 22, 0, 30); // Sunday 00:30 local = still Saturday in UTC
    await Database.initDatabase();
    const {readingService} = require('@/services/(services)/readings/ReadingService');
    const {progressService} = require('@/services/(services)/progress/ProgressService');
    const {notificationService} = require('@/services/(services)/notifications/NotificationsService');
    const {settingsService} = require('@/services/(services)/settings/SettingsService');
    const {taskService} = require('@/services/(services)/task/TaskService');
    const {bibleService} = require('@/services/(services)/bible/BibleService');
    const {databaseBackupService} = require('@/services/(services)/database/DatabaseBackupService');
    const find = (prefix, date) => state.scheduled.find(n => n.identifier === `${prefix}_${date}`);

    console.log('READING PLAN');
    let assignments;
    await check('Sunday plan (The Law) starts at Genesis 1:1 (verse id 0) with the local date', async () => {
        assignments = await readingService.getAssignmentsForDate(new Date());
        assert.strictEqual(assignments.length, 1);
        const a = assignments[0];
        assert.deepStrictEqual([a.date, a.display_title, a.localized_title, a.chapter_number, a.start_verse_title, a.end_verse_title, a.start_verse_id, a.end_verse_id],
            ['2026-11-22', 'The Law', 'Genesis', 1, '1', '10', 0, 9]);
        assert.strictEqual((await readingService.getAssignmentsForDate(new Date())).length, 1, 'no duplicates on reload');
    });

    console.log('REMINDERS');
    await check('nothing is scheduled while reminders are switched off', async () => {
        await notificationService.syncReminders();
        assert.strictEqual(state.scheduled.length, 0);
    });
    await check('before reading: goal reminder says nothing read yet', async () => {
        for (const key of ['dailyReminder', 'streakReminder', 'goalReminder']) assert.ok((await settingsService.updateSetting(key, true)).success);
        await notificationService.syncReminders();
        assert.match(find('goal_reminder', '2026-11-22').content.body, /haven't read yet today. Your 10 verses/);
        assert.match(find('streak_reminder', '2026-11-22').content.title, /Start Your Reading Streak/);
        assert.strictEqual(state.scheduled.filter(n => n.identifier.startsWith('goal_reminder')).length, 7);
        assert.ok(state.scheduled.find(n => n.identifier === 'daily_bible_reading'));
    });
    let unlocked;
    await check('after checking off 10/10: goal reminder says completed (the reported bug)', async () => {
        unlocked = await readingService.completeAssignment(assignments[0]);
        await notificationService.syncReminders();
        assert.strictEqual((await progressService.getPeriodStats()).today, 10);
        assert.match(find('goal_reminder', '2026-11-22').content.body, /completed your daily goal of 10 verses/);
        assert.strictEqual(find('streak_reminder', '2026-11-22'), undefined, 'no streak nag after reading');
        assert.match(find('goal_reminder', '2026-11-23').content.body, /haven't read yet today/);
        assert.match(find('streak_reminder', '2026-11-23').content.body, /1-day streak/);
        assert.match(find('streak_reminder', '2026-11-24').content.title, /Start Your Reading Streak/);
    });
    await check('achievements unlock once', async () => {
        assert.deepStrictEqual(unlocked.map(e => e.achievementId).sort(), ['book_beginner', 'first_read']);
        assert.deepStrictEqual(await progressService.updateAchievementProgress(), []);
    });
    await check('a partly reached goal shows the real numbers', async () => {
        await settingsService.updateDailyVerseGoal(25);
        await notificationService.syncReminders();
        assert.match(find('goal_reminder', '2026-11-22').content.body, /read 10\/25 verses today/);
        await settingsService.updateDailyVerseGoal(10);
    });
    await check('re-opening the assignment takes the verses off today again', async () => {
        const [a] = await readingService.getAssignmentsForDate(new Date());
        assert.strictEqual(a.is_completed, true); assert.strictEqual(a.completed_at, '2026-11-22');
        await readingService.reopenAssignment(a);
        assert.strictEqual((await progressService.getPeriodStats()).today, 0);
        const [b] = await readingService.getAssignmentsForDate(new Date());
        assert.strictEqual(b.is_completed, false); assert.strictEqual(b.completed_at, null);
        await readingService.completeAssignment(b);
    });
    await check('"Read more" continues right after the first passage', async () => {
        const more = await readingService.addMoreAssignments(new Date());
        assert.deepStrictEqual(more.map(a => [a.start_verse_id, a.end_verse_id, a.start_verse_title, a.end_verse_title]), [[10, 19, '11', '20']]);
        assert.strictEqual((await readingService.getAssignmentsForDate(new Date())).length, 2);
    });
    await check('reminder times are saved and survive a restart', async () => {
        assert.ok((await settingsService.updateSetting('goalReminderTime', '21:15')).success);
        settingsService.invalidateCache();
        assert.strictEqual((await settingsService.getSettings()).goalReminderTime, '21:15');
        await notificationService.syncReminders();
        const at = new RealDate(find('goal_reminder', '2026-11-22').trigger.date);
        assert.deepStrictEqual([at.getHours(), at.getMinutes()], [21, 15]);
        assert.strictEqual((await settingsService.updateSetting('goalReminderTime', '25:99')).success, false);
    });
    await check('no permission means nothing is scheduled', async () => {
        state.permissionGranted = false; await notificationService.syncReminders();
        assert.strictEqual(state.scheduled.length, 0);
        state.permissionGranted = true;
    });

    console.log('BIBLE OVERVIEW');
    const structure = await bibleService.getStructure();
    await check('structure: 66 books, 1189 chapters', async () => {
        assert.deepStrictEqual([structure.books.length, structure.chapters.length, structure.totalVerses], [66, 1189, 31194]);
        assert.strictEqual(bibleService.findChapterOfVerse(structure, 0).chapterNumber, 1);
        assert.strictEqual(bibleService.findChapterOfVerse(structure, 31193).bookId, 66);
        assert.strictEqual(bibleService.findChapterOfVerse(structure, 99999), null);
    });
    await check('marking a chapter as "read earlier" counts for progress but not for today', async () => {
        const genesis1 = structure.chaptersByBook.get(1)[0];
        const before = (await progressService.getPeriodStats()).today;
        await progressService.markVersesRead(genesis1.firstVerseId, genesis1.lastVerseId, 'backfill');
        const chapters = await progressService.getChaptersProgress(1);
        assert.deepStrictEqual([chapters[0].readVerses, chapters[0].totalVerses, chapters[1].readVerses], [31, 31, 0]);
        assert.strictEqual((await progressService.getPeriodStats()).today, before);
        const genesis = (await progressService.getBooksProgress())[0];
        assert.deepStrictEqual([genesis.name, genesis.completedChapters, genesis.totalChapters, genesis.readVerses], ['Genesis', 1, 50, 31]);
    });
    await check('psalm superscriptions are numbered correctly', async () => {
        const psalm3 = structure.chaptersByBook.get(19)[2];
        const verses = await progressService.getVerseStates(psalm3);
        assert.deepStrictEqual(verses.map(v => v.number), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    });
    await check('single verse toggle and "read today" mode', async () => {
        const exodus1 = structure.chaptersByBook.get(2)[0];
        const before = (await progressService.getPeriodStats()).today;
        await progressService.markVersesRead(exodus1.firstVerseId + 4, exodus1.firstVerseId + 4, 'manual');
        let verses = await progressService.getVerseStates(exodus1);
        assert.deepStrictEqual(verses.filter(v => v.isRead).map(v => v.number), [5]);
        assert.strictEqual((await progressService.getPeriodStats()).today, before + 1);
        await progressService.unmarkVerses(exodus1.firstVerseId + 4, exodus1.firstVerseId + 4);
        verses = await progressService.getVerseStates(exodus1);
        assert.strictEqual(verses.filter(v => v.isRead).length, 0);
    });
    await check('marking a whole book, then clearing it', async () => {
        const ruth = structure.booksById.get(8);
        await progressService.markVersesRead(ruth.firstVerseId, ruth.lastVerseId, 'backfill');
        let summary = await progressService.getBibleSummary();
        assert.strictEqual(summary.booksCompleted, 1);
        assert.strictEqual((await progressService.getBooksProgress())[7].completedChapters, 4);
        await progressService.unmarkVerses(ruth.firstVerseId, ruth.lastVerseId);
        summary = await progressService.getBibleSummary();
        assert.deepStrictEqual([summary.booksCompleted, summary.booksStarted], [0, 1]);
    });
    await check('marking twice does not create duplicates', async () => {
        const genesis1 = structure.chaptersByBook.get(1)[0];
        const before = (await progressService.getBibleSummary()).readVerses;
        await progressService.markVersesRead(genesis1.firstVerseId, genesis1.lastVerseId, 'backfill');
        assert.strictEqual((await progressService.getBibleSummary()).readVerses, before);
        assert.strictEqual((await progressService.getProgressStats()).totalVersesRead, before);
    });

    console.log('PLAN FOLLOWS WHAT WAS READ');
    await check('Monday reads from the historical books', async () => {
        setNow(2026, 11, 23, 8);
        const [a] = await readingService.getAssignmentsForDate(new Date());
        assert.deepStrictEqual([a.date, a.display_title, a.localized_title, a.chapter_number, a.start_verse_title], ['2026-11-23', 'Historical Books', 'Joshua', 1, '1']);
        await readingService.completeAssignment(a);
    });
    await check('next Sunday continues after everything already read in Genesis', async () => {
        setNow(2026, 11, 29, 8);
        const [a] = await readingService.getAssignmentsForDate(new Date());
        assert.deepStrictEqual([a.localized_title, a.chapter_number, a.start_verse_title, a.end_verse_title], ['Genesis', 2, '1', '10']);
    });
    await check('Saturday maps to the seventh topic (Letters)', async () => {
        setNow(2026, 11, 28, 8);
        const [a] = await readingService.getAssignmentsForDate(new Date());
        assert.deepStrictEqual([a.display_title, a.localized_title], ['Letters & Revelation', 'Romans']);
    });

    console.log('STREAK');
    await check('streak grows on consecutive days and breaks after a missed one', async () => {
        setNow(2026, 11, 23, 23, 50);
        let streak = await progressService.getStreak();
        assert.deepStrictEqual([streak.currentStreak, streak.longestStreak, streak.readToday, streak.totalReadingDays], [2, 2, true, 2]);
        setNow(2026, 11, 24, 0, 10);
        streak = await progressService.getStreak();
        assert.deepStrictEqual([streak.currentStreak, streak.readToday], [2, false], 'still alive the next day');
        setNow(2026, 11, 25, 9);
        streak = await progressService.getStreak();
        assert.deepStrictEqual([streak.currentStreak, streak.longestStreak], [0, 2], 'broken after a missed day');
    });
    await check('calendar activity uses local dates and skips backfilled verses', async () => {
        const activity = await progressService.getReadingActivity(2026);
        assert.deepStrictEqual([...activity.entries()], [['2026-11-22', 10], ['2026-11-23', 10]]);
    });

    console.log('TASKS');
    await check('weekly tasks belong to the local Monday; daily tasks to the day', async () => {
        setNow(2026, 11, 24, 0, 20); // Tuesday shortly after midnight
        await taskService.setTaskState('Family Worship', true, new Date());
        await taskService.setTaskState('Daily Text', true, new Date());
        let states = await taskService.getTaskStates(new Date());
        assert.strictEqual(states['Family Worship'], true); assert.strictEqual(states['Daily Text'], true); assert.strictEqual(states['Midweek Meeting Preparation'], false);
        setNow(2026, 11, 25, 10);
        states = await taskService.getTaskStates(new Date());
        assert.strictEqual(states['Family Worship'], true, 'same week'); assert.strictEqual(states['Daily Text'], false, 'new day');
        setNow(2026, 11, 30, 10);
        assert.strictEqual((await taskService.getTaskStates(new Date()))['Family Worship'], false, 'new week');
        await taskService.setTaskState('Daily Text', false, new Date(2026, 10, 24));
        assert.deepStrictEqual((await require('@/repository').tasksRepository.findByDate('2026-11-23')).map(t => t.task_name), ['Family Worship_WEEKLY_2026-11-23']);
    });

    console.log('CONSISTENCY');
    await check('daily text and weekly tasks: streaks, rates and achievements', async () => {
        const {consistencyService} = require('@/services/(services)/consistency/ConsistencyService');
        // a fresh run of weeks, well after the task scenarios above
        const day = (m, d) => new Date(2027, m - 1, d);
        let events = [];
        // daily text on 7 consecutive days: Mon 2027-03-01 .. Sun 2027-03-07
        for (let d = 1; d <= 7; d++) { setNow(2027, 3, d, 7); events = events.concat(await taskService.setTaskState('Daily Text', true, new Date())); }
        assert.ok(events.some(e => e.achievementId === 'dt_week'), 'dt_week unlocked on the 7th day');
        assert.strictEqual(events.filter(e => e.achievementId === 'dt_week').length, 1);
        // family worship + all other weekly tasks in 4 consecutive weeks
        events = [];
        for (const d of [1, 8, 15, 22]) {
            setNow(2027, 3, d + 2, 20);
            for (const task of ['Family Worship', 'Midweek Meeting Preparation', 'Weekend Meeting Preparation', 'Weekly Bible Reading (Meeting)'])
                events = events.concat(await taskService.setTaskState(task, true, new Date()));
        }
        const ids = events.map(e => e.achievementId);
        for (const id of ['perfect_week', 'fw_month', 'prep_month', 'perfect_month']) assert.strictEqual(ids.filter(x => x === id).length, 1, id);

        setNow(2027, 3, 25, 9); // Thursday of the 4th week
        let overview = await consistencyService.getOverview();
        const habit = id => overview.habits.find(h => h.id === id);
        assert.deepStrictEqual([habit('familyWorship').currentStreak, habit('familyWorship').bestStreak, habit('familyWorship').doneThisPeriod], [4, 4, true]);
        assert.deepStrictEqual(habit('familyWorship').recent.slice(-4), [true, true, true, true]);
        assert.deepStrictEqual([habit('dailyText').currentStreak, habit('dailyText').bestStreak, habit('dailyText').totalCompletions >= 7], [0, 7, true]);
        assert.deepStrictEqual(overview.perfectWeeks.currentStreak, 4);
        // this week so far (Mon-Thu): 2 daily routines x 4 days + 4 weekly tasks = 12 possible, 4 done
        assert.deepStrictEqual(overview.thisWeek, {done: 4, total: 12});

        setNow(2027, 4, 1, 9); // next week, nothing done yet: streak still alive
        overview = await consistencyService.getOverview();
        assert.strictEqual(overview.habits.find(h => h.id === 'familyWorship').currentStreak, 4);
        setNow(2027, 4, 8, 9); // a full week was missed: broken, best is kept
        overview = await consistencyService.getOverview();
        assert.deepStrictEqual([overview.habits.find(h => h.id === 'familyWorship').currentStreak, overview.habits.find(h => h.id === 'familyWorship').bestStreak], [0, 4]);
        // un-checking gives no events and does not take achievements away
        assert.deepStrictEqual(await taskService.setTaskState('Family Worship', false, day(3, 24)), []);
        const achievements = await progressService.getAchievements();
        assert.strictEqual(achievements.find(a => a.id === 'fw_month').unlocked, true);
        assert.strictEqual(achievements.length, 35);
    });
    await check('every achievement and category has an English name', async () => {
        const en = JSON.parse(fs.readFileSync(path.join(PROJECT, 'localization/locales/en.json'), 'utf8')).progress.achievements;
        for (const a of await progressService.getAchievements()) assert.ok(en.names[a.id] && en.descriptions[a.id], a.id);
    });

    console.log('BACKUP / RESTORE');
    await check('restore brings back the saved state without restarting', async () => {
        setNow(2026, 11, 25, 9);
        const backup = await databaseBackupService.createDatabaseBackup();
        assert.ok(backup.success, backup.error);
        const before = (await progressService.getBibleSummary()).readVerses;
        const john = structure.booksById.get(43);
        await progressService.markVersesRead(john.firstVerseId, john.lastVerseId, 'backfill');
        assert.ok((await progressService.getBibleSummary()).readVerses > before);
        setNow(2026, 11, 25, 9, 5);
        const restored = await databaseBackupService.restoreDatabaseBackup(backup.filePath);
        assert.ok(restored.success, restored.error);
        assert.strictEqual((await progressService.getBibleSummary()).readVerses, before);
    });
    await check('a file that is not a database is refused and the data is kept', async () => {
        const before = (await progressService.getBibleSummary()).readVerses;
        const junk = path.join(state.docDir, 'junk.bin'); fs.writeFileSync(junk, Buffer.alloc(3e6, 1));
        const result = await databaseBackupService.restoreDatabaseBackup('file://' + junk);
        assert.strictEqual(result.success, false);
        assert.strictEqual((await progressService.getBibleSummary()).readVerses, before);
    });

    console.log(`\n${passed} checks passed`);
})().catch(error => { console.error('\nFAILED:', error); process.exit(1); });

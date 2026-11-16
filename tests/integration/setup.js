// Integration test harness.
//
// Loads the app's real TypeScript services in plain Node. React Native and the
// Expo modules are replaced by small stand-ins (file system -> fs, expo-sqlite
// -> node:sqlite, notifications -> an in-memory list), so the services run
// against a real copy of assets/bible.db without a device or emulator.
//
// Requires Node 22.13 or newer (for node:sqlite).
const path = require('path');
const fs = require('fs');
const Module = require('module');
const {DatabaseSync} = require('node:sqlite');
const PROJECT = path.resolve(__dirname, '..', '..');
// Both ship with Expo's toolchain (Babel/Metro), so no extra dependency is needed.
const {addHook} = require(path.join(PROJECT, 'node_modules/pirates'));
const sucrase = require(path.join(PROJECT, 'node_modules/sucrase'));
global.__DEV__ = false;

addHook((code, filename) => sucrase.transform(code, {transforms: ['typescript', 'imports', 'jsx'], filePath: filename}).code,
    {exts: ['.ts', '.tsx'], ignoreNodeModules: true});
// .sql / .db "assets": the module value is the file path
for (const ext of ['.sql', '.db']) {
    Module._extensions[ext] = (module, filename) => { module.exports = filename; };
}

const state = {
    platform: 'android',
    docDir: null,              // set by test
    scheduled: [],
    permissionGranted: true,
    storage: new Map(),
    now: null,
};
global.__state = state;
global.__projectRoot = PROJECT;

const strip = uri => uri.replace(/^file:\/\//, '');

const stubs = {
    'react-native': {
        Platform: {get OS() { return state.platform; }, Version: 34},
        Linking: {openSettings: async () => {}},
    },
    'expo-asset': {
        Asset: {fromModule: file => ({localUri: null, async downloadAsync() { this.localUri = 'file://' + file; }})},
    },
    'expo-file-system/legacy': {
        get documentDirectory() { return 'file://' + state.docDir + '/'; },
        EncodingType: {Base64: 'base64'},
        async makeDirectoryAsync(uri) { fs.mkdirSync(strip(uri), {recursive: true}); },
        async deleteAsync(uri, opts) { const p = strip(uri); if (!fs.existsSync(p)) { if (opts && opts.idempotent) return; throw new Error('missing ' + p); } fs.rmSync(p, {recursive: true}); },
        async getInfoAsync(uri) { const p = strip(uri); if (!fs.existsSync(p)) return {exists: false}; const s = fs.statSync(p); return {exists: true, isDirectory: s.isDirectory(), size: s.size, modificationTime: s.mtimeMs / 1000}; },
        async copyAsync({from, to}) { if (!fs.existsSync(path.dirname(strip(to)))) throw new Error('target directory missing: ' + to); fs.copyFileSync(strip(from), strip(to)); },
        async moveAsync({from, to}) { fs.renameSync(strip(from), strip(to)); },
        async readAsStringAsync(uri, opts) {
            if (opts && opts.encoding === 'base64') { const fd = fs.openSync(strip(uri), 'r'); const b = Buffer.alloc(opts.length); fs.readSync(fd, b, 0, opts.length, opts.position || 0); fs.closeSync(fd); return b.toString('base64'); }
            return fs.readFileSync(strip(uri), 'utf8');
        },
    },
    'expo-sqlite': {
        async openDatabaseAsync(name) {
            const file = path.join(state.docDir, 'SQLite', name);
            fs.mkdirSync(path.dirname(file), {recursive: true});
            const db = new DatabaseSync(file);
            const bind = p => (p || []).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
            return {
                async getAllAsync(sql, params) { return db.prepare(sql).all(...bind(params)); },
                async getFirstAsync(sql, params) { return db.prepare(sql).get(...bind(params)) ?? null; },
                async runAsync(sql, params) { const r = db.prepare(sql).run(...bind(params)); return {changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid)}; },
                async execAsync(sql) { db.exec(sql); },
                async withTransactionAsync(fn) { db.exec('BEGIN'); try { await fn(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } },
                async closeAsync() { db.close(); },
            };
        },
    },
    'expo-notifications': {
        PermissionStatus: {UNDETERMINED: 'undetermined'},
        SchedulableTriggerInputTypes: {DAILY: 'daily', DATE: 'date'},
        AndroidImportance: {HIGH: 4},
        setNotificationHandler() {},
        async getPermissionsAsync() { return {granted: state.permissionGranted, canAskAgain: true, status: state.permissionGranted ? 'granted' : 'denied'}; },
        async requestPermissionsAsync() { return {granted: state.permissionGranted}; },
        async cancelAllScheduledNotificationsAsync() { state.scheduled = []; },
        async getAllScheduledNotificationsAsync() { return state.scheduled; },
        async setNotificationChannelAsync() {},
        async scheduleNotificationAsync(req) { state.scheduled.push(req); return req.identifier; },
    },
    '@react-native-async-storage/async-storage': {
        default: {
            async getItem(k) { return state.storage.has(k) ? state.storage.get(k) : null; },
            async setItem(k, v) { state.storage.set(k, v); },
            async removeItem(k) { state.storage.delete(k); },
        },
        __esModule: true,
    },
    'expo-document-picker': {async getDocumentAsync() { return {canceled: true}; }},
    'expo-sharing': {async isAvailableAsync() { return false; }},
    'expo-constants': {default: {expoConfig: {version: 'test'}}, __esModule: true},
};

// localization service stand-in: English strings with {{var}} interpolation
const en = JSON.parse(fs.readFileSync(path.join(PROJECT, 'localization/locales/en.json'), 'utf8'));
const localizationStub = {
    localizationService: {
        language: 'en',
        getCurrentLanguage() { return this.language; },
        t(key, options) {
            const value = key.split('.').reduce((o, k) => (o == null ? o : o[k]), en);
            if (typeof value !== 'string') throw new Error('missing translation: ' + key);
            return value.replace(/\{\{(\w+)\}\}/g, (_, n) => { if (!(n in (options || {}))) throw new Error(`missing variable ${n} for ${key}`); return String(options[n]); });
        },
    },
};

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
    if (request in stubs) return 'stub:' + request;
    if (request === '@/services/(services)/localization/localization.service') return 'stub:localization';
    if (request.startsWith('@/')) request = path.join(PROJECT, request.slice(2));
    return origResolve.call(this, request, parent, ...rest);
};
const origLoad = Module._load;
Module._load = function (request, parent, ...rest) {
    if (request in stubs) return stubs[request];
    if (request === '@/services/(services)/localization/localization.service') return localizationStub;
    return origLoad.call(this, request, parent, ...rest);
};

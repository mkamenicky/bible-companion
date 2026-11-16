/**
 * Short Bible book names per language, in canonical order (index 0 = Genesis).
 *
 * The database only has long titles ("The Book of Genesis", "According to
 * Matthew"), which do not fit on a grid tile or read well in "Matthew 5:1-10".
 * Languages without a list here fall back to English.
 */

/** Books 1-39: Hebrew-Aramaic Scriptures. Books 40-66: Christian Greek Scriptures. */
export const LAST_HEBREW_SCRIPTURES_BOOK_ID = 39;
export const BIBLE_BOOK_COUNT = 66;

const en = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
    'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
    'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah',
    'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];

const de = [
    '1. Mose', '2. Mose', '3. Mose', '4. Mose', '5. Mose', 'Josua', 'Richter', 'Ruth',
    '1. Samuel', '2. Samuel', '1. Könige', '2. Könige', '1. Chronika', '2. Chronika', 'Esra', 'Nehemia',
    'Esther', 'Hiob', 'Psalmen', 'Sprüche', 'Prediger', 'Hohes Lied', 'Jesaja', 'Jeremia',
    'Klagelieder', 'Hesekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadja', 'Jona',
    'Micha', 'Nahum', 'Habakuk', 'Zephanja', 'Haggai', 'Sacharja', 'Maleachi',
    'Matthäus', 'Markus', 'Lukas', 'Johannes', 'Apostelgeschichte', 'Römer', '1. Korinther', '2. Korinther',
    'Galater', 'Epheser', 'Philipper', 'Kolosser', '1. Thessalonicher', '2. Thessalonicher',
    '1. Timotheus', '2. Timotheus', 'Titus', 'Philemon', 'Hebräer', 'Jakobus', '1. Petrus', '2. Petrus',
    '1. Johannes', '2. Johannes', '3. Johannes', 'Judas', 'Offenbarung',
];

const es = [
    'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Jueces', 'Rut',
    '1 Samuel', '2 Samuel', '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías',
    'Ester', 'Job', 'Salmos', 'Proverbios', 'Eclesiastés', 'El Cantar de los Cantares', 'Isaías', 'Jeremías',
    'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós', 'Abdías', 'Jonás',
    'Miqueas', 'Nahúm', 'Habacuc', 'Sofonías', 'Ageo', 'Zacarías', 'Malaquías',
    'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', '1 Corintios', '2 Corintios',
    'Gálatas', 'Efesios', 'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses',
    '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón', 'Hebreos', 'Santiago', '1 Pedro', '2 Pedro',
    '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis',
];

const fr = [
    'Genèse', 'Exode', 'Lévitique', 'Nombres', 'Deutéronome', 'Josué', 'Juges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Rois', '2 Rois', '1 Chroniques', '2 Chroniques', 'Esdras', 'Néhémie',
    'Esther', 'Job', 'Psaumes', 'Proverbes', 'Ecclésiaste', 'Chant de Salomon', 'Isaïe', 'Jérémie',
    'Lamentations', 'Ézéchiel', 'Daniel', 'Osée', 'Joël', 'Amos', 'Abdias', 'Jonas',
    'Michée', 'Nahum', 'Habacuc', 'Sophonie', 'Aggée', 'Zacharie', 'Malachie',
    'Matthieu', 'Marc', 'Luc', 'Jean', 'Actes', 'Romains', '1 Corinthiens', '2 Corinthiens',
    'Galates', 'Éphésiens', 'Philippiens', 'Colossiens', '1 Thessaloniciens', '2 Thessaloniciens',
    '1 Timothée', '2 Timothée', 'Tite', 'Philémon', 'Hébreux', 'Jacques', '1 Pierre', '2 Pierre',
    '1 Jean', '2 Jean', '3 Jean', 'Jude', 'Révélation',
];

const ja = [
    '創世記', '出エジプト記', 'レビ記', '民数記', '申命記', 'ヨシュア記', '裁き人の書', 'ルツ記',
    'サムエル第一', 'サムエル第二', '列王第一', '列王第二', '歴代第一', '歴代第二', 'エズラ記', 'ネヘミヤ記',
    'エステル記', 'ヨブ記', '詩編', '格言', '伝道の書', 'ソロモンの歌', 'イザヤ書', 'エレミヤ書',
    '哀歌', 'エゼキエル書', 'ダニエル書', 'ホセア書', 'ヨエル書', 'アモス書', 'オバデヤ書', 'ヨナ書',
    'ミカ書', 'ナホム書', 'ハバクク書', 'ゼパニヤ書', 'ハガイ書', 'ゼカリヤ書', 'マラキ書',
    'マタイ', 'マルコ', 'ルカ', 'ヨハネ', '使徒', 'ローマ', 'コリント第一', 'コリント第二',
    'ガラテア', 'エフェソス', 'フィリピ', 'コロサイ', 'テサロニケ第一', 'テサロニケ第二',
    'テモテ第一', 'テモテ第二', 'テトス', 'フィレモン', 'ヘブライ', 'ヤコブ', 'ペテロ第一', 'ペテロ第二',
    'ヨハネ第一', 'ヨハネ第二', 'ヨハネ第三', 'ユダ', '啓示',
];

const BOOK_NAMES: Record<string, string[]> = {en, de, es, fr, ja};

/** Short name of a book (1-66) in the given language, or null if unknown. */
export function getShortBookName(bookId: number, language: string): string | null {
    const names = BOOK_NAMES[language] ?? BOOK_NAMES.en;
    return names[bookId - 1] ?? BOOK_NAMES.en[bookId - 1] ?? null;
}

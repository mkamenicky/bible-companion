import hashlib
from Crypto.Cipher import AES
import zlib
import sqlite3
import re
import html

DB_PATH = "bible.db"  # Update this if needed
XOR_KEY_HEX = "11cbb5587e32846d4c26790c633da289f66fe5842a3a585ce1bc3a294af5ada7"

TABLES_TO_PROCESS = [
    "Document", "Footnote", "Endnote", "Question", "Extract", "DatedText",
    "ParagraphCommentary", "VerseCommentary", "BibleChapter", "BibleVerse", "BibleOutlineEntry"
]

def get_input_string_from_publication(cursor):
    cursor.execute("SELECT MepsLanguageIndex, Symbol, Year, IssueTagNumber FROM Publication LIMIT 1")
    row = cursor.fetchone()
    if not row:
        raise ValueError("No entry found in Publication table.")
    meps_index, symbol, year, issue_tag = row
    parts = [str(meps_index), symbol, str(year)]
    if issue_tag != '0':
        parts.append(f"{issue_tag:08d}")
    return "_".join(parts)

def derive_key_iv(input_string: str, xor_key_hex: str):
    sha256_hash = hashlib.sha256(input_string.encode("utf-8")).digest()
    xor_key = bytes.fromhex(xor_key_hex)
    derived = bytes(a ^ b for a, b in zip(sha256_hash, xor_key))
    return derived[:16], derived[16:]

def clean_text(text: str) -> str:
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Replace non-breaking spaces and decode HTML entities
    text = html.unescape(text)
    text = text.replace('\xa0', ' ').replace('\u00a0', ' ').replace('\u200b', '')
    return text.strip()

def decrypt_content(content_blob: bytes, aes_key: bytes, aes_iv: bytes):
    try:
        cipher = AES.new(aes_key, AES.MODE_CBC, aes_iv)
        decrypted = cipher.decrypt(content_blob)
        inflated = zlib.decompress(decrypted)
        text = inflated.decode("utf-8")
        return clean_text(text)
    except Exception as e:
        return f"[Decryption failed: {e}]"

def ensure_decoded_column(cursor, table):
    cursor.execute(f"PRAGMA table_info({table})")
    if not any(col[1] == "DecodedContent" for col in cursor.fetchall()):
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN DecodedContent TEXT")

def process_table(cursor, table, aes_key, aes_iv):
    ensure_decoded_column(cursor, table)
    cursor.execute(f"SELECT rowid, Content FROM {table} WHERE Content IS NOT NULL")
    rows = cursor.fetchall()
    for rowid, content in rows:
        decrypted_text = decrypt_content(content, aes_key, aes_iv)
        cursor.execute(f"UPDATE {table} SET DecodedContent = ? WHERE rowid = ?", (decrypted_text, rowid))

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    input_string = get_input_string_from_publication(cursor)
    aes_key, aes_iv = derive_key_iv(input_string, XOR_KEY_HEX)
    for table in TABLES_TO_PROCESS:
        print(f"Processing table: {table}")
        process_table(cursor, table, aes_key, aes_iv)
    conn.commit()
    conn.close()
    print("Decoding and update complete.")

if __name__ == "__main__":
    main()
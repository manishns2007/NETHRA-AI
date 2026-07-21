import sqlite3
import json

db_path = 'c:/Users/NEELS/Desktop/NETHRA AI/backend/nethra_ai.db'

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM evidence WHERE status IN ('FAILED', 'INTEGRITY_FAILED')")
    failed = cursor.fetchall()

    if not failed:
        print("No failed evidence found in local sqlite DB.")

    for fe in failed:
        print(f"Evidence ID: {fe['evidence_id']}, Name: {fe['original_filename']}, Status: {fe['status']}")
        
        cursor.execute("SELECT * FROM processing_logs WHERE evidence_id = ?", (fe['evidence_id'],))
        logs = cursor.fetchall()
        for log in logs:
            print(f"  -> [{log['step']}] [{log['status']}] {log['message']} (Notes: {log['processing_notes']})")
        
        cursor.execute("SELECT * FROM audit_logs WHERE entity_id = ?", (fe['evidence_id'],))
        audits = cursor.fetchall()
        print("  Audit Logs:")
        for audit in audits:
            print(f"    -> [{audit['action']}] {audit['details']}")

except Exception as e:
    print(f"Error querying sqlite db: {e}")
finally:
    if 'conn' in locals():
        conn.close()

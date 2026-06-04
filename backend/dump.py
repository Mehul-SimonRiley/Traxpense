import sqlite3

def dump_schema():
    conn = sqlite3.connect('c:/Study Material And Projects/traxpense_2.0/backend/instance/expense_tracker.db')
    cursor = conn.cursor()
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    for table in tables:
        if table[0]:
            print(table[0])
            print("---")
    conn.close()

if __name__ == "__main__":
    dump_schema()

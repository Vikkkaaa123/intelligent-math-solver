import psycopg2
from psycopg2 import sql

conn = psycopg2.connect(
    host="localhost",
    database="postgres",
    user="postgres",
    password="12345"
)
conn.autocommit = True
cur = conn.cursor()

#cоздаем бд
cur.execute("SELECT 1 FROM pg_database WHERE datname='math_solver_db'")
if not cur.fetchone():
    cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier("math_solver_db")))
    print("бд создана")
else:
    print("бд уже существует")

#подключаемся к бд
conn.close()
conn = psycopg2.connect(
    host="localhost",
    database="math_solver_db",
    user="postgres",
    password="12345"
)
cur = conn.cursor()

#создаем таблицу
cur.execute("""
CREATE TABLE IF NOT EXISTS training_data (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR(20) NOT NULL,
    input_data JSONB NOT NULL,
    method_used VARCHAR(50),
    result JSONB NOT NULL
)
""")
print("таблица создана")

#добавляем ограничение для task_type
try:
    cur.execute("""
    ALTER TABLE training_data 
    ADD CONSTRAINT check_task_type 
    CHECK (task_type IN ('equation', 'integral', 'ode', 'slae'))
    """)
    print("ограничение добавлено")
except psycopg2.errors.DuplicateObject:
    print("ограничение уже существует")

cur.close()
conn.close()
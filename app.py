from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение к БД
def get_db():
    return psycopg2.connect(
        host="localhost",
        database="math_solver_db",
        user="postgres",
        password="12345"
    )

class SolutionResult(BaseModel):
    task_type: str
    input_data: dict
    method_used: str
    result: dict
    timestamp: str = None

@app.get("/api/history")
async def get_history():
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT task_type, input_data, method_used, result 
            FROM training_data 
            ORDER BY id DESC 
            LIMIT 100
        """)
        data = cur.fetchall()
        cur.close()
        conn.close()
        return data
    except Exception as e:
        return []

@app.post("/api/save-result")
async def save_result(solution: SolutionResult):
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO training_data (task_type, input_data, method_used, result)
            VALUES (%s, %s, %s, %s)
        """, (
            solution.task_type,
            json.dumps(solution.input_data),
            solution.method_used,
            json.dumps(solution.result)
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg
import json
import os
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Database connection string from environment
DB_CONNECTION = os.getenv("DATABASE_URL")

# Create FastAPI app
app = FastAPI(title="Minimalist Todo API", version="1.0.0")

# Add CORS middleware allowing specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://*.vercel.app",  # All Vercel domains
        "http://localhost:3000",  # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    """Create a new database connection"""
    return psycopg.connect(DB_CONNECTION)

@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    # Connect to database and create table if it doesn't exist
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Create new table with specified schema if it doesn't exist
            cur.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    id SERIAL PRIMARY KEY,
                    description TEXT NOT NULL,
                    completed BOOLEAN DEFAULT FALSE
                );
            """)
            conn.commit()
            print("Ensured tasks table exists with specified schema")

# API endpoints using raw SQL
@app.get("/api/tasks")
def get_tasks() -> List[Dict]:
    """Get all tasks from the database"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, description, completed FROM tasks ORDER BY id;")
                rows = cur.fetchall()

                # Convert to list of dictionaries
                tasks = []
                current_time = datetime.now().isoformat()
                for row in rows:
                    task = {
                        "id": str(row[0]),
                        "description": row[1],
                        "completed": row[2],
                        "created_at": current_time,  # Since we don't store timestamps in DB
                        "updated_at": current_time
                    }
                    tasks.append(task)

                return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Alias route without /api prefix for compatibility
@app.get("/tasks")
def get_tasks_alias() -> List[Dict]:
    """Get all tasks from the database (alias route)"""
    return get_tasks()

@app.post("/api/tasks")
def create_task(task_data: Dict) -> Dict:
    """Create a new task in the database"""
    description = task_data.get("description")
    completed = task_data.get("completed", False)

    if not description:
        raise HTTPException(status_code=400, detail="Description is required")

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO tasks (description, completed) VALUES (%s, %s) RETURNING id;",
                    (description, completed)
                )
                new_id = cur.fetchone()[0]
                conn.commit()

                # Return the created task
                timestamp = datetime.now().isoformat()
                return {
                    "id": str(new_id),
                    "description": description,
                    "completed": completed,
                    "created_at": timestamp,
                    "updated_at": timestamp
                }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Alias route without /api prefix for compatibility
@app.post("/tasks")
def create_task_alias(task_data: Dict) -> Dict:
    """Create a new task in the database (alias route)"""
    return create_task(task_data)

@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, task_data: Dict) -> Dict:
    """Update a task in the database"""
    description = task_data.get("description")
    completed = task_data.get("completed")

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Check if task exists
                cur.execute("SELECT id FROM tasks WHERE id = %s;", (task_id,))
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Task not found")

                # Build update query based on provided fields
                updates = []
                params = []

                if description is not None:
                    updates.append("description = %s")
                    params.append(description)

                if completed is not None:
                    updates.append("completed = %s")
                    params.append(completed)

                if not updates:
                    raise HTTPException(status_code=400, detail="No fields to update")

                # Add task_id to params for WHERE clause
                params.append(task_id)

                query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = %s RETURNING id, description, completed;"
                cur.execute(query, params)
                row = cur.fetchone()
                conn.commit()

                if row:
                    # For updates, we return the current timestamp as updated_at
                    timestamp = datetime.now().isoformat()
                    return {
                        "id": str(row[0]),
                        "description": row[1],
                        "completed": row[2],
                        "created_at": timestamp,  # This would normally be from DB, but we don't store it
                        "updated_at": timestamp
                    }
                else:
                    raise HTTPException(status_code=404, detail="Task not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Alias route without /api prefix for compatibility
@app.put("/tasks/{task_id}")
def update_task_alias(task_id: int, task_data: Dict) -> Dict:
    """Update a task in the database (alias route)"""
    return update_task(task_id, task_data)

@app.patch("/api/tasks/{task_id}/complete")
def complete_task(task_id: int, task_data: Dict) -> Dict:
    """Update completion status of a task"""
    completed = task_data.get("completed")

    if completed is None:
        raise HTTPException(status_code=400, detail="Completed status is required")

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Check if task exists
                cur.execute("SELECT id FROM tasks WHERE id = %s;", (task_id,))
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Task not found")

                # Update completion status
                cur.execute(
                    "UPDATE tasks SET completed = %s WHERE id = %s RETURNING id, description, completed;",
                    (completed, task_id)
                )
                row = cur.fetchone()
                conn.commit()

                if row:
                    # For completion updates, we return the current timestamp
                    timestamp = datetime.now().isoformat()
                    return {
                        "id": str(row[0]),
                        "description": row[1],
                        "completed": row[2],
                        "created_at": timestamp,  # This would normally be from DB, but we don't store it
                        "updated_at": timestamp
                    }
                else:
                    raise HTTPException(status_code=404, detail="Task not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Alias route without /api prefix for compatibility
@app.patch("/tasks/{task_id}/complete")
def complete_task_alias(task_id: int, task_data: Dict) -> Dict:
    """Update completion status of a task (alias route)"""
    return complete_task(task_id, task_data)

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int) -> Dict:
    """Delete a task from the database"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Check if task exists
                cur.execute("SELECT id FROM tasks WHERE id = %s;", (task_id,))
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Task not found")

                # Delete the task
                cur.execute("DELETE FROM tasks WHERE id = %s;", (task_id,))
                conn.commit()

                return {"message": "Task deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Alias route without /api prefix for compatibility
@app.delete("/tasks/{task_id}")
def delete_task_alias(task_id: int) -> Dict:
    """Delete a task from the database (alias route)"""
    return delete_task(task_id)

@app.get("/task")
def get_tasks_singular_alias() -> List[Dict]:
    """Get all tasks from the database (singular alias route)"""
    return get_tasks()

@app.get("/")
def root():
    """Root health check endpoint to keep service awake"""
    return {
        "status": "healthy",
        "message": "Minimalist Todo API is running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
                return {"status": "healthy", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=500, detail="Database connection failed")

@app.get("/api/test-db")
def test_db_connection():
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                return {"status": "success", "message": "Database connection successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")
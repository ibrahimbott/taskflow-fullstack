from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import psycopg
import json
import os
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv
import uuid
import jwt
from jwt import PyJWTError
from jwt.algorithms import RSAAlgorithm
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

# Load environment variables
load_dotenv()

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

def verify_session(request: Request):
    """Verify the user session from request headers/cookies and return user_id if valid"""
    try:
        # Check for session token in authorization header
        auth_header = request.headers.get("authorization")
        session_token = None

        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
        else:
            raise HTTPException(status_code=401, detail="No session token provided")

        if not session_token:
            raise HTTPException(status_code=401, detail="No session token provided")

        # Get the secret from environment variable
        secret = os.getenv("BETTER_AUTH_SECRET")
        if not secret:
            # Fallback secret for development
            secret = "fallback_secret_for_dev"

        # Decode and verify the JWT token
        try:
            payload = jwt.decode(session_token, secret, algorithms=["HS256"])
            user_id = payload.get("userId") or payload.get("user_id")

            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: no user_id found")

            return str(user_id)
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    except HTTPException:
        # Re-raise HTTP exceptions (like 401) as they are proper responses
        raise
    except Exception as e:
        print(f"Session verification error: {e}")
        # Return 401 instead of letting server crash with 500
        raise HTTPException(status_code=401, detail="Session verification failed")

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

            # Add new columns for categories and priorities if they don't exist
            cur.execute("""
                ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
            """)
            cur.execute("""
                ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
            """)
            conn.commit()
            print("Added category and priority columns to tasks table")

# API endpoints using raw SQL
@app.get("/api/tasks")
def get_tasks(request: Request, search: Optional[str] = None, category: Optional[str] = None) -> List[Dict]:
    """Get all tasks from the database with optional search and category filtering, limited to authenticated user"""
    # Verify session and get user_id
    user_id = verify_session(request)

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Build query with optional filters, limited to user's tasks
                query = "SELECT id, description, completed, category, priority FROM tasks WHERE user_id = %s"
                params = [str(user_id)]

                if search:
                    query += " AND description ILIKE %s"
                    params.append(f"%{search}%")

                if category and category.lower() != 'all':
                    query += " AND category = %s"
                    params.append(category)

                query += " ORDER BY id;"

                cur.execute(query, params)
                rows = cur.fetchall()

                # Convert to list of dictionaries
                tasks = []
                current_time = datetime.now().isoformat()
                for row in rows:
                    task = {
                        "id": str(row[0]),
                        "description": row[1],
                        "completed": row[2],
                        "category": row[3],
                        "priority": row[4],
                        "created_at": current_time,  # Since we don't store timestamps in DB
                        "updated_at": current_time
                    }
                    tasks.append(task)

                return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Alias route without /api prefix for compatibility
@app.get("/tasks")
def get_tasks_alias(request: Request) -> List[Dict]:
    """Get all tasks from the database (alias route)"""
    return get_tasks(request)

@app.post("/api/tasks")
def create_task(request: Request, task_data: Dict) -> Dict:
    """Create a new task in the database associated with the authenticated user"""
    # Verify session and get user_id
    user_id = verify_session(request)

    description = task_data.get("description")
    completed = task_data.get("completed", False)
    category = task_data.get("category", "General")
    priority = task_data.get("priority", "Medium")

    if not description:
        raise HTTPException(status_code=400, detail="Description is required")

    # Validate priority value
    valid_priorities = ["Low", "Medium", "High"]
    if priority not in valid_priorities:
        priority = "Medium"  # Default to Medium if invalid

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO tasks (description, completed, category, priority, user_id) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
                    (description, completed, category, priority, str(user_id))
                )
                new_id = cur.fetchone()[0]
                conn.commit()

                # Return the created task
                timestamp = datetime.now().isoformat()
                return {
                    "id": str(new_id),
                    "description": description,
                    "completed": completed,
                    "category": category,
                    "priority": priority,
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
def update_task(request: Request, task_id: int, task_data: Dict) -> Dict:
    """Update a task in the database, but only if it belongs to the authenticated user"""
    # Verify session and get user_id
    user_id = verify_session(request)

    description = task_data.get("description")
    completed = task_data.get("completed")
    category = task_data.get("category")
    priority = task_data.get("priority")

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Check if task exists and belongs to the user
                cur.execute("SELECT id FROM tasks WHERE id = %s AND user_id = %s;", (task_id, str(user_id)))
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Task not found or does not belong to user")

                # Build update query based on provided fields
                updates = []
                params = []

                if description is not None:
                    updates.append("description = %s")
                    params.append(description)

                if completed is not None:
                    updates.append("completed = %s")
                    params.append(completed)

                if category is not None:
                    updates.append("category = %s")
                    params.append(category)

                if priority is not None:
                    # Validate priority value
                    valid_priorities = ["Low", "Medium", "High"]
                    if priority in valid_priorities:
                        updates.append("priority = %s")
                        params.append(priority)

                if not updates:
                    raise HTTPException(status_code=400, detail="No fields to update")

                # Add task_id and user_id to params for WHERE clause
                params.extend([task_id, str(user_id)])

                query = f"UPDATE tasks SET {', '.join(updates)} WHERE id = %s AND user_id = %s RETURNING id, description, completed, category, priority;"
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
                        "category": row[3],
                        "priority": row[4],
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
def complete_task(request: Request, task_id: int, task_data: Dict) -> Dict:
    """Update completion status of a task, but only if it belongs to the authenticated user"""
    # Verify session and get user_id
    user_id = verify_session(request)

    completed = task_data.get("completed")

    if completed is None:
        raise HTTPException(status_code=400, detail="Completed status is required")

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Check if task exists and belongs to the user
                cur.execute("SELECT id FROM tasks WHERE id = %s AND user_id = %s;", (task_id, str(user_id)))
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Task not found or does not belong to user")

                # Update completion status
                cur.execute(
                    "UPDATE tasks SET completed = %s WHERE id = %s AND user_id = %s RETURNING id, description, completed;",
                    (completed, task_id, str(user_id))
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
def delete_task(request: Request, task_id: int) -> Dict:
    """Delete a task from the database, but only if it belongs to the authenticated user"""
    # Verify session and get user_id
    user_id = verify_session(request)

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # Check if task exists and belongs to the user
                cur.execute("SELECT id FROM tasks WHERE id = %s AND user_id = %s;", (task_id, str(user_id)))
                if not cur.fetchone():
                    raise HTTPException(status_code=404, detail="Task not found or does not belong to user")

                # Delete the task
                cur.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s;", (task_id, str(user_id)))
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
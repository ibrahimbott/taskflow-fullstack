# Todo Application - Phase 2

This is a full-stack web application with a Next.js frontend and FastAPI backend, evolving from the original CLI-based todo application.

## Features
### Phase 1 (Console App)
- Add new tasks
- View all tasks
- Update task descriptions
- Delete tasks
- Mark tasks as complete

### Phase 2 (Web App)
- Modern web interface with Next.js
- Responsive design with Tailwind CSS
- Premium SaaS UI (Slate-900 background, Indigo-600 buttons)
- Lucide icons for enhanced UX
- FastAPI backend with PostgreSQL database
- Full CRUD operations (Add, List, Update, Delete, Complete)
- Persistent storage with Neon Serverless PostgreSQL

## Project Structure

```
todo-hackathon/
├── backend_temp/          # FastAPI backend
├── web-app/              # Next.js frontend
├── apps/console_app/     # Phase 1 console application (preserved)
└── specs/                # Specifications
```

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend_temp
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the backend server:
```bash
uvicorn main:app --reload
```

The backend will run on `http://localhost:8000`

## Frontend Setup

1. Navigate to the web-app directory:
```bash
cd web-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/{id}` - Get a specific task
- `PUT /api/tasks/{id}` - Update a task
- `PATCH /api/tasks/{id}/complete` - Update task completion status
- `DELETE /api/tasks/{id}` - Delete a task
- `GET /api/health` - Health check

## Environment Variables

The frontend uses `NEXT_PUBLIC_API_URL` to connect to the backend. This is set in `.env.local`.

## Phase 1 Console App

To run the original console application:

1. Navigate to the console app directory:
```bash
cd apps/console_app
```

2. Run the application:
```bash
python -m src.main
```
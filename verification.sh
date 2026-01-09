# Final verification that the API works as expected by the frontend

# 1. Create a task
curl -X POST http://localhost:8000/api/tasks -H "Content-Type: application/json" -H "Origin: http://localhost:3000" -d '{"description":"Verification task", "completed":false}'

# 2. Get all tasks
curl -s -H "Origin: http://localhost:3000" -H "Content-Type: application/json" http://localhost:8000/api/tasks
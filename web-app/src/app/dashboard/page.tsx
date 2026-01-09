'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TaskForm from '../../components/TaskForm'
import TaskList from '../../components/TaskList'
import SearchFilter from '../../components/SearchFilter'
import { Task, TaskCreate } from '../../types/task'
import { taskService } from '../../services/taskService'
import { authService } from '../../services/authService'

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [authChecked, setAuthChecked] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      // Check JWT auth
      const isAuth = authService.isAuthenticated();
      if (!isAuth) {
        router.push('/login');
        return;
      }

      // Get user info
      const user = authService.getUser();
      if (user) {
        setUserName(user.name || user.email);
      }

      setAuthChecked(true);
      fetchTasks();
    };

    checkAuth();
  }, [router])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const tasksData = await taskService.getAllTasksWithFilters(searchTerm, categoryFilter)
      setTasks(tasksData)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      // If 401 error, redirect to login
      if ((error as Error).message?.includes('log in')) {
        authService.logout();
        router.push('/login');
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddTaskOptimistic = async (taskData: TaskCreate) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      description: taskData.description,
      completed: false,
      category: taskData.category || 'General',
      priority: taskData.priority || 'Medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks(prevTasks => [...prevTasks, optimisticTask]);

    try {
      const createdTask = await taskService.createTask(taskData);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === tempId ? createdTask : task
        )
      );
    } catch (error) {
      console.error('Error creating task:', error);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== tempId));
    }
  };

  const handleDeleteOptimistic = async (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    if (!taskToDelete) return;

    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

    try {
      await taskService.deleteTask(id);
    } catch (error) {
      console.error('Error deleting task:', error);
      if (taskToDelete) {
        setTasks(prevTasks => [...prevTasks, taskToDelete]);
      }
    }
  };

  const updateTask = async (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );

    try {
      await taskService.updateTask(updatedTask.id, {
        description: updatedTask.description,
        completed: updatedTask.completed,
        category: updatedTask.category,
        priority: updatedTask.priority
      });
    } catch (error) {
      console.error('Error updating task:', error);
      fetchTasks();
    }
  };

  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const updatedTask = { ...task, completed: !task.completed };
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === id ? updatedTask : t
      )
    );

    try {
      await taskService.completeTask(id, !task.completed);
    } catch (error) {
      console.error('Error toggling task completion:', error);
      fetchTasks();
    }
  };

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm)
  }

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category)
  }

  const handleSignOut = () => {
    authService.logout();
    router.push('/login');
  };

  // Show loading while authentication is being checked
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-purple-300 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TaskFlow</h1>
              <p className="text-sm text-purple-300">Welcome back, {userName || 'User'}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{tasks.length}</p>
                <p className="text-sm text-slate-400">Total Tasks</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{pendingCount}</p>
                <p className="text-sm text-slate-400">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{completedCount}</p>
                <p className="text-sm text-slate-400">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Task Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Task
          </h2>
          <TaskForm onTaskAdded={handleAddTaskOptimistic} />
        </div>

        {/* Search and Filter */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
          <SearchFilter
            onSearch={handleSearch}
            onCategoryFilter={handleCategoryFilter}
            currentCategory={categoryFilter || 'All'}
          />
        </div>

        {/* Task List */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Your Tasks
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-purple-500 border-t-transparent"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-400 text-lg">No tasks yet</p>
              <p className="text-slate-500 text-sm">Add your first task above to get started!</p>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onUpdateTask={updateTask}
              onDeleteTask={handleDeleteOptimistic}
              onToggleCompletion={toggleTaskCompletion}
            />
          )}
        </div>
      </div>
    </div>
  )
}
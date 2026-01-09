'use client'

import { useState } from 'react'
import { Task } from '@/types/task'

interface TaskItemProps {
  task: Task
  onUpdate: (task: Task) => void
  onDelete: (id: string) => void
  onToggleCompletion: (id: string) => void
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'bg-gradient-to-r from-red-500 to-pink-500';
    case 'medium':
      return 'bg-gradient-to-r from-amber-500 to-orange-500';
    case 'low':
      return 'bg-gradient-to-r from-green-500 to-emerald-500';
    default:
      return 'bg-slate-500';
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'work':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'personal':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'shopping':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'health':
      return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
};

export default function TaskItem({
  task,
  onUpdate,
  onDelete,
  onToggleCompletion
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.description)
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [isEditingPriority, setIsEditingPriority] = useState(false)

  const handleEdit = () => {
    if (editValue.trim() && editValue !== task.description) {
      onUpdate({ ...task, description: editValue.trim() })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEdit()
    else if (e.key === 'Escape') {
      setEditValue(task.description)
      setIsEditing(false)
    }
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ ...task, category: e.target.value })
    setIsEditingCategory(false)
  }

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ ...task, priority: e.target.value })
    setIsEditingPriority(false)
  }

  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 ${task.completed
        ? 'bg-white/3 border-white/5 opacity-60'
        : 'bg-white/5 border-white/10 hover:bg-white/8'
      }`}>
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggleCompletion(task.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${task.completed
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-transparent'
              : 'border-slate-500 hover:border-purple-400'
            }`}
        >
          {task.completed && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Task Description */}
        <div className="flex-grow min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleEdit}
              autoFocus
              className="w-full px-3 py-1.5 bg-white/10 text-white rounded-lg border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ) : (
            <div
              className={`cursor-pointer truncate font-medium ${task.completed ? 'line-through text-slate-500' : 'text-white'
                }`}
              onClick={() => setIsEditing(true)}
            >
              {task.description}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex gap-2 flex-shrink-0">
          {isEditingCategory ? (
            <select
              value={task.category}
              onChange={handleCategoryChange}
              onBlur={() => setIsEditingCategory(false)}
              autoFocus
              className="px-2 py-1 text-xs rounded-lg bg-slate-700 text-white border border-slate-500 focus:outline-none"
            >
              <option value="General">General</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Shopping">Shopping</option>
              <option value="Health">Health</option>
            </select>
          ) : (
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border cursor-pointer transition-all hover:opacity-80 ${getCategoryColor(task.category)}`}
              onClick={() => setIsEditingCategory(true)}
            >
              {task.category}
            </span>
          )}

          {isEditingPriority ? (
            <select
              value={task.priority}
              onChange={handlePriorityChange}
              onBlur={() => setIsEditingPriority(false)}
              autoFocus
              className="px-2 py-1 text-xs rounded-lg bg-slate-700 text-white border border-slate-500 focus:outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          ) : (
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg text-white cursor-pointer transition-all hover:opacity-80 ${getPriorityColor(task.priority)}`}
              onClick={() => setIsEditingPriority(true)}
            >
              {task.priority}
            </span>
          )}
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(task.id)}
          className="flex-shrink-0 p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
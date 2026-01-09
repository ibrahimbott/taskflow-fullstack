'use client'

import { useState } from 'react'
import { TaskCreate } from '../types/task'

interface TaskFormProps {
  onTaskAdded: (task: TaskCreate) => void
}

export default function TaskForm({ onTaskAdded }: TaskFormProps) {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [priority, setPriority] = useState('Medium')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (description.trim()) {
      const newTask: TaskCreate = {
        description: description.trim(),
        category: category,
        priority: priority
      }

      onTaskAdded(newTask)
      setDescription('')
      setCategory('General')
      setPriority('Medium')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex-grow">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3.5 bg-white/5 text-white rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-500 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/5 text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="General" className="bg-slate-800">General</option>
            <option value="Work" className="bg-slate-800">Work</option>
            <option value="Personal" className="bg-slate-800">Personal</option>
            <option value="Shopping" className="bg-slate-800">Shopping</option>
            <option value="Health" className="bg-slate-800">Health</option>
          </select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/5 text-white rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
          >
            <option value="Low" className="bg-slate-800">Low</option>
            <option value="Medium" className="bg-slate-800">Medium</option>
            <option value="High" className="bg-slate-800">High</option>
          </select>
        </div>
      </div>
    </form>
  )
}
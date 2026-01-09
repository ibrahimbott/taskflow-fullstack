'use client'

import { useState } from 'react'

interface SearchFilterProps {
  onSearch: (searchTerm: string) => void
  onCategoryFilter: (category: string) => void
  currentCategory: string
}

export default function SearchFilter({ onSearch, onCategoryFilter, currentCategory }: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const categories = ['All', 'General', 'Work', 'Personal', 'Shopping', 'Health']

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    onSearch(value)
  }

  const clearSearch = () => {
    setSearchTerm('')
    onSearch('')
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Search Input */}
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search tasks..."
          className="w-full pl-12 pr-12 py-3 bg-white/5 text-white rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-500 transition-all"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
          >
            <svg className="w-5 h-5 text-slate-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((categoryOption) => {
          const isActive = currentCategory === categoryOption ||
            (currentCategory === '' && categoryOption === 'All');
          return (
            <button
              key={categoryOption}
              onClick={() => onCategoryFilter(categoryOption.toLowerCase() === 'all' ? '' : categoryOption)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
            >
              {categoryOption}
            </button>
          );
        })}
      </div>
    </div>
  )
}
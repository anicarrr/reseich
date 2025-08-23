'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchFilters } from '@/lib/types';

interface SearchAndFilterProps {
  onFiltersChange: (filters: SearchFilters) => void;
  categories?: string[];
  className?: string;
}

export default function SearchAndFilter({ onFiltersChange, categories = [], className }: SearchAndFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    depth: 'all',
    category: '',
    date_range: 'all'
  });

  const [localQuery, setLocalQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, query: localQuery }));
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      type: 'all',
      depth: 'all',
      category: '',
      date_range: 'all'
    };
    setFilters(clearedFilters);
    setLocalQuery('');
  };

  const hasActiveFilters =
    filters.query || filters.type !== 'all' || filters.depth !== 'all' || filters.category || filters.date_range !== 'all';

  return (
    <div className={cn('bg-white/5 backdrop-blur-ultra border border-white/10 rounded-xl p-6', className)}>
      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search research by title, description, or tags..."
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#e9407a] focus:border-[#e9407a] text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300"
        />
        {localQuery && (
          <button
            onClick={() => setLocalQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter toggle */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          <SlidersHorizontal className={cn('h-4 w-4 transition-transform duration-300', isExpanded ? 'rotate-180' : '')} />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-[#e9407a] hover:text-[#ff8a00] font-medium transition-colors duration-300"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          {/* Research Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Research Type</label>
            <Select onValueChange={(value) => handleFilterChange('type', value)} defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Research Depth */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Research Depth</label>
            <Select onValueChange={(value) => handleFilterChange('depth', value)} defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a depth" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Depths</SelectItem>
                <SelectItem value="simple">Simple (5 credits)</SelectItem>
                <SelectItem value="full">Full (10 credits)</SelectItem>
                <SelectItem value="max">Max (20 credits)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <Select onValueChange={(value) => handleFilterChange('category', value)} defaultValue="">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
            <Select onValueChange={(value) => handleFilterChange('date_range', value)} defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-6 border-t border-white/10">
          {filters.query && (
            <Badge
              variant="secondary"
              className="bg-[#e9407a]/20 text-[#e9407a] border border-[#e9407a]/30 backdrop-blur-sm"
            >
              Query: &quot;{filters.query}&quot;
              <button
                onClick={() => setLocalQuery('')}
                className="ml-2 text-[#e9407a] hover:text-[#ff8a00] transition-colors duration-300"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.type !== 'all' && (
            <Badge
              variant="secondary"
              className="bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30 backdrop-blur-sm"
            >
              Type: {filters.type}
              <button
                onClick={() => handleFilterChange('type', 'all')}
                className="ml-2 text-[#3b82f6] hover:text-[#60a5fa] transition-colors duration-300"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.depth !== 'all' && (
            <Badge
              variant="secondary"
              className="bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 backdrop-blur-sm"
            >
              Depth: {filters.depth}
              <button
                onClick={() => handleFilterChange('depth', 'all')}
                className="ml-2 text-[#10b981] hover:text-[#34d399] transition-colors duration-300"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.category && (
            <Badge
              variant="secondary"
              className="bg-[#ff8a00]/20 text-[#ff8a00] border border-[#ff8a00]/30 backdrop-blur-sm"
            >
              Category: {filters.category}
              <button
                onClick={() => handleFilterChange('category', '')}
                className="ml-2 text-[#ff8a00] hover:text-[#ffa726] transition-colors duration-300"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.date_range !== 'all' && (
            <Badge
              variant="secondary"
              className="bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 backdrop-blur-sm"
            >
              Date: {filters.date_range}
              <button
                onClick={() => handleFilterChange('date_range', 'all')}
                className="ml-2 text-[#ef4444] hover:text-[#f87171] transition-colors duration-300"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

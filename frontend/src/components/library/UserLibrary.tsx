'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Search, BookOpen, User } from 'lucide-react';
import { ResearchCard, ResearchGrid } from '@/components/research/ResearchCard';
import { ResearchStatusList } from '@/components/research/ResearchStatus';
import type { ResearchItem, User as UserType } from '@/lib/types';

interface UserLibraryProps {
  user: UserType;
  researchItems: ResearchItem[];
  onViewResearch: (id: string) => void;
  onDownloadResearch: (id: string) => void;
  onShareResearch: (id: string) => void;
  onTogglePrivacy: (id: string, isPublic: boolean) => Promise<void>;
  onListInMarketplace: (id: string) => void;
  onDeleteResearch: (id: string) => Promise<void>;
  onUpdateResearch: (id: string, updates: Partial<ResearchItem>) => Promise<void>;
}

export const UserLibrary: React.FC<UserLibraryProps> = ({
  researchItems,
  onViewResearch,
  onDownloadResearch,
  onShareResearch,
  onTogglePrivacy,
  onListInMarketplace,
  onDeleteResearch
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'credits' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Get unique categories and tags from research items
  const categories = Array.from(new Set(researchItems.map((item) => item.category).filter(Boolean)));

  // Filter and sort research items
  const filteredItems = researchItems
    .filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesType = selectedType === 'all' || item.research_type === selectedType;

      return matchesSearch && matchesCategory && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'credits':
          comparison = b.credits_used - a.credits_used;
          break;
        case 'status':
          const statusOrder = { completed: 3, processing: 2, pending: 1, failed: 0 };
          comparison = statusOrder[b.status as keyof typeof statusOrder] - statusOrder[a.status as keyof typeof statusOrder];
          break;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

  // Group items by status for better organization
  const completedItems = filteredItems.filter((item) => item.status === 'completed');
  const processingItems = filteredItems.filter((item) => item.status === 'processing');
  const pendingItems = filteredItems.filter((item) => item.status === 'pending');
  const failedItems = filteredItems.filter((item) => item.status === 'failed');

  // Bulk actions
  const handleBulkTogglePrivacy = async (makePublic: boolean) => {
    const promises = Array.from(selectedItems).map((id) => onTogglePrivacy(id, makePublic));
    await Promise.all(promises);
    setSelectedItems(new Set());
    setShowBulkActions(false);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedItems.size} research items? This action cannot be undone.`)) {
      const promises = Array.from(selectedItems).map((id) => onDeleteResearch(id));
      await Promise.all(promises);
      setSelectedItems(new Set());
      setShowBulkActions(false);
    }
  };

  const handleItemSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
      setShowBulkActions(true);
    } else {
      setSelectedItems(new Set());
      setShowBulkActions(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Research Library</h1>
          <p className="text-gray-400">Manage your {researchItems.length} research projects and control their visibility</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            Library Settings
          </Button>
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            New Research
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-[#3b82f6]" />
              <span className="text-sm font-medium text-gray-400">Total Research</span>
            </div>
            <p className="text-2xl font-bold text-white">{researchItems.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-[#10b981]" />
              <span className="text-sm font-medium text-gray-400">Public</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {researchItems.filter((item) => item.research_type === 'public').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-[#ff8a00]" />
              <span className="text-sm font-medium text-gray-400">Private</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {researchItems.filter((item) => item.research_type === 'private').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-[#e9407a]" />
              <span className="text-sm font-medium text-gray-400">Credits Used</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {researchItems.reduce((sum, item) => sum + item.credits_used, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search research by title, description, query, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category || 'unknown'}>
                      {category || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'date' | 'title' | 'credits' | 'status')}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="credits">Credits</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {showBulkActions && (
        <Card className="border-[#3b82f6]/30 bg-[#3b82f6]/20 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#3b82f6]">{selectedItems.size} items selected</span>
                <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkTogglePrivacy(true)}>
                  <User className="h-4 w-4 mr-2" />
                  Make Public
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkTogglePrivacy(false)}>
                  <User className="h-4 w-4 mr-2" />
                  Make Private
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
            <User className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
            <User className="h-4 w-4 mr-2" />
            List
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="select-all"
            checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="select-all" className="text-sm">
            Select All
          </Label>
        </div>
      </div>

      {/* Research Items */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedItems.length})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({processingItems.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingItems.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No research found</h3>
                  <p className="text-gray-600">
                    {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedType !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Start your first research project to see it here'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <ResearchGrid>
              {filteredItems.map((item) => (
                <div key={item.id} className="relative">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                    className="absolute top-2 left-2 z-10 rounded border-gray-300"
                  />
                  <ResearchCard
                    research={item}
                    onView={() => onViewResearch(item.id)}
                    onDownload={() => onDownloadResearch(item.id)}
                    onPurchase={() => onListInMarketplace(item.id)}
                    isOwner={true}
                    showActions={true}
                  />
                </div>
              ))}
            </ResearchGrid>
          ) : (
            <ResearchStatusList
              researchItems={filteredItems}
              onView={onViewResearch}
              onDownload={onDownloadResearch}
              onShare={onShareResearch}
              showActions={true}
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed research</h3>
                  <p className="text-gray-600">Completed research projects will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ResearchStatusList
              researchItems={completedItems}
              onView={onViewResearch}
              onDownload={onDownloadResearch}
              onShare={onShareResearch}
              showActions={true}
            />
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {processingItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No processing research</h3>
                  <p className="text-gray-600">Research currently being processed will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ResearchStatusList
              researchItems={processingItems}
              onView={onViewResearch}
              onDownload={onDownloadResearch}
              onShare={onShareResearch}
              showActions={true}
            />
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending research</h3>
                  <p className="text-gray-600">Research waiting to start will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ResearchStatusList
              researchItems={pendingItems}
              onView={onViewResearch}
              onDownload={onDownloadResearch}
              onShare={onShareResearch}
              showActions={true}
            />
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          {failedItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No failed research</h3>
                  <p className="text-gray-600">Research that encountered errors will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ResearchStatusList
              researchItems={failedItems}
              onView={onViewResearch}
              onDownload={onDownloadResearch}
              onShare={onShareResearch}
              showActions={true}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

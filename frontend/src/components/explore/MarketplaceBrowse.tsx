'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  Star,
  Eye,
  ShoppingCart,
  TrendingUp,
  Clock,
  DollarSign,
  Zap,
  Grid3X3,
  List,
  User,
  Shield,
  CheckCircle
} from 'lucide-react';
import { ResearchGrid } from '@/components/research/ResearchCard';
import type { MarketplaceListingWithResearch } from '@/lib/types';

interface MarketplaceBrowseProps {
  listings: MarketplaceListingWithResearch[];
  onViewListing: (id: string) => void;
  onPurchaseListing: (id: string) => void;
  onViewResearch: (id: string) => void;
  isLoading?: boolean;
}

export const MarketplaceBrowse: React.FC<MarketplaceBrowseProps> = ({
  listings,
  onViewListing,
  onPurchaseListing,
  onViewResearch,
  isLoading = false
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepth, setSelectedDepth] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'rating' | 'popularity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique categories and depths from listings
  const categories = Array.from(new Set(listings.map((listing) => listing.research?.category).filter(Boolean)));
  const depths = Array.from(new Set(listings.map((listing) => listing.research?.research_depth).filter(Boolean)));

  // Filter and sort listings
  const filteredListings = listings
    .filter((listing) => {
      const research = listing.research;
      if (!research) return false;

      const matchesSearch =
        !searchQuery ||
        research.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        research.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        research.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || research.category === selectedCategory;
      const matchesDepth = selectedDepth === 'all' || research.research_depth === selectedDepth;

      const price = parseFloat(listing.price_sei);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      const matchesRating = (listing.rating_average || 0) >= minRating;

      return matchesSearch && matchesCategory && matchesDepth && matchesPrice && matchesRating;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'price':
          comparison = parseFloat(a.price_sei) - parseFloat(b.price_sei);
          break;
        case 'rating':
          comparison = (b.rating_average || 0) - (a.rating_average || 0);
          break;
        case 'popularity':
          comparison = (b.views_count || 0) - (a.views_count || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return `${num.toFixed(2)} SEI`;
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-white/5 border-white/10">
              <CardHeader>
                <div className="h-6 bg-white/20 rounded w-3/4" />
                <div className="h-4 bg-white/20 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-white/20 rounded w-full mb-2" />
                <div className="h-4 bg-white/20 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-[#3b82f6]" />
              <span className="text-sm font-medium text-gray-400">Total Listings</span>
            </div>
            <p className="text-2xl font-bold text-white">{listings.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-[#10b981]" />
              <span className="text-sm font-medium text-gray-400">Avg Price</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {listings.length > 0
                ? formatPrice((listings.reduce((sum, l) => sum + parseFloat(l.price_sei), 0) / listings.length).toString())
                : '0 SEI'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-[#ff8a00]" />
              <span className="text-sm font-medium text-gray-400">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {listings.length > 0
                ? (listings.reduce((sum, l) => sum + (l.rating_average || 0), 0) / listings.length).toFixed(1)
                : '0.0'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-[#e9407a]" />
              <span className="text-sm font-medium text-gray-400">Active Sellers</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {new Set(listings.map((l) => l.research?.user?.wallet_address).filter(Boolean)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardContent className="pt-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search research by title, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-[#e9407a] focus:border-[#e9407a]"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2035] border-white/20">
                  <SelectItem value="all" className="text-white hover:bg-white/10">
                    All Categories
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category || 'unknown'} className="text-white hover:bg-white/10">
                      {category || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDepth} onValueChange={setSelectedDepth}>
                <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Depth" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2035] border-white/20">
                  <SelectItem value="all" className="text-white hover:bg-white/10">
                    All Depths
                  </SelectItem>
                  {depths.map((depth) => (
                    <SelectItem key={depth} value={depth || 'unknown'} className="text-white hover:bg-white/10">
                      {depth || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as 'price' | 'rating' | 'date' | 'popularity')}
              >
                <SelectTrigger className="w-32 bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2035] border-white/20">
                  <SelectItem value="date" className="text-white hover:bg-white/10">
                    Date
                  </SelectItem>
                  <SelectItem value="price" className="text-white hover:bg-white/10">
                    Price
                  </SelectItem>
                  <SelectItem value="rating" className="text-white hover:bg-white/10">
                    Rating
                  </SelectItem>
                  <SelectItem value="popularity" className="text-white hover:bg-white/10">
                    Popularity
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-white/20 text-white bg-white/5 hover:bg-white/10"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-start">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl">
                {/* Price Range */}
                <div className="space-y-2 min-w-[280px] h-full flex flex-col">
                  <label className="text-sm font-medium text-gray-300">Price Range (SEI)</label>
                  <div className="px-2 flex-1 flex flex-col justify-center">
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange([value[0], value[1]])}
                      max={1000}
                      min={0}
                      step={1}
                      className="w-full bg-white/5"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{priceRange[0]} SEI</span>
                    <span>{priceRange[1]} SEI</span>
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="space-y-2 min-w-[280px] h-full flex flex-col">
                  <label className="text-sm font-medium text-gray-300">Minimum Rating</label>
                  <div className="px-2 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[minRating]}
                        onValueChange={(value) => setMinRating(value[0])}
                        max={5}
                        min={0}
                        step={0.5}
                        className="w-full bg-white/5"
                      />
                      <span className="text-sm font-medium text-white">{minRating}+</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">{getRatingStars(minRating)}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-start pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPriceRange([0, 1000]);
                    setMinRating(0);
                    setSelectedCategory('all');
                    setSelectedDepth('all');
                    setSearchQuery('');
                  }}
                  className="border-white/20 text-white bg-white/5 hover:bg-white/10"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
            <Grid3X3 className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredListings.length} of {listings.length} listings
        </div>
      </div>

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No listings found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedCategory !== 'all' || selectedDepth !== 'all' || priceRange[0] > 0 || minRating > 0
                  ? 'Try adjusting your search or filters'
                  : 'No research items are currently listed for sale'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <ResearchGrid>
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="relative group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-lg font-semibold line-clamp-2">{listing.research?.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {listing.description || listing.research?.description}
                    </CardDescription>
                  </div>
                  <div className="text-right flex flex-col items-end justify-center">
                    <div className="text-2xl font-bold text-green-600">{formatPrice(listing.price_sei)}</div>
                    <div className="flex items-center gap-1 justify-end">
                      {getRatingStars(listing.rating_average || 0)}
                      <span className="text-sm text-gray-500 ml-1">({listing.rating_count || 0})</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Research Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Depth</p>
                    <Badge variant="outline" className="capitalize">
                      {listing.research?.research_depth}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{listing.research?.category || 'Uncategorized'}</p>
                  </div>
                </div>

                {/* Tags */}
                {listing.research?.tags && listing.research.tags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {listing.research.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {listing.research.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{listing.research.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Seller Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{listing.research?.user?.username || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{listing.views_count || 0}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewResearch(listing.research_id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                    onClick={() => onPurchaseListing(listing.id)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Now
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Shield className="h-3 w-3" />
                  <span>Secure transaction</span>
                  <CheckCircle className="h-3 w-3" />
                  <span>Verified research</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </ResearchGrid>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white-900">{listing.research?.title}</h3>
                        <p className="text-gray-500 line-clamp-2">{listing.description || listing.research?.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{formatPrice(listing.price_sei)}</div>
                        <div className="flex items-center gap-1 justify-end">
                          {getRatingStars(listing.rating_average || 0)}
                          <span className="text-sm text-gray-500 ml-1">({listing.rating_count || 0})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {listing.research?.research_depth}
                        </Badge>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">{listing.research?.category || 'Uncategorized'}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">{listing.research?.user?.username || 'Anonymous'}</span>
                      </div>
                    </div>

                    {listing.research?.tags && listing.research.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {listing.research.tags.slice(0, 5).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {listing.research.tags.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{listing.research.tags.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{listing.views_count || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewResearch(listing.research_id)}
                      className="border-white/20 text-white bg-white/5 hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onViewResearch(listing.research_id)}
                      className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

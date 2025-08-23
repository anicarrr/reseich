'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Eye, Info, TrendingUp } from 'lucide-react';
import type { ResearchItem } from '@/lib/types';

// Listing creation validation schema
const listingFormSchema = z.object({
  research_id: z.string().min(1, 'Research item is required'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  price_sei: z
    .string()
    .min(1, 'Price is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Price must be a positive number'),
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  preview_content: z.string().max(500, 'Preview content must be less than 500 characters').optional(),
  is_featured: z.boolean().default(false),
  auto_renew: z.boolean().default(false)
});

type ListingFormSchema = z.infer<typeof listingFormSchema>;

interface ListingCreationFormProps {
  userResearch: ResearchItem[];
  onSubmit: (data: ListingFormSchema) => Promise<void>;
  isLoading?: boolean;
}

export const ListingCreationForm: React.FC<ListingCreationFormProps> = ({ userResearch, onSubmit, isLoading = false }) => {
  const [selectedResearch, setSelectedResearch] = useState<ResearchItem | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Filter only completed research items that are private
  const availableResearch = userResearch.filter((item) => item.status === 'completed' && item.research_type === 'private');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<ListingFormSchema>({
    resolver: zodResolver(listingFormSchema),
    mode: 'onChange',
    defaultValues: {
      is_featured: false,
      auto_renew: false
    }
  });

  const watchedPrice = watch('price_sei');
  const watchedFeatured = watch('is_featured');

  // Calculate fees and estimated earnings
  const calculateFees = (price: string) => {
    const priceNum = parseFloat(price) || 0;
    const platformFee = priceNum * 0.05; // 5% platform fee
    const estimatedEarnings = priceNum - platformFee;
    return { platformFee, estimatedEarnings };
  };

  const { platformFee, estimatedEarnings } = calculateFees(watchedPrice);

  const handleAddTag = () => {
    if (tagInput.trim() && selectedTags.length < 10 && !selectedTags.includes(tagInput.trim())) {
      const newTags = [...selectedTags, tagInput.trim()];
      setSelectedTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  const handleResearchSelect = (researchId: string) => {
    const research = availableResearch.find((item) => item.id === researchId);
    setSelectedResearch(research || null);
    setValue('research_id', researchId);

    if (research) {
      setValue('title', research.title);
      setValue('description', research.description || '');
      setValue('category', research.category || '');
      setValue('tags', research.tags || []);
      setSelectedTags(research.tags || []);
    }
  };

  const handleFormSubmit = async (data: ListingFormSchema) => {
    const formData: ListingFormSchema = {
      ...data,
      tags: selectedTags
    };
    await onSubmit(formData);
  };

  const getPricingSuggestions = () => {
    if (!selectedResearch) return [];

    const depth = selectedResearch.research_depth;
    const basePrice = depth === 'simple' ? 5 : depth === 'full' ? 15 : 30;

    return [
      { label: 'Budget', price: basePrice * 0.7, description: 'Attract price-conscious buyers' },
      { label: 'Standard', price: basePrice, description: 'Balanced pricing for market' },
      { label: 'Premium', price: basePrice * 1.5, description: 'Position as high-value research' }
    ];
  };

  if (availableResearch.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No research available for listing</h3>
            <p className="text-gray-600 mb-4">You need completed private research items to create marketplace listings.</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Research must be marked as &quot;private&quot;</p>
              <p>• Research must be completed</p>
              <p>• Only private research can be sold</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <DollarSign className="h-6 w-6 text-[#10b981]" />
            Create Marketplace Listing
          </CardTitle>
          <CardDescription>
            List your private research for sale in the marketplace. Set your price and reach researchers worldwide.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Research Selection */}
            <div className="space-y-2">
              <Label htmlFor="research_id">Select Research Item *</Label>
              <Select onValueChange={handleResearchSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose research to list" />
                </SelectTrigger>
                <SelectContent>
                  {availableResearch.map((research) => (
                    <SelectItem key={research.id} value={research.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{research.title}</span>
                        <span className="text-sm text-gray-500">
                          {research.research_depth} • {research.category || 'Uncategorized'} • {research.credits_used}{' '}
                          credits
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.research_id && <p className="text-sm text-red-500">{errors.research_id.message}</p>}
            </div>

            {/* Selected Research Preview */}
            {selectedResearch && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/20">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-medium text-white">{selectedResearch.title}</h4>
                      <p className="text-sm text-gray-400">{selectedResearch.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{selectedResearch.research_depth}</Badge>
                        {selectedResearch.category && <Badge variant="secondary">{selectedResearch.category}</Badge>}
                        <Badge variant="outline">{selectedResearch.credits_used} credits</Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <p>Created: {new Date(selectedResearch.created_at).toLocaleDateString()}</p>
                      <p>Status: {selectedResearch.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Listing Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Listing Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a compelling title for your listing"
                  {...register('title')}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Technology, Science, Business"
                  {...register('category')}
                  className={errors.category ? 'border-red-500' : ''}
                />
                {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Listing Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what buyers will get, key insights, methodology, etc."
                rows={4}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
              <p className="text-sm text-muted-foreground">
                Be detailed about the value and insights your research provides.
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tags to help buyers find your research"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || selectedTags.length >= 10}
                >
                  Add
                </Button>
              </div>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {selectedTags.length}/10 tags. Press Enter or click Add to add tags.
              </p>
            </div>

            {/* Pricing Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-medium">Pricing & Revenue</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_sei">Price (SEI) *</Label>
                  <Input
                    id="price_sei"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    {...register('price_sei')}
                    className={errors.price_sei ? 'border-red-500' : ''}
                  />
                  {errors.price_sei && <p className="text-sm text-red-500">{errors.price_sei.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Platform Fee (5%)</Label>
                  <div className="text-lg font-medium text-gray-600">{platformFee.toFixed(2)} SEI</div>
                </div>

                <div className="space-y-2">
                  <Label>Your Earnings</Label>
                  <div className="text-lg font-bold text-green-600">{estimatedEarnings.toFixed(2)} SEI</div>
                </div>
              </div>

              {/* Pricing Suggestions */}
              {selectedResearch && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Pricing Suggestions</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {getPricingSuggestions().map((suggestion) => (
                      <Button
                        key={suggestion.label}
                        type="button"
                        variant="outline"
                        className="h-auto p-3 flex-col items-start"
                        onClick={() => setValue('price_sei', suggestion.price.toString())}
                      >
                        <div className="font-medium">{suggestion.label}</div>
                        <div className="text-lg font-bold text-green-600">{suggestion.price} SEI</div>
                        <div className="text-xs text-gray-500 text-left">{suggestion.description}</div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="preview_content">Preview Content</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
              <Textarea
                id="preview_content"
                placeholder="Provide a preview of your research content to attract buyers (optional)"
                rows={3}
                {...register('preview_content')}
                className={errors.preview_content ? 'border-red-500' : ''}
              />
              {errors.preview_content && <p className="text-sm text-red-500">{errors.preview_content.message}</p>}
              <p className="text-sm text-muted-foreground">This content will be visible to buyers before purchase.</p>
            </div>

            {/* Listing Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_featured" {...register('is_featured')} className="rounded border-gray-300" />
                <Label htmlFor="is_featured" className="text-sm">
                  Feature this listing (increases visibility)
                </Label>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="auto_renew" {...register('auto_renew')} className="rounded border-gray-300" />
                <Label htmlFor="auto_renew" className="text-sm">
                  Auto-renew listing when it expires
                </Label>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Market Insights */}
            <Card className="bg-[#3b82f6]/20 border-[#3b82f6]/30 backdrop-blur-sm">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-[#3b82f6] mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-[#3b82f6]">Market Insights</h4>
                    <div className="text-sm text-[#3b82f6]/80 space-y-1">
                      <p>• Similar research items sell for 10-50 SEI</p>
                      <p>• Listings with detailed descriptions get 3x more views</p>
                      <p>• Research in trending categories sells faster</p>
                      <p>• Quality tags improve discoverability by 40%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Platform Fee</p>
                  <p className="text-lg font-bold text-gray-600">5%</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">Your Earnings</p>
                  <p className="text-2xl font-bold text-green-600">{estimatedEarnings.toFixed(2)} SEI</p>
                </div>
              </div>

              <Button type="submit" disabled={!isValid || isLoading} className="w-full" size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Create Marketplace Listing
                  </>
                )}
              </Button>

              <div className="mt-3 text-center text-sm text-muted-foreground">
                <p>By creating this listing, you agree to our marketplace terms and conditions.</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

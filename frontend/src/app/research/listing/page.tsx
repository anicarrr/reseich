'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, ArrowLeft, AlertCircle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { marketplaceService, researchService } from '@/lib/database';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDemoMode } from '@/lib/hooks/useDemoMode';
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import type { ResearchItem } from '@/lib/types';

// Listing creation validation schema (matching ListingCreationForm)
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

function ResearchListingPageContent() {
  usePageTitle('List Research for Sale');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { primaryWallet, user: dynamicUser } = useDynamicContext();
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();

  const [research, setResearch] = useState<ResearchItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const researchId = searchParams.get('id');

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

  // Calculate fees and estimated earnings
  const calculateFees = (price: string) => {
    const priceNum = parseFloat(price) || 0;
    const platformFee = priceNum * 0.05; // 5% platform fee
    const estimatedEarnings = priceNum - platformFee;
    return { platformFee, estimatedEarnings };
  };

  const { platformFee, estimatedEarnings } = calculateFees(watchedPrice);

  // Authentication loading effect
  useEffect(() => {
    // Wait for authentication state to be determined
    const timer = setTimeout(() => {
      setIsAuthLoading(false);
    }, 1000); // Give time for auth hooks to initialize

    return () => clearTimeout(timer);
  }, []);

  // Load research data
  useEffect(() => {
    const loadResearch = async () => {
      // Wait for auth to be ready
      if (isAuthLoading) return;

      if (!researchId) {
        setError('No research ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const researchData = await researchService.getResearchById(researchId);

        if (!researchData) {
          setError('Research not found');
          setIsLoading(false);
          return;
        }

        // Check if user owns this research
        if (!user || (researchData.user_id !== user.id && !isDemoMode)) {
          setError('You can only list your own research');
          setIsLoading(false);
          return;
        }

        // Check if research is completed and private
        if (researchData.status !== 'completed') {
          setError('Only completed research can be listed for sale');
          setIsLoading(false);
          return;
        }

        if (researchData.research_type !== 'private') {
          setError('Only private research can be listed for sale');
          setIsLoading(false);
          return;
        }

        setResearch(researchData);

        // Pre-fill form with research data
        setValue('research_id', researchData.id);
        setValue('title', researchData.title);
        setValue('description', researchData.description || '');
        setValue('category', researchData.category || '');

        if (researchData.tags) {
          setValue('tags', researchData.tags);
          setSelectedTags(researchData.tags);
        }

        // Set suggested price based on research depth
        const depth = researchData.research_depth;
        const basePrice = depth === 'simple' ? 5 : depth === 'full' ? 15 : 30;
        setValue('price_sei', basePrice.toString());
      } catch (err) {
        console.error('Error loading research:', err);
        setError('Failed to load research data');
      } finally {
        setIsLoading(false);
      }
    };

    loadResearch();
  }, [researchId, user, isDemoMode, setValue, isAuthLoading]);

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

  const handleFormSubmit = async (data: ListingFormSchema) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      if (!user && !isDemoMode) {
        throw new Error('Please connect your wallet to create listings');
      }

      // Create marketplace listing
      const listingData = {
        research_id: data.research_id,
        user_id: user?.id || 'demo',
        // title: data.title,
        description: data.description,
        price_sei: data.price_sei,
        // category: data.category,
        // tags: selectedTags,
        preview_content: data.preview_content,
        // is_featured: data.is_featured,
        // auto_renew: data.auto_renew,
        is_active: true,
        views_count: 0,
        rating_average: 0,
        rating_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const newListing = await marketplaceService.createListing(listingData);

      if (!newListing) {
        throw new Error('Failed to create listing');
      }

      setSuccess('Marketplace listing created successfully!');

      // Redirect to explore page after a delay
      setTimeout(() => {
        router.push('/explore');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPricingSuggestions = () => {
    if (!research) return [];

    const depth = research.research_depth;
    const basePrice = depth === 'simple' ? 5 : depth === 'full' ? 15 : 30;

    return [
      { label: 'Budget', price: basePrice * 0.7, description: 'Attract price-conscious buyers' },
      { label: 'Standard', price: basePrice, description: 'Balanced pricing for market' },
      { label: 'Premium', price: basePrice * 1.5, description: 'Position as high-value research' }
    ];
  };

  // Show skeleton loader until everything is ready (auth + data loading)
  if (isAuthLoading || isLoading) {
    return (
      <div className="header-spacer">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-9 w-32 bg-white/10 rounded-md animate-pulse" />
            <div>
              <div className="h-8 w-64 bg-white/10 rounded-md animate-pulse mb-2" />
              <div className="h-4 w-80 bg-white/10 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Research Preview Skeleton */}
          <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
            <CardHeader>
              <div className="h-6 w-48 bg-white/10 rounded-md animate-pulse mb-2" />
              <div className="h-4 w-72 bg-white/10 rounded-md animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-6 w-full bg-white/10 rounded-md animate-pulse" />
                <div className="h-4 w-full bg-white/10 rounded-md animate-pulse" />
                <div className="h-4 w-3/4 bg-white/10 rounded-md animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
                  <div className="h-6 w-24 bg-white/10 rounded-full animate-pulse" />
                  <div className="h-6 w-18 bg-white/10 rounded-full animate-pulse" />
                </div>
                <div className="h-4 w-40 bg-white/10 rounded-md animate-pulse" />
              </div>
            </CardContent>
          </Card>

          {/* Form Skeleton */}
          <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-white/10 rounded-md animate-pulse" />
                <div className="h-6 w-32 bg-white/10 rounded-md animate-pulse" />
              </div>
              <div className="h-4 w-96 bg-white/10 rounded-md animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Title and Category Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-white/10 rounded-md animate-pulse" />
                    <div className="h-10 w-full bg-white/10 rounded-md animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-white/10 rounded-md animate-pulse" />
                    <div className="h-10 w-full bg-white/10 rounded-md animate-pulse" />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-white/10 rounded-md animate-pulse" />
                  <div className="h-24 w-full bg-white/10 rounded-md animate-pulse" />
                  <div className="h-3 w-80 bg-white/10 rounded-md animate-pulse" />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-white/10 rounded-md animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-10 flex-1 bg-white/10 rounded-md animate-pulse" />
                    <div className="h-10 w-16 bg-white/10 rounded-md animate-pulse" />
                  </div>
                  <div className="h-3 w-64 bg-white/10 rounded-md animate-pulse" />
                </div>

                {/* Pricing Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-white/10 rounded-md animate-pulse" />
                    <div className="h-6 w-40 bg-white/10 rounded-md animate-pulse" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-white/10 rounded-md animate-pulse" />
                      <div className="h-10 w-full bg-white/10 rounded-md animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-28 bg-white/10 rounded-md animate-pulse" />
                      <div className="h-6 w-20 bg-white/10 rounded-md animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-white/10 rounded-md animate-pulse" />
                      <div className="h-6 w-24 bg-white/10 rounded-md animate-pulse" />
                    </div>
                  </div>

                  {/* Pricing Suggestions */}
                  <div className="space-y-3">
                    <div className="h-4 w-36 bg-white/10 rounded-md animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 w-full bg-white/10 rounded-md animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-white/10 rounded-md animate-pulse" />
                  <div className="h-20 w-full bg-white/10 rounded-md animate-pulse" />
                  <div className="h-3 w-72 bg-white/10 rounded-md animate-pulse" />
                </div>

                {/* Listing Options */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-white/10 rounded-md animate-pulse" />
                    <div className="h-4 w-4 bg-white/10 rounded-md animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-56 bg-white/10 rounded-md animate-pulse" />
                    <div className="h-4 w-4 bg-white/10 rounded-md animate-pulse" />
                  </div>
                </div>

                {/* Market Insights */}
                <div className="h-32 w-full bg-white/10 rounded-md animate-pulse" />

                {/* Submit Section */}
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <div className="h-4 w-24 bg-white/10 rounded-md animate-pulse" />
                      <div className="h-6 w-8 bg-white/10 rounded-md animate-pulse" />
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-4 w-28 bg-white/10 rounded-md animate-pulse" />
                      <div className="h-8 w-20 bg-white/10 rounded-md animate-pulse" />
                    </div>
                  </div>
                  <div className="h-12 w-full bg-white/10 rounded-md animate-pulse" />
                  <div className="mt-3 text-center">
                    <div className="h-3 w-80 bg-white/10 rounded-md animate-pulse mx-auto" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Authentication check (after loading is complete)
  if (!user && !isDemoMode) {
    return (
      <div className="header-spacer">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Wallet Connection Required</h3>
                <p className="text-gray-400 mb-4">Please connect your wallet to create marketplace listings.</p>
                <Button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                >
                  Connect Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !research) {
    return (
      <div className="header-spacer">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Error</h3>
                <p className="text-gray-400 mb-4">{error}</p>
                <Button
                  onClick={() => router.push('/research?section=library')}
                  variant="outline"
                  className="border-white/20 text-white bg-white/5 hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to My Library
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="header-spacer">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/research?section=library')}
            variant="outline"
            size="sm"
            className="border-white/20 text-white bg-white/5 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Library
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">List Research for Sale</h1>
            <p className="text-gray-400">Create a marketplace listing for your research</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-[#ef4444]/30 bg-[#ef4444]/20 text-[#ef4444]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-[#10b981]/30 bg-[#10b981]/20 text-[#10b981]">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Research Preview */}
        {research && (
          <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Research to List</CardTitle>
              <CardDescription>This research will be listed in the marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-medium text-white">{research.title}</h4>
                <p className="text-sm text-gray-400">{research.description}</p>
                <div className="flex gap-2">
                  <Badge variant="outline">{research.research_depth}</Badge>
                  {research.category && <Badge variant="secondary">{research.category}</Badge>}
                  <Badge variant="outline">{research.credits_used} credits</Badge>
                  <Badge variant="outline">{research.status}</Badge>
                </div>
                <div className="text-sm text-gray-400">Created: {new Date(research.created_at).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Listing Form */}
        <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <DollarSign className="h-6 w-6 text-[#10b981]" />
              Listing Details
            </CardTitle>
            <CardDescription>Configure how your research will appear in the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Title and Category */}
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
                <p className="text-sm text-gray-400">Be detailed about the value and insights your research provides.</p>
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
                <p className="text-sm text-gray-400">{selectedTags.length}/10 tags. Press Enter or click Add to add tags.</p>
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-medium text-white">Pricing & Revenue</h3>
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
                    <div className="text-lg font-medium text-gray-400">{platformFee.toFixed(2)} SEI</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Your Earnings</Label>
                    <div className="text-lg font-bold text-green-400">{estimatedEarnings.toFixed(2)} SEI</div>
                  </div>
                </div>

                {/* Pricing Suggestions */}
                {research && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-300">Pricing Suggestions</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {getPricingSuggestions().map((suggestion) => (
                        <Button
                          key={suggestion.label}
                          type="button"
                          variant="outline"
                          className="h-auto p-3 flex-col items-start border-white/20 text-white bg-white/5 hover:bg-white/10"
                          onClick={() => setValue('price_sei', suggestion.price.toString())}
                        >
                          <div className="font-medium">{suggestion.label}</div>
                          <div className="text-lg font-bold text-green-400">{suggestion.price} SEI</div>
                          <div className="text-xs text-gray-400 text-left">{suggestion.description}</div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Content */}
              <div className="space-y-2">
                <Label htmlFor="preview_content">Preview Content</Label>
                <Textarea
                  id="preview_content"
                  placeholder="Provide a preview of your research content to attract buyers (optional)"
                  rows={3}
                  {...register('preview_content')}
                  className={errors.preview_content ? 'border-red-500' : ''}
                />
                {errors.preview_content && <p className="text-sm text-red-500">{errors.preview_content.message}</p>}
                <p className="text-sm text-gray-400">This content will be visible to buyers before purchase.</p>
              </div>

              {/* Listing Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_featured" {...register('is_featured')} className="rounded border-gray-300" />
                  <Label htmlFor="is_featured" className="text-sm text-white">
                    Feature this listing (increases visibility)
                  </Label>
                  <Info className="h-4 w-4 text-gray-400" />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="auto_renew" {...register('auto_renew')} className="rounded border-gray-300" />
                  <Label htmlFor="auto_renew" className="text-sm text-white">
                    Auto-renew listing when it expires
                  </Label>
                  <Info className="h-4 w-4 text-gray-400" />
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
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Platform Fee</p>
                    <p className="text-lg font-bold text-gray-400">5%</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium text-white">Your Earnings</p>
                    <p className="text-2xl font-bold text-green-400">{estimatedEarnings.toFixed(2)} SEI</p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22]"
                  size="lg"
                >
                  {isSubmitting ? (
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

                <div className="mt-3 text-center text-sm text-gray-400">
                  <p>By creating this listing, you agree to our marketplace terms and conditions.</p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function ResearchListingPageLoading() {
  return (
    <div className="header-spacer">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#e9407a]/20 flex items-center justify-center">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#e9407a] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-[#e9407a] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-[#e9407a] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            <p className="text-gray-400">Loading listing form...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function ResearchListingPage() {
  return (
    <Suspense fallback={<ResearchListingPageLoading />}>
      <ResearchListingPageContent />
    </Suspense>
  );
}

'use client';

import React, { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Brain, Zap, Target, Info, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { ResearchFormData, CreditCosts } from '@/lib/types';

// Research form validation schema
const researchFormSchema = z.object({
  title: z.string().max(200, 'Title must be less than 200 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  research_type: z.enum(['public', 'private']),
  research_depth: z.enum(['simple', 'full', 'max']),
  query: z
    .string()
    .min(10, 'Research query must be at least 10 characters')
    .max(2000, 'Query must be less than 2000 characters'),
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  // Enhanced fields for better research
  source_preferences: z.string().max(500, 'Source preferences must be less than 500 characters').optional(),
  additional_context: z.string().max(1000, 'Additional context must be less than 1000 characters').optional(),
  specific_requirements: z.string().max(1000, 'Specific requirements must be less than 1000 characters').optional()
});

type ResearchFormSchema = z.infer<typeof researchFormSchema>;

// Credit costs for different research depths
const creditCosts: CreditCosts = {
  simple: 5,
  full: 10,
  max: 20
};

interface ResearchFormProps {
  onSubmit: (data: ResearchFormData) => Promise<void>;
  userCredits: number;
  isDemoMode: boolean;
  demoLimits?: { researchCount: number; maxResearch: number };
  isLoading?: boolean;
}

export const ResearchForm: React.FC<ResearchFormProps> = ({
  onSubmit,
  userCredits,
  isDemoMode,
  demoLimits,
  isLoading = false
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<ResearchFormSchema>({
    resolver: zodResolver(researchFormSchema),
    mode: 'onChange',
    defaultValues: {
      research_type: isDemoMode ? 'public' : 'private', // Demo users default to public, others to private
      research_depth: 'simple', // Simple research as default
      tags: []
    }
  });

  const watchedDepth = watch('research_depth');
  const watchedType = watch('research_type');
  const currentCredits = creditCosts[watchedDepth || 'simple'];

  const canAfford = isDemoMode ? true : userCredits >= currentCredits;
  const isDemoLimitReached = isDemoMode && demoLimits && demoLimits.researchCount >= demoLimits.maxResearch;

  const handleAddTag = () => {
    if (tagInput.trim() && selectedTags.length < 10 && !selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
      setValue('tags', [...selectedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter((tag) => tag !== tagToRemove);
    setSelectedTags(newTags);
    setValue('tags', newTags);
  };

  const handleFormSubmit = async (data: ResearchFormSchema) => {
    // Generate title if not provided
    const title = data.title?.trim() || generateTitleFromQuery(data.query);
    
    const formData: ResearchFormData = {
      ...data,
      title,
      tags: selectedTags
    };
    await onSubmit(formData);
  };

  // Helper function to generate title from query
  const generateTitleFromQuery = (query: string): string => {
    const truncated = query.length > 50 ? query.substring(0, 50) + '...' : query;
    return truncated.charAt(0).toUpperCase() + truncated.slice(1);
  };

  const getDepthDescription = (depth: string) => {
    switch (depth) {
      case 'simple':
        return 'Basic research with 2-3 sources, summary format';
      case 'full':
        return 'Comprehensive research with 5-7 sources, detailed analysis';
      case 'max':
        return 'In-depth research with 10+ sources, expert-level analysis';
      default:
        return '';
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'public':
        return 'Visible to everyone, can be shared and cited';
      case 'private':
        return 'Only visible to you, can be listed in marketplace';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="bg-white/5 backdrop-blur-ultra border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="h-6 w-6 text-[#e9407a]" />
            New Research Project
          </CardTitle>
          <CardDescription className="text-gray-400">
            Create a new research project with AI-powered analysis. Choose your research depth and type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Research Query - Main Field at Top */}
            <div className="space-y-2">
              <Label htmlFor="query" className="text-gray-300 text-lg font-medium">
                What do you want to research? *
              </Label>
              <Textarea
                id="query"
                placeholder="Describe your research question or topic in detail. Be specific about what you want to find out."
                rows={4}
                {...register('query')}
                className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-[#e9407a] focus:border-[#e9407a] ${errors.query ? 'border-[#ef4444]' : ''}`}
              />
              {errors.query && <p className="text-sm text-[#ef4444]">{errors.query.message}</p>}
              <p className="text-sm text-gray-400">The more specific your query, the better the research results will be.</p>
            </div>

            {/* Research Type and Depth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="research_type" className="text-gray-300">
                  Research Type *
                </Label>
                <Select 
                  onValueChange={(value) => setValue('research_type', value as 'public' | 'private')}
                  defaultValue={isDemoMode ? 'public' : 'private'}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2035] border-white/20">
                    <SelectItem value="public" className="text-white hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-[#10b981]" />
                        Public Research
                      </div>
                    </SelectItem>
                    {!isDemoMode && (
                      <SelectItem value="private" className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-[#ff8a00]" />
                          Private Research
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {watchedType && <p className="text-sm text-gray-400">{getTypeDescription(watchedType)}</p>}
                {isDemoMode && (
                  <p className="text-sm text-[#ff8a00]">Demo users can only create public research</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="research_depth" className="text-gray-300">
                  Research Depth *
                </Label>
                <Select 
                  onValueChange={(value) => setValue('research_depth', value as 'simple' | 'full' | 'max')}
                  defaultValue="simple"
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2035] border-white/20">
                    <SelectItem value="simple" className="text-white hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Simple</span>
                        <Badge variant="secondary" className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30">
                          {isDemoMode ? 'FREE' : `${creditCosts.simple} credits`}
                        </Badge>
                      </div>
                    </SelectItem>
                    {!isDemoMode && (
                      <>
                        <SelectItem value="full" className="text-white hover:bg-white/10">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Full</span>
                            <Badge variant="secondary" className="bg-[#ff8a00]/20 text-[#ff8a00] border-[#ff8a00]/30">
                              {creditCosts.full} credits
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="max" className="text-white hover:bg-white/10">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Max</span>
                            <Badge variant="secondary" className="bg-[#e9407a]/20 text-[#e9407a] border-[#e9407a]/30">
                              {creditCosts.max} credits
                            </Badge>
                          </div>
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {watchedDepth && <p className="text-sm text-gray-400">{getDepthDescription(watchedDepth)}</p>}
                {isDemoMode && (
                  <p className="text-sm text-[#ff8a00]">Demo users can only use simple research depth</p>
                )}
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="border-t border-white/10 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/5 p-0"
              >
                {showAdvancedSettings ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Advanced Settings
                <span className="text-sm text-gray-500">(optional)</span>
              </Button>
              
              {/* Advanced Settings Content */}
              {showAdvancedSettings && (
                <div className="mt-4 space-y-6 pl-6 border-l-2 border-white/10">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">
                      Research Title (Optional)
                    </Label>
                    <Input
                      id="title"
                      placeholder="Leave empty to auto-generate from your query"
                      {...register('title')}
                      className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-[#e9407a] focus:border-[#e9407a] ${errors.title ? 'border-[#ef4444]' : ''}`}
                    />
                    {errors.title && <p className="text-sm text-[#ef4444]">{errors.title.message}</p>}
                    <p className="text-sm text-gray-400">If not provided, we&apos;ll generate a title from your research query.</p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Provide additional context or requirements for your research"
                      rows={2}
                      {...register('description')}
                      className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-[#e9407a] focus:border-[#e9407a] ${errors.description ? 'border-[#ef4444]' : ''}`}
                    />
                    {errors.description && <p className="text-sm text-[#ef4444]">{errors.description.message}</p>}
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-gray-300">
                      Category (Optional)
                    </Label>
                    <Input
                      id="category"
                      placeholder="e.g., Technology, Science, Business, Health"
                      {...register('category')}
                      className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-[#e9407a] focus:border-[#e9407a] ${errors.category ? 'border-[#ef4444]' : ''}`}
                    />
                    {errors.category && <p className="text-sm text-[#ef4444]">{errors.category.message}</p>}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-gray-300">
                      Tags (Optional)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        placeholder="Add tags to help organize your research"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-[#e9407a] focus:border-[#e9407a]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTag}
                        disabled={!tagInput.trim() || selectedTags.length >= 10}
                        className="border-white/20 text-white bg-white/5 hover:bg-white/10"
                      >
                        Add
                      </Button>
                    </div>
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-400">{selectedTags.length}/10 tags. Press Enter or click Add to add tags.</p>
                  </div>

                  {/* Source Preferences */}
                  <div className="space-y-2">
                    <Label htmlFor="source_preferences" className="text-gray-300">
                      Source Preferences
                    </Label>
                    <Textarea
                      id="source_preferences"
                      placeholder="Specify preferred sources (e.g., academic papers, news articles, government reports, specific websites)"
                      rows={2}
                      {...register('source_preferences')}
                      className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-[#e9407a] focus:border-[#e9407a] ${errors.source_preferences ? 'border-[#ef4444]' : ''}`}
                    />
                    {errors.source_preferences && <p className="text-sm text-[#ef4444]">{errors.source_preferences.message}</p>}
                    <p className="text-sm text-gray-400">Help AI find the most relevant and credible sources for your research.</p>
                  </div>

                  {/* Additional Context */}
                  <div className="space-y-2">
                    <Label htmlFor="additional_context" className="text-gray-300">
                      Additional Context
                    </Label>
                    <Textarea
                      id="additional_context"
                      placeholder="Provide background information, current knowledge, or specific focus areas"
                      rows={2}
                      {...register('additional_context')}
                      className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-[#e9407a] focus:border-[#e9407a] ${errors.additional_context ? 'border-[#ef4444]' : ''}`}
                    />
                    {errors.additional_context && <p className="text-sm text-[#ef4444]">{errors.additional_context.message}</p>}
                    <p className="text-sm text-gray-400">Add context to help AI understand your research goals better.</p>
                  </div>

                  {/* Specific Requirements */}
                  <div className="space-y-2">
                    <Label htmlFor="specific_requirements" className="text-gray-300">
                      Specific Requirements
                    </Label>
                    <Textarea
                      id="specific_requirements"
                      placeholder="Specific format requirements, analysis depth, geographic focus, time period, etc."
                      rows={2}
                      {...register('specific_requirements')}
                      className={`bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-[#e9407a] focus:border-[#e9407a] ${errors.specific_requirements ? 'border-[#ef4444]' : ''}`}
                    />
                    {errors.specific_requirements && <p className="text-sm text-[#ef4444]">{errors.specific_requirements.message}</p>}
                    <p className="text-sm text-gray-400">Specify any particular requirements for the research output.</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Assist Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ai_assist"
                checked={showAiAssist}
                onChange={(e) => setShowAiAssist(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-[#e9407a] focus:ring-[#e9407a]"
              />
              <Label htmlFor="ai_assist" className="text-sm text-gray-300">
                Enable AI-assisted query refinement
              </Label>
              <Info className="h-4 w-4 text-gray-400" />
            </div>

            {/* AI Assist Panel */}
            {showAiAssist && (
              <Card className="bg-[#3b82f6]/20 border-[#3b82f6]/30 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <p className="text-sm text-[#3b82f6]">
                    AI will help refine your query for better research results. This may suggest additional keywords, clarify
                    ambiguous terms, or expand on your research scope.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Credit Information and Submit */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-300">Required Credits</p>
                  <p className="text-2xl font-bold text-[#e9407a]">{currentCredits} credits</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium text-gray-300">Your Credits</p>
                  <p className={`text-2xl font-bold ${canAfford ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {isDemoMode ? '∞' : userCredits}
                  </p>
                </div>
              </div>

              {/* Alerts */}
              {!canAfford && !isDemoMode && (
                <Alert className="border-[#ef4444]/30 bg-[#ef4444]/20 text-[#ef4444]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient credits. You need {currentCredits} credits but have {userCredits}.
                    <Button variant="link" className="p-0 h-auto text-[#ef4444] underline">
                      Buy more credits
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {isDemoMode && isDemoLimitReached && (
                <Alert className="border-[#ff8a00]/30 bg-[#ff8a00]/20 text-[#ff8a00]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>Demo limit reached! You&apos;ve used {demoLimits?.researchCount} of {demoLimits?.maxResearch} free research attempts.</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="link" className="p-0 h-auto text-[#ff8a00] underline text-left">
                          Connect wallet & add credits for unlimited access
                        </Button>
                        <span className="text-sm opacity-75">or wait 24 hours for another free research</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {isDemoMode && !isDemoLimitReached && (
                <Alert className="border-[#3b82f6]/30 bg-[#3b82f6]/20 text-[#3b82f6] mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>Demo Mode: You get 1 free research per day. Research will be public and simple depth only.</p>
                      <p className="text-sm">Connect your wallet and add credits for private research, advanced depths, and unlimited access.</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isValid || !canAfford || isLoading || (isDemoMode && isDemoLimitReached)}
                className="w-full bg-gradient-to-r from-[#e9407a] to-[#ff8a00] hover:from-[#d63384] hover:to-[#e67e22] text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Research...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Start Research ({currentCredits} credits)
                  </>
                )}
              </Button>

              {isDemoMode && !isDemoLimitReached && (
                <p className="text-center text-sm text-gray-400 mt-2">
                  Demo mode: Free public research with simple analysis. Connect wallet for full features.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import { usePageTitle } from '@/lib/hooks/usePageTitle';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDemoMode } from '@/lib/hooks/useDemoMode';
import { SEIPaymentIntegration } from '@/components/explore/SEIPaymentIntegration';
import { marketplaceService } from '@/lib/database';
import { ResearchItemWithUser, MarketplaceListingWithResearch } from '@/lib/types';

export default function ResearchDetailPage() {
  usePageTitle('Research Details');
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isDemoMode, demoUser } = useDemoMode();
  const researchId = params.id as string;

  const [research, setResearch] = useState<ResearchItemWithUser | null>(null);
  const [listing, setListing] = useState<MarketplaceListingWithResearch | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const currentUser = user || demoUser;

  // Get section from search params for enhanced navigation
  // const section = searchParams.get('section'); // Currently unused

  // Refs for scroll tracking
  const heroImageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showIndexGuide, setShowIndexGuide] = useState(false);
  const [activeHeading, setActiveHeading] = useState('');
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  // Enhanced back navigation using browser history
  const handleBackNavigation = useCallback(() => {
    router.back();
  }, [router]);

  const fetchResearchItem = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build URL with authentication parameters
      const url = new URL(`/api/research/${researchId}`, window.location.origin);

      if (currentUser) {
        if (isDemoMode) {
          url.searchParams.set('demo_ip', currentUser.demo_ip || '');
          url.searchParams.set('is_demo', 'true');
        } else {
          url.searchParams.set('wallet', currentUser.wallet_address);
          url.searchParams.set('is_demo', 'false');
        }
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 404) {
          setError('Research item not found');
        } else if (response.status === 403) {
          setError('Access denied. This research is private and requires purchase.');
        } else {
          setError('Failed to fetch research item');
        }
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setResearch(result.data);

        // If it's a private research item, check if it's listed on marketplace
        if (result.data.research_type === 'private') {
          await fetchMarketplaceListing(result.data.id);
        }
      } else {
        setError('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching research item:', error);
      setError('Failed to fetch research item');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [researchId, currentUser, isDemoMode]);

  const fetchMarketplaceListing = useCallback(async (researchId: string) => {
    try {
      const listings = await marketplaceService.getMarketplaceListings(1, 50);
      const matchingListing = listings.data.find((l) => l.research_id === researchId);

      if (matchingListing) {
        setListing(matchingListing);
        await checkUserAccess(matchingListing.id);
      }
    } catch (error) {
      console.error('Error fetching marketplace listing:', error);
    }
  }, []);

  const checkUserAccess = useCallback(
    async (listingId: string) => {
      if (!currentUser) return;

      try {
        const userIdentifier = isDemoMode ? currentUser.demo_ip || '' : currentUser.id;
        const access = await marketplaceService.hasAccess(listingId, userIdentifier, isDemoMode);
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      }
    },
    [currentUser, isDemoMode]
  );

  useEffect(() => {
    if (researchId && !isInitialized) {
      fetchResearchItem();
    }
  }, [researchId, fetchResearchItem, isInitialized]);

  // Extract headings from markdown content and setup scroll tracking
  useEffect(() => {
    if (!research?.result_content) return;

    // Extract headings from markdown content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const extractedHeadings: { id: string; text: string; level: number }[] = [];
    let match;

    // Reset regex lastIndex to ensure proper matching
    headingRegex.lastIndex = 0;

    while ((match = headingRegex.exec(research.result_content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      extractedHeadings.push({ id, text, level });
    }

    setHeadings(extractedHeadings);

    // Scroll tracking
    const handleScroll = () => {
      if (!heroImageRef.current) return;

      const heroImageBottom = heroImageRef.current.offsetTop + heroImageRef.current.offsetHeight;
      const scrollPosition = window.scrollY;

      // Show index guide after scrolling past hero image
      setShowIndexGuide(scrollPosition > heroImageBottom - 100);

      // Find active heading
      if (extractedHeadings.length > 0) {
        const headingElements = extractedHeadings.map((h) => document.getElementById(h.id)).filter(Boolean);

        for (let i = headingElements.length - 1; i >= 0; i--) {
          const element = headingElements[i];
          if (element && element.offsetTop <= scrollPosition + 150) {
            setActiveHeading(extractedHeadings[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [research?.result_content]);

  // Function to scroll to heading
  const scrollToHeading = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Custom components for ReactMarkdown
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const markdownComponents = {
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      return !inline && language ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          className="rounded-lg border border-white/20 my-4"
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="text-[#ff8a00] bg-white/10 px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children, ...props }: any) => (
      <h1 className="text-3xl font-bold text-white mb-6 mt-8 border-b border-white/20 pb-2 scroll-mt-24" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-2xl font-bold text-white mb-4 mt-6 border-b border-white/10 pb-2 scroll-mt-24" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-xl font-bold text-white mb-3 mt-5 scroll-mt-24" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-lg font-bold text-white mb-2 mt-4 scroll-mt-24" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: any) => (
      <h5 className="text-base font-bold text-white mb-2 mt-3 scroll-mt-24" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: any) => (
      <h6 className="text-sm font-bold text-white mb-1 mt-2 scroll-mt-24" {...props}>
        {children}
      </h6>
    ),
    p: ({ children, ...props }: any) => (
      <p className="text-gray-300 leading-relaxed mb-4" {...props}>
        {children}
      </p>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="text-white font-semibold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="text-gray-200" {...props}>
        {children}
      </em>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-[#e9407a] pl-4 italic text-gray-400 bg-white/5 p-4 rounded my-4" {...props}>
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="text-gray-300 list-disc pl-6 mb-4" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="text-gray-300 list-decimal pl-6 mb-4" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="mb-1 text-gray-300" {...props}>
        {children}
      </li>
    ),
    a: ({ children, ...props }: any) => (
      <a className="text-[#3b82f6] no-underline hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ),
    img: ({ alt, ...props }: any) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="rounded-lg border border-white/20 w-full shadow-lg my-4" alt={alt || ''} {...props} />
    ),
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-6">
        <table className="border-collapse border border-white/20 rounded-lg overflow-hidden w-full" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
    tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
    tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
    th: ({ children, ...props }: any) => (
      <th className="border border-white/20 bg-white/10 p-3 text-white font-semibold text-left" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="border border-white/20 p-3 text-gray-300" {...props}>
        {children}
      </td>
    ),
    hr: ({ ...props }: any) => <hr className="border-white/20 my-8" {...props} />,
    del: ({ children, ...props }: any) => (
      <del className="text-gray-500 line-through" {...props}>
        {children}
      </del>
    ),
    input: ({ ...props }: any) => <input className="accent-[#e9407a] mr-2" {...props} />
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // const handlePurchase = () => {
  //   if (!currentUser) {
  //     setError('Please connect your wallet to purchase research');
  //     return;
  //   }
  //   
  //   if (!listing) {
  //     setError('Research not available for purchase');
  //     return;
  //   }
  //   
  //   setShowPayment(true);
  // };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setHasAccess(true);
    setError(null);

    // Refresh the research item to show full content
    await fetchResearchItem();
  };

  const handlePaymentFailure = (error: string) => {
    setShowPayment(false);
    setError(`Payment failed: ${error}`);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="header-spacer">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Loading Skeleton */}
            <div className="animate-pulse space-y-8">
              {/* Back Button Skeleton */}
              <div className="h-10 w-24 bg-white/10 rounded"></div>

              {/* Article Layout Skeleton */}
              <div className="relative">
                <article className="space-y-8">
                  {/* Title Skeleton */}
                  <header>
                    <div className="space-y-3">
                      <div className="h-12 md:h-14 bg-white/10 rounded w-full"></div>
                      <div className="h-12 md:h-14 bg-white/10 rounded w-3/4"></div>
                    </div>
                  </header>

                  {/* Description Skeleton */}
                  <div className="space-y-3">
                    <div className="h-6 bg-white/10 rounded w-full"></div>
                    <div className="h-6 bg-white/10 rounded w-5/6"></div>
                    <div className="h-6 bg-white/10 rounded w-2/3"></div>
                  </div>

                  {/* Author/Researcher Info Skeleton */}
                  <div className="flex items-center gap-4 py-4 border-t border-b border-white/10">
                    <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-5 bg-white/10 rounded w-24"></div>
                        <div className="h-4 bg-white/10 rounded w-1"></div>
                        <div className="h-4 bg-white/10 rounded w-20"></div>
                      </div>
                      <div className="h-4 bg-white/10 rounded w-32"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-white/10 rounded w-16"></div>
                    </div>
                  </div>

                  {/* Hero Image Skeleton */}
                  <div className="relative w-full h-96 md:h-[500px] bg-white/10 rounded-lg"></div>

                  {/* Content Skeleton */}
                  <div className="max-w-none space-y-6">
                    {/* Simulated content blocks */}
                    <div className="space-y-4">
                      <div className="h-8 bg-white/10 rounded w-1/2"></div>
                      <div className="space-y-3">
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="h-7 bg-white/10 rounded w-1/3"></div>
                      <div className="space-y-3">
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-5/6"></div>
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                      </div>
                    </div>

                    {/* Code block skeleton */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-4 bg-white/10 rounded w-1/2"></div>
                      <div className="h-4 bg-white/10 rounded w-5/6"></div>
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    </div>

                    <div className="space-y-4">
                      <div className="h-6 bg-white/10 rounded w-2/5"></div>
                      <div className="space-y-3">
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-4/5"></div>
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                      </div>
                    </div>

                    {/* List skeleton */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-white/10 rounded-full"></div>
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-white/10 rounded-full"></div>
                        <div className="h-4 bg-white/10 rounded w-2/3"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-white/10 rounded-full"></div>
                        <div className="h-4 bg-white/10 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Index Guide Skeleton - Sticky on the right */}
                <div className="hidden lg:block fixed top-1/2 right-8 transform -translate-y-1/2 z-10">
                  <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-lg p-4 max-w-xs">
                    <div className="h-4 bg-white/10 rounded w-20 mb-3 border-b border-white/20 pb-2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-white/10 rounded w-32"></div>
                      <div className="h-3 bg-white/10 rounded w-28 ml-2"></div>
                      <div className="h-3 bg-white/10 rounded w-24 ml-4"></div>
                      <div className="h-3 bg-white/10 rounded w-30"></div>
                      <div className="h-3 bg-white/10 rounded w-26 ml-2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !research) {
    return (
      <div className="header-spacer">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" onClick={handleBackNavigation} className="mb-6 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <Alert className="border-red-500/30 bg-red-500/20 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Research item not found'}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  // Show payment modal
  if (showPayment && listing && currentUser) {
    return (
      <div className="header-spacer">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" onClick={handlePaymentCancel} className="mb-6 text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Research
            </Button>

            <SEIPaymentIntegration
              listing={listing}
              userWalletAddress={currentUser.wallet_address}
              userSEIBalance="100.0" // This should come from actual wallet balance
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailure={handlePaymentFailure}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="header-spacer">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" onClick={handleBackNavigation} className="mb-6 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Article Layout */}
          <div className="relative">
            <article className="space-y-8">
              {/* Title */}
              <header>
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">{research.title}</h1>
              </header>

              {/* Description */}
              {research.description && <div className="text-lg text-gray-300 leading-relaxed">{research.description}</div>}

              {/* Author/Researcher Info */}
              <div className="flex items-center gap-4 py-4 border-t border-b border-white/10">
                <div className="w-12 h-12 bg-gradient-to-r from-[#e9407a] to-[#ff8a00] rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{research.user?.username || 'Anonymous'}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-400">
                      {new Date(research.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 font-mono">
                    {research.user?.wallet_address
                      ? `${research.user.wallet_address.slice(0, 6)}...${research.user.wallet_address.slice(-4)}`
                      : 'Unknown'}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-400">
                  <div>7 min read</div>
                </div>
              </div>

              {/* Hero Image */}
              {research.image_url && (
                <div ref={heroImageRef} className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden">
                  <Image
                    src={research.image_url}
                    alt={research.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                    priority
                  />
                </div>
              )}

              {/* Research Content */}
              {research.result_content && (
                <div ref={contentRef} className="max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'append' }]]}
                    components={markdownComponents}
                  >
                    {research.result_content}
                  </ReactMarkdown>
                </div>
              )}
            </article>

            {/* Index Guide - Sticky on the right */}
            {showIndexGuide && headings.length > 0 && (
              <div className="hidden lg:block fixed top-1/2 right-8 transform -translate-y-1/2 z-10">
                <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-lg p-4 max-w-xs">
                  <h3 className="text-sm font-semibold text-white mb-3 border-b border-white/20 pb-2">On this page</h3>
                  <nav className="space-y-1">
                    {headings.map((heading) => (
                      <button
                        key={heading.id}
                        onClick={() => scrollToHeading(heading.id)}
                        className={`block w-full text-left text-sm py-1 px-2 rounded transition-colors
                          ${heading.level === 1 ? 'font-medium' : ''}
                          ${heading.level === 2 ? 'ml-2' : ''}
                          ${heading.level === 3 ? 'ml-4' : ''}
                          ${heading.level >= 4 ? 'ml-6' : ''}
                          ${
                            activeHeading === heading.id
                              ? 'text-[#e9407a] bg-[#e9407a]/10 border-l-2 border-[#e9407a]'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          }`}
                      >
                        {heading.text}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

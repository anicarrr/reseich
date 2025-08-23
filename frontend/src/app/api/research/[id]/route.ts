import { NextRequest, NextResponse } from 'next/server';
import { researchService, userService, marketplaceService } from '@/lib/database';
import { ResearchItemWithUser } from '@/lib/types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: researchId } = await params;
    const { searchParams } = new URL(request.url);
    const userWallet = searchParams.get('wallet');
    const demoIp = searchParams.get('demo_ip');
    const isDemoMode = searchParams.get('is_demo') === 'true';

    // Get research item by ID
    const research = await researchService.getResearchById(researchId);
    if (!research) {
      return NextResponse.json({ error: 'Research not found' }, { status: 404 });
    }

    // Get user data for the research item
    const user = await userService.getUserById(research.user_id);
    
    // Create ResearchItemWithUser object
    const researchWithUser: ResearchItemWithUser = {
      ...research,
      user: user ? {
        username: user.username,
        wallet_address: user.wallet_address
      } : undefined
    };

    // For public research, return full content
    if (research.research_type === 'public') {
      return NextResponse.json({
        success: true,
        data: researchWithUser
      });
    }

    // For private research, check access permissions
    if (research.research_type === 'private') {
      let hasAccess = false;
      let isOwner = false;

      // Check if user is the owner
      if (userWallet && user?.wallet_address === userWallet) {
        isOwner = true;
        hasAccess = true;
      }

      // If not owner, check marketplace access
      if (!hasAccess && (userWallet || demoIp)) {
        // Find marketplace listing for this research
        const listings = await marketplaceService.getMarketplaceListings(1, 50);
        const listing = listings.data.find(l => l.research_id === researchId);
        
        if (listing) {
          const userIdentifier = isDemoMode ? demoIp : userWallet;
          if (userIdentifier) {
            hasAccess = await marketplaceService.hasAccess(listing.id, userIdentifier, isDemoMode);
          }
        }
      }

      // If no access, return limited data (metadata only, no results)
      if (!hasAccess) {
        const limitedResearch: ResearchItemWithUser = {
          ...researchWithUser,
          result_content: undefined,
          result_file_url: undefined,
          result_metadata: undefined
        };

        return NextResponse.json({
          success: true,
          data: limitedResearch,
          access_required: true,
          is_private: true
        });
      }
    }

    // User has access or research is public
    return NextResponse.json({
      success: true,
      data: researchWithUser
    });
  } catch (error) {
    console.error('Error fetching research item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

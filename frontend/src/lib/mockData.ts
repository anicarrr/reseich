import { ResearchItem, MarketplaceListing, Transaction, ChatSession, ChatMessage, User } from './types';
import { generateMockId, generateMockDate } from './utils';

// Helper function to convert Date to ISO string for mock data
const mockDate = (daysAgo: number = 0): string => {
  return generateMockDate(daysAgo).toISOString();
};

// Mock Users
export const mockUsers: User[] = [
  {
    id: generateMockId(),
    wallet_address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    email: 'alice@example.com',
    username: 'Alice Researcher',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    credits: 150,
    is_demo_user: false,
    created_at: mockDate(30),
    updated_at: mockDate(1)
  },
  {
    id: generateMockId(),
    wallet_address: '0x8ba1f109551bD432803012645Hac136c772c3c7b',
    email: 'bob@example.com',
    username: 'Bob Scholar',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    credits: 75,
    is_demo_user: false,
    created_at: mockDate(25),
    updated_at: mockDate(2)
  },
  {
    id: generateMockId(),
    wallet_address: '0x1234567890123456789012345678901234567890',
    email: 'demo@example.com',
    username: 'Demo User',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    credits: 0,
    is_demo_user: true,
    demo_ip: '192.168.1.100',
    demo_expires_at: mockDate(7),
    created_at: mockDate(1),
    updated_at: mockDate(1)
  }
];

// Mock Research Items
export const mockResearchItems: ResearchItem[] = [
  {
    id: generateMockId(),
    user_id: mockUsers[0].id,
    title: 'AI in Healthcare: Current Trends and Future Prospects',
    description:
      'Comprehensive analysis of artificial intelligence applications in healthcare, including machine learning diagnostics, robotic surgery, and personalized medicine.',
    research_type: 'public',
    research_depth: 'max',
    query: 'AI healthcare trends 2024 machine learning diagnostics robotic surgery personalized medicine',
    result_content: 'This comprehensive research explores the current state of AI in healthcare...',
    result_file_url: '/research/ai-healthcare-2024.pdf',
    image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=faces',
    credits_used: 20,
    status: 'completed',
    tags: ['AI', 'Healthcare', 'Technology', 'Machine Learning'],
    category: 'Healthcare',
    completed_at: mockDate(2),
    created_at: mockDate(5),
    updated_at: mockDate(2)
  },
  {
    id: generateMockId(),
    user_id: mockUsers[1].id,
    title: 'Blockchain Scalability Solutions: Layer 2 and Beyond',
    description:
      'Analysis of current blockchain scalability challenges and innovative solutions including layer 2 protocols, sharding, and cross-chain bridges.',
    research_type: 'public',
    research_depth: 'full',
    query: 'blockchain scalability layer 2 sharding cross-chain bridges',
    result_content: 'Blockchain technology faces significant scalability challenges...',
    result_file_url: '/research/blockchain-scalability-2024.pdf',
    image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop&crop=faces',
    credits_used: 10,
    status: 'completed',
    tags: ['Blockchain', 'Scalability', 'Technology', 'Layer 2'],
    category: 'Blockchain',
    completed_at: mockDate(3),
    created_at: mockDate(8),
    updated_at: mockDate(3)
  },
  {
    id: generateMockId(),
    user_id: mockUsers[0].id,
    title: 'Sustainable Energy Markets: Investment Opportunities',
    description:
      'Market analysis of renewable energy investments, focusing on solar, wind, and battery storage technologies.',
    research_type: 'private',
    research_depth: 'simple',
    query: 'renewable energy market analysis 2024 solar wind battery storage',
    result_content: 'The renewable energy sector is experiencing unprecedented growth...',
    result_file_url: '/research/sustainable-energy-2024.pdf',
    image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop&crop=faces',
    credits_used: 5,
    status: 'completed',
    tags: ['Energy', 'Finance', 'Sustainability', 'Investment'],
    category: 'Finance',
    completed_at: mockDate(1),
    created_at: mockDate(3),
    updated_at: mockDate(1)
  },
  {
    id: generateMockId(),
    user_id: mockUsers[1].id,
    title: 'Quantum Computing: Current State and Applications',
    description:
      'Overview of quantum computing development, including qubit technologies, quantum algorithms, and practical applications.',
    research_type: 'public',
    research_depth: 'max',
    query: 'quantum computing qubit technologies quantum algorithms applications',
    result_content: 'Quantum computing represents a paradigm shift in computational power...',
    result_file_url: '/research/quantum-computing-2024.pdf',
    image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop&crop=faces',
    credits_used: 20,
    status: 'completed',
    tags: ['Quantum Computing', 'Technology', 'Algorithms', 'Research'],
    category: 'Technology',
    completed_at: mockDate(1),
    created_at: mockDate(1),
    updated_at: mockDate(1)
  },
  {
    id: generateMockId(),
    user_id: mockUsers[0].id,
    title: 'DeFi Yield Farming Strategies: Risk and Reward Analysis',
    description:
      'Comprehensive analysis of DeFi yield farming strategies, including risk assessment and optimal portfolio allocation.',
    research_type: 'private',
    research_depth: 'full',
    query: 'DeFi yield farming strategies risk assessment portfolio allocation',
    result_content: 'Decentralized Finance (DeFi) has revolutionized traditional financial services...',
    result_file_url: '/research/defi-yield-farming-2024.pdf',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop&crop=faces',
    credits_used: 10,
    status: 'completed',
    tags: ['DeFi', 'Finance', 'Cryptocurrency', 'Investment'],
    category: 'Finance',
    completed_at: mockDate(4),
    created_at: mockDate(10),
    updated_at: mockDate(4)
  },
  {
    id: generateMockId(),
    user_id: mockUsers[1].id,
    title: 'Climate Change Impact on Global Supply Chains',
    description: 'Analysis of how climate change affects global supply chains and strategies for building resilience.',
    research_type: 'public',
    research_depth: 'simple',
    query: 'climate change global supply chains resilience strategies',
    result_content: 'Climate change poses significant risks to global supply chains...',
    result_file_url: '/research/climate-supply-chains-2024.pdf',
    credits_used: 5,
    status: 'completed',
    tags: ['Climate Change', 'Supply Chain', 'Sustainability', 'Business'],
    category: 'Business',
    completed_at: mockDate(6),
    created_at: mockDate(12),
    updated_at: mockDate(6)
  }
];

// Mock Marketplace Listings
export const mockMarketplaceListings: MarketplaceListing[] = [
  {
    id: generateMockId(),
    research_id: mockResearchItems[2].id,
    user_id: mockUsers[0].id,
    price_sei: '2.5',
    price_usd: 1.25,
    description:
      'Exclusive market analysis of renewable energy investment opportunities. Includes detailed financial projections and risk assessments.',
    preview_content:
      'The renewable energy sector is experiencing unprecedented growth with solar and wind technologies leading the charge...',
    is_active: true,
    views_count: 45,
    purchase_count: 3,
    rating_average: 4.8,
    rating_count: 3,
    created_at: mockDate(2),
    updated_at: mockDate(1)
  },
  {
    id: generateMockId(),
    research_id: mockResearchItems[4].id,
    user_id: mockUsers[0].id,
    price_sei: '5.0',
    price_usd: 2.5,
    description: 'Comprehensive DeFi yield farming analysis with proven strategies and risk management techniques.',
    preview_content: 'Decentralized Finance (DeFi) has revolutionized traditional financial services by providing...',
    is_active: true,
    views_count: 78,
    purchase_count: 12,
    rating_average: 4.6,
    rating_count: 12,
    created_at: mockDate(5),
    updated_at: mockDate(2)
  }
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
  {
    id: generateMockId(),
    user_id: mockUsers[0].id,
    type: 'credit_purchase',
    amount_sei: '10.0',
    amount_usd: 5.0,
    credits_amount: 100,
    status: 'completed',
    is_demo: false,
    transaction_hash: '0x1234567890abcdef1234567890abcdef12345678',
    created_at: mockDate(1),
    updated_at: mockDate(1)
  },
  {
    id: generateMockId(),
    user_id: mockUsers[0].id,
    type: 'research_sale',
    amount_sei: '2.5',
    amount_usd: 1.25,
    research_id: mockResearchItems[2].id,
    marketplace_listing_id: mockMarketplaceListings[0].id,
    status: 'completed',
    is_demo: false,
    transaction_hash: '0xabcdef1234567890abcdef1234567890abcdef12',
    created_at: mockDate(1),
    updated_at: mockDate(1)
  },
  {
    id: generateMockId(),
    user_id: mockUsers[1].id,
    type: 'credit_purchase',
    amount_sei: '5.0',
    amount_usd: 2.5,
    credits_amount: 50,
    status: 'completed',
    is_demo: false,
    transaction_hash: '0x567890abcdef1234567890abcdef1234567890ab',
    created_at: mockDate(2),
    updated_at: mockDate(2)
  }
];

// Mock Chat Sessions
export const mockChatSessions: ChatSession[] = [
  {
    id: generateMockId(),
    user_id: mockUsers[0].id,
    title: 'AI Research Assistance',
    is_demo: false,
    message_count: 8,
    created_at: mockDate(2),
    updated_at: mockDate(1)
  },
  {
    id: generateMockId(),
    user_id: mockUsers[0].id,
    title: 'Blockchain Technology Discussion',
    is_demo: false,
    message_count: 12,
    created_at: mockDate(5),
    updated_at: mockDate(3)
  },
  {
    id: generateMockId(),
    user_id: mockUsers[2].id,
    title: 'Demo Research Questions',
    is_demo: true,
    demo_ip: '192.168.1.100',
    message_count: 3,
    created_at: mockDate(1),
    updated_at: mockDate(1)
  }
];

// Mock Chat Messages
export const mockChatMessages: ChatMessage[] = [
  {
    id: generateMockId(),
    session_id: mockChatSessions[0].id,
    content: 'Can you help me understand the current state of AI in healthcare?',
    is_user: true,
    message_type: 'text',
    created_at: mockDate(2)
  },
  {
    id: generateMockId(),
    session_id: mockChatSessions[0].id,
    content:
      "I'd be happy to help! AI in healthcare is currently experiencing rapid growth across several key areas:\n\n1. **Medical Imaging**: AI algorithms are improving diagnostic accuracy in radiology\n2. **Drug Discovery**: Machine learning is accelerating pharmaceutical research\n3. **Personalized Medicine**: AI is enabling tailored treatment plans\n4. **Administrative Tasks**: Automation of routine healthcare processes\n\nWould you like me to dive deeper into any of these areas?",
    is_user: false,
    message_type: 'markdown',
    created_at: mockDate(2)
  },
  {
    id: generateMockId(),
    session_id: mockChatSessions[1].id,
    content: 'What are the main challenges facing blockchain scalability?',
    is_user: true,
    message_type: 'text',
    created_at: mockDate(5)
  },
  {
    id: generateMockId(),
    session_id: mockChatSessions[1].id,
    content:
      'Blockchain scalability faces several key challenges:\n\n- **Transaction Throughput**: Limited transactions per second\n- **Storage Growth**: Ever-expanding blockchain size\n- **Network Congestion**: High fees during peak usage\n- **Consensus Mechanisms**: Trade-offs between security and speed\n\nSolutions include Layer 2 protocols, sharding, and alternative consensus mechanisms.',
    is_user: false,
    message_type: 'markdown',
    created_at: mockDate(5)
  }
];

// Mock Categories
export const mockCategories = [
  'Technology',
  'Healthcare',
  'Finance',
  'Business',
  'Science',
  'Education',
  'Environment',
  'Social Sciences',
  'Engineering',
  'Arts & Humanities'
];

// Mock Tags
export const mockTags = [
  'AI',
  'Blockchain',
  'Machine Learning',
  'DeFi',
  'Sustainability',
  'Research',
  'Innovation',
  'Data Science',
  'Cryptocurrency',
  'Healthcare',
  'Finance',
  'Technology',
  'Climate Change',
  'Quantum Computing',
  'Supply Chain'
];

// Mock Credit Purchase Options
export const mockCreditOptions = [
  {
    amount_sei: '5.0',
    credits_amount: 50,
    price_usd: 2.5,
    popular: false
  },
  {
    amount_sei: '10.0',
    credits_amount: 100,
    price_usd: 5.0,
    popular: true
  },
  {
    amount_sei: '25.0',
    credits_amount: 250,
    price_usd: 12.5,
    popular: false
  },
  {
    amount_sei: '50.0',
    credits_amount: 500,
    price_usd: 25.0,
    popular: false
  }
];

// Mock Research Status Updates
export const mockResearchStatuses = [
  {
    id: mockResearchItems[3].id,
    status: 'completed',
    progress: 100,
    estimated_completion: mockDate(1),
    current_step: 'Research completed'
  }
];

// Mock Notifications
export const mockNotifications = [
  {
    id: generateMockId(),
    type: 'success',
    title: 'Research Completed',
    message: 'Your research on "Quantum Computing" has been completed and is ready for review.',
    timestamp: mockDate(1),
    read: false
  },
  {
    id: generateMockId(),
    type: 'info',
    title: 'Credit Purchase Successful',
    message: 'You have successfully purchased 100 credits for 10 SEI.',
    timestamp: mockDate(2),
    read: true
  },
  {
    id: generateMockId(),
    type: 'warning',
    title: 'Demo Mode Limit',
    message: 'You have used 8 out of 10 available chat messages in demo mode.',
    timestamp: mockDate(1),
    read: false
  }
];

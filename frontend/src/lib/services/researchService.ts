import type {
  ResearchFormData,
  ResearchExecutionRequest,
  ResearchExecutionResponse,
  ResearchItem,
  ApiResponse
} from '@/lib/types';
import { SEI_CONSTANTS } from '@/lib/constants';

// n8n webhook configuration
const N8N_WEBHOOK_URL = SEI_CONSTANTS.WEBHOOK_URL;
const N8N_API_KEY = process.env.NEXT_PUBLIC_N8N_API_KEY;

export interface ResearchExecutionOptions {
  userId?: string;
  demoMode: boolean;
  sessionId: string;
  additionalContext?: string;
  specificRequirements?: string;
  sourcePreferences?: string;
}

export class ResearchService {
  /**
   * Get research item by ID
   */
  static async getResearchById(researchId: string): Promise<ResearchItem | null> {
    try {
      if (!N8N_WEBHOOK_URL) {
        throw new Error('N8N webhook URL not configured');
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(N8N_API_KEY && { Authorization: `Bearer ${N8N_API_KEY}` })
        },
        body: JSON.stringify({
          action: 'get_research',
          research_id: researchId,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'reseich-frontend',
            version: '1.0.0'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get research by ID:', error);
      return null;
    }
  }

  /**
   * Execute a new research project via n8n webhook
   */
  static async executeResearch(
    formData: ResearchFormData,
    options: ResearchExecutionOptions
  ): Promise<ResearchExecutionResponse> {
    try {
      if (!N8N_WEBHOOK_URL) {
        throw new Error('N8N webhook URL not configured');
      }

      const executionRequest: ResearchExecutionRequest = {
        query: formData.query,
        depth: formData.research_depth,
        type: formData.research_type,
        userId: options.userId,
        demoMode: options.demoMode,
        sessionId: options.sessionId,
        additionalContext: options.additionalContext,
        specificRequirements: options.specificRequirements,
        sourcePreferences: options.sourcePreferences
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(N8N_API_KEY && { Authorization: `Bearer ${N8N_API_KEY}` })
        },
        body: JSON.stringify({
          action: 'start_research',
          data: executionRequest,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'reseich-frontend',
            version: '1.0.0'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        researchId: result.research_id,
        estimatedCompletion: result.estimated_completion
      };
    } catch (error) {
      console.error('Research execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check research status via n8n webhook
   */
  static async checkResearchStatus(researchId: string): Promise<ApiResponse<{ status: string; progress?: number }>> {
    try {
      if (!N8N_WEBHOOK_URL) {
        throw new Error('N8N webhook URL not configured');
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(N8N_API_KEY && { Authorization: `Bearer ${N8N_API_KEY}` })
        },
        body: JSON.stringify({
          action: 'check_status',
          research_id: researchId,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'reseich-frontend',
            version: '1.0.0'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          status: result.status,
          progress: result.progress
        }
      };
    } catch (error) {
      console.error('Status check failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Cancel a research project
   */
  static async cancelResearch(researchId: string): Promise<ApiResponse<{ cancelled: boolean }>> {
    try {
      if (!N8N_WEBHOOK_URL) {
        throw new Error('N8N webhook URL not configured');
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(N8N_API_KEY && { Authorization: `Bearer ${N8N_API_KEY}` })
        },
        body: JSON.stringify({
          action: 'cancel_research',
          research_id: researchId,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'reseich-frontend',
            version: '1.0.0'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          cancelled: result.cancelled || false
        }
      };
    } catch (error) {
      console.error('Research cancellation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get research results when completed
   */
  static async getResearchResults(researchId: string): Promise<ApiResponse<{ content: string; fileUrl?: string }>> {
    try {
      if (!N8N_WEBHOOK_URL) {
        throw new Error('N8N webhook URL not configured');
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(N8N_API_KEY && { Authorization: `Bearer ${N8N_API_KEY}` })
        },
        body: JSON.stringify({
          action: 'get_results',
          research_id: researchId,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'reseich-frontend',
            version: '1.0.0'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: {
          content: result.content,
          fileUrl: result.file_url
        }
      };
    } catch (error) {
      console.error('Failed to get research results:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Estimate research completion time based on depth
   */
  static estimateCompletionTime(depth: 'simple' | 'full' | 'max'): string {
    const now = new Date();
    let estimatedMinutes: number;

    switch (depth) {
      case 'simple':
        estimatedMinutes = 15; // 15 minutes
        break;
      case 'full':
        estimatedMinutes = 45; // 45 minutes
        break;
      case 'max':
        estimatedMinutes = 120; // 2 hours
        break;
      default:
        estimatedMinutes = 30;
    }

    const estimatedTime = new Date(now.getTime() + estimatedMinutes * 60 * 1000);
    return estimatedTime.toISOString();
  }

  /**
   * Validate research form data before submission
   */
  static validateResearchData(formData: ResearchFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.title || formData.title.length < 5) {
      errors.push('Title must be at least 5 characters long');
    }

    if (!formData.query || formData.query.length < 10) {
      errors.push('Research query must be at least 10 characters long');
    }

    if (!formData.research_depth) {
      errors.push('Research depth is required');
    }

    if (!formData.research_type) {
      errors.push('Research type is required');
    }

    if (formData.tags && formData.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate credit cost for research depth
   */
  static calculateCreditCost(depth: 'simple' | 'full' | 'max'): number {
    const costs = {
      simple: 5,
      full: 10,
      max: 20
    };
    return costs[depth];
  }

  /**
   * Format research query for better AI processing
   */
  static formatQueryForAI(query: string, additionalContext?: string): string {
    let formattedQuery = query.trim();

    if (additionalContext) {
      formattedQuery += `\n\nAdditional Context: ${additionalContext}`;
    }

    // Add common research prefixes for better AI understanding
    if (
      !formattedQuery.toLowerCase().includes('research') &&
      !formattedQuery.toLowerCase().includes('analyze') &&
      !formattedQuery.toLowerCase().includes('investigate')
    ) {
      formattedQuery = `Research and analyze: ${formattedQuery}`;
    }

    return formattedQuery;
  }
}

// Export utility functions for direct use
export const { estimateCompletionTime, validateResearchData, calculateCreditCost, formatQueryForAI } = ResearchService;

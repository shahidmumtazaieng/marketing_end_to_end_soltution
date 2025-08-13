interface ScrapedBusiness {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  category: string;
  subcategories: string[];
  rating?: number;
  reviewCount: number;
  priceLevel?: string;
  location: {
    lat: number | null;
    lng: number | null;
  };
  hours?: Record<string, string> | null;
  description?: string;
  photos: string[];
  serviceOptions: Record<string, any>;
  verified: boolean;
  source: 'serpapi' | 'google_maps';
  placeId?: string;
  scrapedAt: string;
  lastUpdated: string;
}

interface ScraperRequest {
  provider: 'serpapi' | 'google_maps';
  apiKey: string;
  location: {
    country: string;
    state?: string;
    city?: string;
    village?: string;
  };
  businessTypes: string[];
  customBusinessType?: string;
  filters?: {
    rating?: number;
    priceLevel?: string;
    openNow?: boolean;
    radius?: number;
  };
  pagination?: {
    start?: number;
    num?: number;
  };
}

interface ScraperResponse {
  success: boolean;
  data: ScrapedBusiness[];
  pagination?: any;
  searchInfo?: any;
  totalResults: number;
  metadata?: {
    provider: string;
    searchParams: any;
    timestamp: string;
    requestId: string;
  };
}

interface ValidationResponse {
  success: boolean;
  valid: boolean;
  provider: string;
  timestamp: string;
  accountInfo?: {
    status: string;
  };
  error?: string;
}

interface ExportRequest {
  data: ScrapedBusiness[];
  format: 'csv' | 'excel';
  selectedFields?: string[];
  filename?: string;
}

class ScraperAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  }

  /**
   * Validate API key
   */
  async validateApiKey(provider: 'serpapi' | 'google_maps', apiKey: string): Promise<ValidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraper/validate-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`API validation failed: ${error.message}`);
    }
  }

  /**
   * Search businesses
   */
  async searchBusinesses(params: ScraperRequest): Promise<ScraperResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraper/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Batch search multiple business types
   */
  async batchSearchBusinesses(params: ScraperRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraper/batch-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Batch search failed: ${error.message}`);
    }
  }

  /**
   * Get place details
   */
  async getPlaceDetails(provider: string, apiKey: string, placeId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraper/place-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey, placeId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get place details: ${error.message}`);
    }
  }

  /**
   * Export data
   */
  async exportData(params: ExportRequest): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraper/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  /**
   * Get scraping statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scraper/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(provider: string, apiKey: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/validation/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Get API usage information
   */
  async getApiUsage(provider: string, apiKey: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/validation/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to get API usage: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const scraperAPI = new ScraperAPI();

// Export types
export type {
  ScrapedBusiness,
  ScraperRequest,
  ScraperResponse,
  ValidationResponse,
  ExportRequest
};

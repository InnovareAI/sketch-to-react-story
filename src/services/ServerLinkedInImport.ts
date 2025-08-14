/**
 * Server-side LinkedIn Import Service
 * Triggers server-side contact import via Supabase Edge Function
 * Runs independently of browser session and page navigation
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ServerImportResult {
  success: boolean;
  contactsImported: number;
  totalProcessed: number;
  source: string;
  errors: string[];
  warnings: string[];
  processingTime: number;
  quality: {
    firstDegree: number;
    secondDegree: number;
    withJobTitles: number;
    withProfiles: number;
  };
}

interface ImportProgress {
  status: 'starting' | 'running' | 'completed' | 'failed';
  message: string;
  progress?: number;
  contactsFound?: number;
  estimatedTime?: number;
}

export class ServerLinkedInImport {
  private workspaceId: string = '';
  private importId: string = '';

  /**
   * Initialize the server-side import service
   */
  initialize(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.importId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('🚀 Server LinkedIn Import initialized');
    console.log(`   • Workspace ID: ${workspaceId}`);
    console.log(`   • Import ID: ${this.importId}`);
  }

  /**
   * Start server-side LinkedIn contact import
   * Runs on Supabase Edge Functions - independent of browser session
   */
  async startImport(options: {
    limit?: number;
    method?: 'unipile' | 'linkedin_api' | 'both';
    onProgress?: (progress: ImportProgress) => void;
  } = {}): Promise<ServerImportResult> {
    const { limit = 500, method = 'both', onProgress } = options;

    if (!this.workspaceId) {
      throw new Error('Server LinkedIn Import not initialized with workspace ID');
    }

    console.log('🚀 Starting server-side LinkedIn import...');
    console.log(`   • Method: ${method}`);
    console.log(`   • Limit: ${limit}`);
    console.log(`   • Import ID: ${this.importId}`);

    // Notify start
    onProgress?.({
      status: 'starting',
      message: 'Initializing server-side import...'
    });

    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required for server-side import');
      }

      console.log('✅ User session valid, calling edge function...');

      onProgress?.({
        status: 'running',
        message: 'Server processing LinkedIn data...',
        progress: 10
      });

      // Call the Supabase Edge Function using the correct method
      console.log('🔄 Calling edge function via supabase.functions.invoke...');

      const { data, error } = await supabase.functions.invoke('linkedin-import', {
        body: {
          workspaceId: this.workspaceId,
          options: {
            limit: limit,
            method: method,
            importId: this.importId
          }
        }
      });

      if (error) {
        console.error('❌ Supabase function invoke error:', error);
        throw new Error(`Server import failed: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from server import function');
      }

      const result: ServerImportResult = data;

      console.log('📊 Server import completed:', result);

      onProgress?.({
        status: result.success ? 'completed' : 'failed',
        message: result.success 
          ? `Import completed! ${result.contactsImported} contacts imported`
          : `Import failed: ${result.errors.join(', ')}`,
        progress: 100,
        contactsFound: result.contactsImported
      });

      // Show detailed results
      if (result.success) {
        this.showServerImportResults(result);
      }

      return result;

    } catch (error) {
      console.error('❌ Server import error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
      
      onProgress?.({
        status: 'failed',
        message: `Server import failed: ${errorMessage}`
      });

      // Return error result
      return {
        success: false,
        contactsImported: 0,
        totalProcessed: 0,
        source: 'server-side-error',
        errors: [errorMessage],
        warnings: [],
        processingTime: 0,
        quality: {
          firstDegree: 0,
          secondDegree: 0,
          withJobTitles: 0,
          withProfiles: 0,
        }
      };
    }
  }

  /**
   * Show comprehensive server import results to user
   */
  private showServerImportResults(result: ServerImportResult) {
    if (result.success && result.contactsImported > 0) {
      // Main success message
      toast.success(`🎉 Server import successful! ${result.contactsImported} LinkedIn contacts imported!`, {
        duration: 6000
      });

      // Quality breakdown
      const qualityDetails = [];
      if (result.quality.firstDegree > 0) qualityDetails.push(`${result.quality.firstDegree} 1st degree`);
      if (result.quality.secondDegree > 0) qualityDetails.push(`${result.quality.secondDegree} 2nd degree`);

      if (qualityDetails.length > 0) {
        toast.info(`🔗 Network: ${qualityDetails.join(', ')} connections`, {
          duration: 5000
        });
      }

      // Quality metrics
      if (result.quality.withJobTitles > 0 || result.quality.withProfiles > 0) {
        toast.info(`✅ Quality: ${result.quality.withJobTitles} with titles, ${result.quality.withProfiles} with profiles`, {
          duration: 5000
        });
      }

      // Processing time
      toast.info(`⏱️ Server processing completed in ${(result.processingTime / 1000).toFixed(1)} seconds`, {
        duration: 4000
      });

      // Server source info
      toast.info(`🖥️ Processed server-side via ${result.source} (continues even if you close the browser)`, {
        duration: 5000
      });

    } else if (result.success && result.contactsImported === 0) {
      toast.warning('🔍 Server import completed but no new contacts were found', {
        duration: 5000
      });
    } else {
      toast.error(`❌ Server import failed: ${result.errors.join(', ')}`, {
        duration: 6000
      });
    }

    // Show warnings if any
    if (result.warnings.length > 0) {
      toast.warning(`⚠️ ${result.warnings.length} warnings: ${result.warnings.slice(0, 2).join(', ')}${result.warnings.length > 2 ? '...' : ''}`, {
        duration: 6000
      });
    }
  }

  /**
   * Check if server-side import is available
   */
  async checkServerAvailability(): Promise<{ available: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { available: false, error: 'Authentication required' };
      }

      // Test edge function availability with a minimal test call
      const { error } = await supabase.functions.invoke('linkedin-import', {
        body: { test: true }
      });

      if (error) {
        // If it's an authentication error, the function is available but needs proper auth
        if (error.message.includes('JWT') || error.message.includes('auth')) {
          return { available: true };
        }
        return { available: false, error: error.message };
      }

      return { available: true };

    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get import statistics and recommendations
   */
  getImportInfo() {
    return {
      advantages: [
        'Runs on server - continues even if you close the browser',
        'No browser timeout issues',
        'Better API rate limit handling',
        'More reliable for large contact lists',
        'Background processing with detailed logging'
      ],
      limitations: [
        'Cannot show real-time progress in browser',
        'Results shown after completion',
        'Requires stable internet connection to start'
      ],
      recommendations: [
        'Use for large contact imports (200+ contacts)',
        'Start the import and check back later',
        'Monitor via browser console or return to page for results'
      ]
    };
  }
}

// Export singleton instance
export const serverLinkedInImport = new ServerLinkedInImport();
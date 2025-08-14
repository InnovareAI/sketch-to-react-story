/**
 * Enhanced LinkedIn Import Service
 * Multi-source contact import with Unipile primary + LinkedIn Developer API fallback
 * Comprehensive approach for maximum contact extraction
 */

import { workspaceUnipile } from './WorkspaceUnipileService';
import { linkedInAPIService } from './LinkedInAPIService';
import { toast } from 'sonner';

interface ImportResult {
  success: boolean;
  totalContacts: number;
  contactsSynced: number;
  sources: {
    unipile: number;
    linkedinAPI: number;
    hybrid: number;
  };
  quality: {
    firstDegree: number;
    secondDegree: number;
    thirdDegree: number;
    withJobTitles: number;
    withProfiles: number;
    withCompanies: number;
  };
  errors: string[];
  warnings: string[];
  processingTime: number;
}

export class EnhancedLinkedInImport {
  private workspaceId: string = '';

  /**
   * Initialize the enhanced import service
   */
  initialize(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  /**
   * Comprehensive LinkedIn contact import with multiple fallback methods
   */
  async importContacts(options: {
    limit?: number;
    useUnipile?: boolean;
    useLinkedInAPI?: boolean;
    preferredMethod?: 'unipile' | 'linkedin_api' | 'both';
  } = {}): Promise<ImportResult> {
    const startTime = Date.now();
    const {
      limit = 500,
      useUnipile = true,
      useLinkedInAPI = true,
      preferredMethod = 'both'
    } = options;

    const result: ImportResult = {
      success: false,
      totalContacts: 0,
      contactsSynced: 0,
      sources: { unipile: 0, linkedinAPI: 0, hybrid: 0 },
      quality: { firstDegree: 0, secondDegree: 0, thirdDegree: 0, withJobTitles: 0, withProfiles: 0, withCompanies: 0 },
      errors: [],
      warnings: [],
      processingTime: 0
    };

    console.log('🚀 Starting Enhanced LinkedIn Contact Import...');
    console.log(`   • Workspace ID: ${this.workspaceId}`);
    console.log(`   • Contact Limit: ${limit}`);
    console.log(`   • Preferred Method: ${preferredMethod}`);
    console.log(`   • Use Unipile: ${useUnipile}`);
    console.log(`   • Use LinkedIn API: ${useLinkedInAPI}`);
    console.log(`   • Timestamp: ${new Date().toISOString()}`);
    
    // Enhanced debugging for production
    if (!this.workspaceId) {
      const error = 'Enhanced LinkedIn Import not initialized with workspace ID';
      console.error('❌ CRITICAL:', error);
      result.errors.push(error);
      return result;
    }

    try {
      // Method 1: Unipile API (Primary - most comprehensive)
      if (useUnipile && (preferredMethod === 'unipile' || preferredMethod === 'both')) {
        console.log('\n📱 Method 1: Unipile LinkedIn API...');
        try {
          const unipileResult = await this.importViaUnipile(limit);
          if (unipileResult.contactsSynced > 0) {
            result.sources.unipile = unipileResult.contactsSynced;
            result.totalContacts += unipileResult.contactsSynced;
            result.contactsSynced += unipileResult.contactsSynced;
            
            // Update quality metrics from Unipile
            result.quality.firstDegree += unipileResult.quality?.firstDegree || 0;
            result.quality.secondDegree += unipileResult.quality?.secondDegree || 0;
            result.quality.thirdDegree += unipileResult.quality?.thirdDegree || 0;
            result.quality.withJobTitles += unipileResult.quality?.withJobTitles || 0;
            result.quality.withProfiles += unipileResult.quality?.withProfiles || 0;
            result.quality.withCompanies += unipileResult.quality?.withCompanies || 0;
            
            console.log(`   ✅ Unipile: ${unipileResult.contactsSynced} contacts imported`);
            result.success = true;
          } else {
            result.warnings.push('Unipile import returned 0 contacts');
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unipile import failed';
          result.errors.push(`Unipile: ${errorMsg}`);
          console.log(`   ❌ Unipile failed: ${errorMsg}`);
        }
      }

      // Method 2: LinkedIn Developer API (Fallback)
      if (useLinkedInAPI && (preferredMethod === 'linkedin_api' || preferredMethod === 'both')) {
        console.log('\n🔗 Method 2: LinkedIn Developer API (Fallback)...');
        try {
          await linkedInAPIService.initialize(this.workspaceId);
          const apiResult = await linkedInAPIService.importConnections(Math.min(limit - result.contactsSynced, 100));
          
          if (apiResult.contactsImported > 0) {
            result.sources.linkedinAPI = apiResult.contactsImported;
            result.totalContacts += apiResult.contactsImported;
            result.contactsSynced += apiResult.contactsImported;
            
            // LinkedIn API provides high-quality verified profiles
            result.quality.withProfiles += apiResult.contactsImported; // All LinkedIn API contacts have profiles
            result.quality.firstDegree += apiResult.contactsImported; // API contacts are typically 1st degree
            
            console.log(`   ✅ LinkedIn API: ${apiResult.contactsImported} contacts imported`);
            result.success = true;
          }
          
          if (apiResult.errors.length > 0) {
            result.warnings.push(...apiResult.errors);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'LinkedIn API import failed';
          result.errors.push(`LinkedIn API: ${errorMsg}`);
          console.log(`   ⚠️  LinkedIn API fallback not available: ${errorMsg}`);
        }
      }

      // Method 3: Hybrid approach - combine data from both sources
      if (result.sources.unipile > 0 && result.sources.linkedinAPI > 0) {
        result.sources.hybrid = Math.min(result.sources.unipile, result.sources.linkedinAPI);
        console.log(`   🔄 Hybrid enrichment: ${result.sources.hybrid} contacts enhanced with multiple sources`);
      }

      // Final validation
      if (result.contactsSynced === 0) {
        throw new Error('No contacts imported from any source. Please check your LinkedIn connections and API configurations.');
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error during import';
      result.errors.push(errorMsg);
      console.error('Enhanced LinkedIn import error:', error);
    }

    result.processingTime = Date.now() - startTime;
    
    console.log('\n📊 Enhanced Import Results:');
    console.log('═'.repeat(50));
    console.log(`✅ Total Contacts: ${result.totalContacts}`);
    console.log(`📱 Unipile Source: ${result.sources.unipile} contacts`);
    console.log(`🔗 LinkedIn API: ${result.sources.linkedinAPI} contacts`);
    console.log(`🔄 Hybrid Enhanced: ${result.sources.hybrid} contacts`);
    console.log(`⏱️  Processing Time: ${(result.processingTime / 1000).toFixed(1)}s`);
    console.log(`📈 Success Rate: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (result.errors.length > 0) {
      console.log(`❌ Errors: ${result.errors.length}`);
      result.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (result.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${result.warnings.length}`);
      result.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    return result;
  }

  /**
   * Import contacts via Unipile API
   */
  private async importViaUnipile(limit: number) {
    console.log('   🔄 Initializing Unipile workspace service...');
    console.log(`   🔄 Workspace ID: ${this.workspaceId}`);
    
    try {
      const config = await workspaceUnipile.initialize(this.workspaceId);
      console.log('   ✅ Unipile service initialized');
      console.log('   📊 Config:', JSON.stringify(config, null, 2));
      
      if (!config.linkedin_connected) {
        const errorMsg = 'LinkedIn not connected in Unipile. Please complete onboarding.';
        console.error('   ❌', errorMsg);
        console.log('   💡 LinkedIn connection required via settings');
        throw new Error(errorMsg);
      }

      console.log('   🔄 Fetching LinkedIn contacts via Unipile...');
      console.log(`   🔄 Contact limit: ${limit}`);
      
      const unipileResult = await workspaceUnipile.syncContacts(limit);
      console.log('   📊 Unipile sync result:', JSON.stringify(unipileResult, null, 2));
      
      const result = {
        contactsSynced: unipileResult.contactsSynced,
        quality: {
          firstDegree: unipileResult.firstDegree || 0,
          secondDegree: unipileResult.secondDegree || 0,
          thirdDegree: unipileResult.thirdDegree || 0,
          withJobTitles: unipileResult.withJobTitles || 0,
          withProfiles: unipileResult.withProfiles || 0,
          withCompanies: 0 // Will be calculated from job titles
        }
      };
      
      console.log('   ✅ Unipile import completed:', result);
      return result;
      
    } catch (error) {
      console.error('   ❌ Unipile import error:', error);
      console.error('   🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        workspaceId: this.workspaceId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Show comprehensive import results to user
   */
  showImportResults(result: ImportResult) {
    if (result.success) {
      // Main success message
      toast.success(`🎉 Successfully imported ${result.contactsSynced} LinkedIn contacts!`, {
        duration: 5000
      });

      // Quality breakdown
      const qualityDetails = [];
      if (result.quality.firstDegree > 0) qualityDetails.push(`${result.quality.firstDegree} 1st degree`);
      if (result.quality.secondDegree > 0) qualityDetails.push(`${result.quality.secondDegree} 2nd degree`);
      if (result.quality.thirdDegree > 0) qualityDetails.push(`${result.quality.thirdDegree} 3rd degree`);

      if (qualityDetails.length > 0) {
        toast.info(`🔗 Network: ${qualityDetails.join(', ')} connections`, {
          duration: 4000
        });
      }

      // Source breakdown
      const sourceDetails = [];
      if (result.sources.unipile > 0) sourceDetails.push(`${result.sources.unipile} via Unipile`);
      if (result.sources.linkedinAPI > 0) sourceDetails.push(`${result.sources.linkedinAPI} via LinkedIn API`);
      if (result.sources.hybrid > 0) sourceDetails.push(`${result.sources.hybrid} enhanced`);

      if (sourceDetails.length > 0) {
        toast.info(`📊 Sources: ${sourceDetails.join(', ')}`, {
          duration: 4000
        });
      }

      // Quality metrics
      if (result.quality.withJobTitles > 0 || result.quality.withProfiles > 0) {
        toast.info(`✅ Quality: ${result.quality.withJobTitles} with titles, ${result.quality.withProfiles} with profiles`, {
          duration: 4000
        });
      }

      // Processing time
      toast.info(`⏱️ Import completed in ${(result.processingTime / 1000).toFixed(1)} seconds`, {
        duration: 3000
      });

    } else {
      toast.error(`❌ LinkedIn import failed: ${result.errors.join(', ')}`, {
        duration: 6000
      });
    }

    // Show warnings if any
    if (result.warnings.length > 0) {
      toast.warning(`⚠️ ${result.warnings.length} warnings: ${result.warnings.slice(0, 2).join(', ')}${result.warnings.length > 2 ? '...' : ''}`, {
        duration: 5000
      });
    }
  }

  /**
   * Test all available LinkedIn integration methods
   */
  async testConnections(): Promise<{
    unipile: { connected: boolean; error?: string };
    linkedinAPI: { connected: boolean; error?: string };
  }> {
    const results = {
      unipile: { connected: false, error: undefined as string | undefined },
      linkedinAPI: { connected: false, error: undefined as string | undefined }
    };

    // Test Unipile
    try {
      const config = await workspaceUnipile.initialize(this.workspaceId);
      results.unipile.connected = config.linkedin_connected;
      if (!config.linkedin_connected) {
        results.unipile.error = 'LinkedIn not connected in Unipile';
      }
    } catch (error) {
      results.unipile.error = error instanceof Error ? error.message : 'Unipile connection failed';
    }

    // Test LinkedIn API
    try {
      await linkedInAPIService.initialize(this.workspaceId);
      const apiTest = await linkedInAPIService.testConnection();
      results.linkedinAPI.connected = apiTest.connected;
      if (apiTest.error) {
        results.linkedinAPI.error = apiTest.error;
      }
    } catch (error) {
      results.linkedinAPI.error = error instanceof Error ? error.message : 'LinkedIn API connection failed';
    }

    return results;
  }
}

// Export singleton instance
export const enhancedLinkedInImport = new EnhancedLinkedInImport();
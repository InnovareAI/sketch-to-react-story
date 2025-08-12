import React from 'react';
import { LinkedInAccountConnection } from '@/components/settings/LinkedInAccountConnection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Linkedin } from 'lucide-react';

export default function LinkedInIntegrationSimple() {
  return (
    <div className="flex-1 bg-gray-50">
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Linkedin className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">LinkedIn Integration</h1>
            </div>
            <p className="text-gray-600">
              Connect and manage your LinkedIn account for automated outreach
            </p>
          </div>
          
          {/* LinkedIn Account Connection Component */}
          <LinkedInAccountConnection />
        </div>
      </main>
    </div>
  );
}
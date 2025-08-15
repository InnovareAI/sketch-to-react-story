import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Submission {
  id: string
  product_name: string
  generic_name: string
  indication: string
  therapeutic_area: string
  target_audience: 'HCP' | 'Patient'
  development_stage: string
  workflow_stage: string
  ai_processing_status: string
  seo_title?: string
  meta_description?: string
  h1_tag?: string
  h2_tags?: string[]
  seo_keywords?: string[]
  long_tail_keywords?: string[]
  voice_search_queries?: string[]
  mechanism_of_action?: string
  key_benefits?: string
  safety_information?: string
  disease_overview?: string
  signs_symptoms?: string
  risk_factors?: string
  early_diagnosis_importance?: string
  created_at: string
  medical_accuracy_score?: number
  compliance_score?: number
}

const SeoReview: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching submissions:', error)
        return
      }

      setSubmissions(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAudienceBadge = (audience: 'HCP' | 'Patient') => {
    return audience === 'HCP' 
      ? <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">👨‍⚕️ Healthcare Professionals</Badge>
      : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">👥 Patients</Badge>
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    }
    return statusMap[status as keyof typeof statusMap] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading pharmaceutical submissions...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">💊 Prescription Drug SEO Review Dashboard</h1>
        <p className="text-gray-600">AI-generated content for prescription pharmaceuticals with target audience differentiation</p>
      </div>

      <div className="grid gap-6">
        {submissions.map((submission) => (
          <Card key={submission.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl flex items-center gap-3 mb-2">
                    <span>{submission.product_name}</span>
                    <span className="text-lg font-normal text-gray-500">({submission.generic_name})</span>
                    {getAudienceBadge(submission.target_audience)}
                  </CardTitle>
                  <div className="flex gap-2 mb-3">
                    <Badge variant="secondary">{submission.therapeutic_area}</Badge>
                    <Badge variant="outline">{submission.indication}</Badge>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {submission.development_stage}
                    </Badge>
                    <Badge className={getStatusBadge(submission.ai_processing_status)}>
                      {submission.ai_processing_status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </p>
                  {submission.medical_accuracy_score && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-500">Accuracy: </span>
                      <span className="font-medium">{submission.medical_accuracy_score}%</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            
            {(submission.seo_title || submission.ai_processing_status === 'completed') && (
              <CardContent>
                <div className="space-y-4">
                  {submission.seo_title && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">SEO Title</h4>
                      <p className="text-gray-900">{submission.seo_title}</p>
                    </div>
                  )}
                  
                  {submission.meta_description && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Meta Description</h4>
                      <p className="text-gray-600 text-sm">{submission.meta_description}</p>
                    </div>
                  )}
                  
                  {submission.h1_tag && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">H1 Tag</h4>
                      <h2 className="text-lg font-medium text-gray-900">{submission.h1_tag}</h2>
                    </div>
                  )}

                  {submission.seo_keywords && submission.seo_keywords.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">SEO Keywords</h4>
                      <div className="flex flex-wrap gap-1">
                        {submission.seo_keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {submission.h2_tags && submission.h2_tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">H2 Tags</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {submission.h2_tags.map((h2, index) => (
                          <li key={index}>• {h2}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {submission.mechanism_of_action && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Mechanism of Action</h4>
                      <p className="text-sm text-gray-600">{submission.mechanism_of_action}</p>
                    </div>
                  )}

                  {submission.disease_overview && submission.development_stage === 'Market Shaping' && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-1">🎯 Disease Education Content</h4>
                      <p className="text-sm text-blue-700 mb-2">{submission.disease_overview}</p>
                      {submission.signs_symptoms && (
                        <div className="mt-2">
                          <span className="font-medium text-blue-800">Signs & Symptoms:</span>
                          <p className="text-xs text-blue-600">{submission.signs_symptoms}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {submission.key_benefits && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Key Benefits</h4>
                      <p className="text-sm text-gray-600">{submission.key_benefits}</p>
                    </div>
                  )}

                  {submission.long_tail_keywords && submission.long_tail_keywords.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Long-tail Keywords</h4>
                      <div className="flex flex-wrap gap-1">
                        {submission.long_tail_keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Content optimized for: <span className="font-medium">
                        {submission.target_audience === 'HCP' 
                          ? 'Healthcare Professionals (clinical language, prescribing info)'
                          : 'Patients (accessible language, quality of life focus)'
                        }
                      </span>
                      {submission.development_stage === 'Market Shaping' && (
                        <span className="ml-2 text-blue-600 font-medium">• Disease Education (Brand-Free)</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
      
      {submissions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💊</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No submissions found</h3>
          <p className="text-gray-500">Prescription drug submissions will appear here once processed.</p>
        </div>
      )}
    </div>
  )
}

export default SeoReview
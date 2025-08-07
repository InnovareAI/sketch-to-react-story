export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          channel: string
          created_at: string | null
          credentials: Json | null
          email: string | null
          id: string
          last_sync_at: string | null
          linkedin_id: string | null
          settings: Json | null
          status: string
          tenant_id: string
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          credentials?: Json | null
          email?: string | null
          id?: string
          last_sync_at?: string | null
          linkedin_id?: string | null
          settings?: Json | null
          status?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          credentials?: Json | null
          email?: string | null
          id?: string
          last_sync_at?: string | null
          linkedin_id?: string | null
          settings?: Json | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          event: string
          id: string
          ip_address: unknown | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          event: string
          id?: string
          ip_address?: unknown | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          event?: string
          id?: string
          ip_address?: unknown | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          subscription_expires_at: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_accounts: {
        Row: {
          account_identifier: string
          country_code: string | null
          created_at: string | null
          credentials: Json | null
          health_check: Json | null
          id: string
          last_active_at: string | null
          organization_id: string | null
          platform: string
          proxy_config: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_identifier: string
          country_code?: string | null
          created_at?: string | null
          credentials?: Json | null
          health_check?: Json | null
          id?: string
          last_active_at?: string | null
          organization_id?: string | null
          platform: string
          proxy_config?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_identifier?: string
          country_code?: string | null
          created_at?: string | null
          credentials?: Json | null
          health_check?: Json | null
          id?: string
          last_active_at?: string | null
          organization_id?: string | null
          platform?: string
          proxy_config?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          ai_output: Json | null
          ai_processing_status: string | null
          approval_date: string | null
          claude_qa: Json | null
          client_feedback: string | null
          client_reviewer_email: string | null
          client_reviewer_name: string | null
          clinical_trials_data: Json | null
          combination_partners: string[] | null
          competitive_density: number | null
          compliance_score: number | null
          created_at: string | null
          development_stage: string | null
          fda_comprehensive_data: Json | null
          fda_data: Json | null
          generic_name: string
          geographic_markets: string[] | null
          id: string
          indication: string
          internal_notes: string | null
          key_biomarkers: string[] | null
          keyword_difficulty: number | null
          language: string | null
          last_updated: string | null
          line_of_therapy: string | null
          mlr_approved: boolean | null
          mlr_reviewer_email: string | null
          mlr_reviewer_name: string | null
          nct_number: string | null
          patient_population: string[] | null
          perplexity_content: Json | null
          primary_endpoints: string[] | null
          primary_market: string | null
          priority_level: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          product_name: string | null
          qa_score: number | null
          revision_count: number | null
          route_of_administration: string | null
          search_volume: number | null
          secondary_markets: string[] | null
          seo_reviewer_email: string
          seo_reviewer_name: string
          sponsor: string | null
          submitter_email: string
          submitter_name: string
          tags: string[] | null
          target_age_groups: string[] | null
          tenant_id: string | null
          therapeutic_area: string
          updated_at: string | null
          user_id: string | null
          workflow_stage: string | null
          workspace_id: string | null
        }
        Insert: {
          ai_output?: Json | null
          ai_processing_status?: string | null
          approval_date?: string | null
          claude_qa?: Json | null
          client_feedback?: string | null
          client_reviewer_email?: string | null
          client_reviewer_name?: string | null
          clinical_trials_data?: Json | null
          combination_partners?: string[] | null
          competitive_density?: number | null
          compliance_score?: number | null
          created_at?: string | null
          development_stage?: string | null
          fda_comprehensive_data?: Json | null
          fda_data?: Json | null
          generic_name: string
          geographic_markets?: string[] | null
          id?: string
          indication: string
          internal_notes?: string | null
          key_biomarkers?: string[] | null
          keyword_difficulty?: number | null
          language?: string | null
          last_updated?: string | null
          line_of_therapy?: string | null
          mlr_approved?: boolean | null
          mlr_reviewer_email?: string | null
          mlr_reviewer_name?: string | null
          nct_number?: string | null
          patient_population?: string[] | null
          perplexity_content?: Json | null
          primary_endpoints?: string[] | null
          primary_market?: string | null
          priority_level?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          product_name?: string | null
          qa_score?: number | null
          revision_count?: number | null
          route_of_administration?: string | null
          search_volume?: number | null
          secondary_markets?: string[] | null
          seo_reviewer_email: string
          seo_reviewer_name: string
          sponsor?: string | null
          submitter_email: string
          submitter_name: string
          tags?: string[] | null
          target_age_groups?: string[] | null
          tenant_id?: string | null
          therapeutic_area: string
          updated_at?: string | null
          user_id?: string | null
          workflow_stage?: string | null
          workspace_id?: string | null
        }
        Update: {
          ai_output?: Json | null
          ai_processing_status?: string | null
          approval_date?: string | null
          claude_qa?: Json | null
          client_feedback?: string | null
          client_reviewer_email?: string | null
          client_reviewer_name?: string | null
          clinical_trials_data?: Json | null
          combination_partners?: string[] | null
          competitive_density?: number | null
          compliance_score?: number | null
          created_at?: string | null
          development_stage?: string | null
          fda_comprehensive_data?: Json | null
          fda_data?: Json | null
          generic_name?: string
          geographic_markets?: string[] | null
          id?: string
          indication?: string
          internal_notes?: string | null
          key_biomarkers?: string[] | null
          keyword_difficulty?: number | null
          language?: string | null
          last_updated?: string | null
          line_of_therapy?: string | null
          mlr_approved?: boolean | null
          mlr_reviewer_email?: string | null
          mlr_reviewer_name?: string | null
          nct_number?: string | null
          patient_population?: string[] | null
          perplexity_content?: Json | null
          primary_endpoints?: string[] | null
          primary_market?: string | null
          priority_level?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          product_name?: string | null
          qa_score?: number | null
          revision_count?: number | null
          route_of_administration?: string | null
          search_volume?: number | null
          secondary_markets?: string[] | null
          seo_reviewer_email?: string
          seo_reviewer_name?: string
          sponsor?: string | null
          submitter_email?: string
          submitter_name?: string
          tags?: string[] | null
          target_age_groups?: string[] | null
          tenant_id?: string | null
          therapeutic_area?: string
          updated_at?: string | null
          user_id?: string | null
          workflow_stage?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          plan: string
          settings: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          plan?: string
          settings?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          plan?: string
          settings?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          accounts_connected: number | null
          api_calls_this_month: number | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          preferences: Json | null
          role: string | null
          subscription_current_period_end: string | null
          subscription_plan_id: string | null
          subscription_status: string | null
          updated_at: string | null
          workflows_count: number | null
        }
        Insert: {
          accounts_connected?: number | null
          api_calls_this_month?: number | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          role?: string | null
          subscription_current_period_end?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          workflows_count?: number | null
        }
        Update: {
          accounts_connected?: number | null
          api_calls_this_month?: number | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          role?: string | null
          subscription_current_period_end?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          workflows_count?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          organization_id: string | null
          role: string
          settings: Json | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          organization_id?: string | null
          role?: string
          settings?: Json | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          organization_id?: string | null
          role?: string
          settings?: Json | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_tenant_with_owner: {
        Args: {
          tenant_name: string
          owner_email: string
          owner_name: string
          owner_id: string
        }
        Returns: string
      }
      current_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_campaign_stats: {
        Args: { campaign_uuid: string }
        Returns: Json
      }
      get_user_organization_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_tenant_id: {
        Args: { user_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type Json =
  | boolean
  | null
  | number
  | string
  | Json[]
  | { [key: string]: Json | undefined }

export type Database = {
  public: {
    CompositeTypes: Record<string, never>
    Enums: Record<string, never>
    Functions: Record<string, never>
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_user_id: string | null
          category_id: string | null
          content: Json
          cover_image_path: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: 'archived' | 'draft' | 'published'
          title: string
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          category_id?: string | null
          content?: Json
          cover_image_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: 'archived' | 'draft' | 'published'
          title: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          category_id?: string | null
          content?: Json
          cover_image_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: 'archived' | 'draft' | 'published'
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          created_at: string
          id: string
          integration_name: string
          message: string | null
          payload: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          integration_name: string
          message?: string | null
          payload?: Json | null
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          integration_name?: string
          message?: string | null
          payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      listing_attributes: {
        Row: {
          attribute_key: string
          attribute_label: string
          attribute_value: string
          created_at: string
          id: string
          listing_id: string
        }
        Insert: {
          attribute_key: string
          attribute_label: string
          attribute_value: string
          created_at?: string
          id?: string
          listing_id: string
        }
        Update: {
          attribute_key?: string
          attribute_label?: string
          attribute_value?: string
          created_at?: string
          id?: string
          listing_id?: string
        }
        Relationships: []
      }
      listing_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      listing_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_cover: boolean
          listing_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: []
      }
      listing_answers: {
        Row: {
          answer_text: string
          created_at: string
          id: string
          question_id: string
          responder_user_id: string
          updated_at: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          id?: string
          question_id: string
          responder_user_id: string
          updated_at?: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          id?: string
          question_id?: string
          responder_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      listing_materials: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      listing_questions: {
        Row: {
          author_user_id: string | null
          created_at: string
          guest_email: string | null
          guest_name: string | null
          id: string
          listing_id: string
          question_text: string
          status: 'blocked' | 'hidden' | 'published'
          updated_at: string
        }
        Insert: {
          author_user_id?: string | null
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          listing_id: string
          question_text: string
          status?: 'blocked' | 'hidden' | 'published'
          updated_at?: string
        }
        Update: {
          author_user_id?: string | null
          created_at?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          listing_id?: string
          question_text?: string
          status?: 'blocked' | 'hidden' | 'published'
          updated_at?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          category_id: string
          city: string
          condition_type: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          is_featured: boolean
          price_label: string | null
          primary_material_id: string | null
          published_at: string | null
          rejection_reason: string | null
          slug: string | null
          state: string
          status:
            | 'approved'
            | 'archived'
            | 'draft'
            | 'expired'
            | 'paused'
            | 'pending_review'
            | 'rejected'
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          city: string
          condition_type?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          is_featured?: boolean
          price_label?: string | null
          primary_material_id?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          slug?: string | null
          state: string
          status?:
            | 'approved'
            | 'archived'
            | 'draft'
            | 'expired'
            | 'paused'
            | 'pending_review'
            | 'rejected'
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          city?: string
          condition_type?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_featured?: boolean
          price_label?: string | null
          primary_material_id?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          slug?: string | null
          state?: string
          status?:
            | 'approved'
            | 'archived'
            | 'draft'
            | 'expired'
            | 'paused'
            | 'pending_review'
            | 'rejected'
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_user_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_admin: boolean
          phone: string | null
          role: 'admin' | 'user'
          status: 'active' | 'suspended' | 'under_review'
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_admin?: boolean
          phone?: string | null
          role?: 'admin' | 'user'
          status?: 'active' | 'suspended' | 'under_review'
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_admin?: boolean
          phone?: string | null
          role?: 'admin' | 'user'
          status?: 'active' | 'suspended' | 'under_review'
          updated_at?: string
        }
        Relationships: []
      }
      scrap_price_entries: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          is_active: boolean
          material_name: string
          price_label: string
          price_numeric: number | null
          price_unit: string | null
          region_name: string | null
          source_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_date: string
          id?: string
          is_active?: boolean
          material_name: string
          price_label: string
          price_numeric?: number | null
          price_unit?: string | null
          region_name?: string | null
          source_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          is_active?: boolean
          material_name?: string
          price_label?: string
          price_numeric?: number | null
          price_unit?: string | null
          region_name?: string | null
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lme_price_snapshots: {
        Row: {
          created_at: string
          currency_code: string
          id: string
          metal_code: 'AL' | 'CU' | 'NI' | 'PB' | 'SN' | 'USD' | 'ZN'
          metal_name: string
          price_value: number
          provider_name: string
          quoted_at: string
          quoted_date: string
          source_payload: Json | null
        }
        Insert: {
          created_at?: string
          currency_code: string
          id?: string
          metal_code: 'AL' | 'CU' | 'NI' | 'PB' | 'SN' | 'USD' | 'ZN'
          metal_name: string
          price_value: number
          provider_name?: string
          quoted_at: string
          source_payload?: Json | null
        }
        Update: {
          created_at?: string
          currency_code?: string
          id?: string
          metal_code?: 'AL' | 'CU' | 'NI' | 'PB' | 'SN' | 'USD' | 'ZN'
          metal_name?: string
          price_value?: number
          provider_name?: string
          quoted_at?: string
          source_payload?: Json | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          allow_guest_questions: boolean
          created_at: string
          id: string
          maintenance_mode: boolean
          seo_description_default: string | null
          seo_title_default: string | null
          site_name: string
          support_email: string | null
          support_phone: string | null
          updated_at: string
        }
        Insert: {
          allow_guest_questions?: boolean
          created_at?: string
          id?: string
          maintenance_mode?: boolean
          seo_description_default?: string | null
          seo_title_default?: string | null
          site_name: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Update: {
          allow_guest_questions?: boolean
          created_at?: string
          id?: string
          maintenance_mode?: boolean
          seo_description_default?: string | null
          seo_title_default?: string | null
          site_name?: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      lme_snapshot_months: {
        Relationships: []
        Row: {
          last_quoted_date: string
          month_key: string
          month_start: string
          trading_days: number
        }
        Insert: {
          last_quoted_date?: string
          month_key?: string
          month_start?: string
          trading_days?: number
        }
        Update: {
          last_quoted_date?: string
          month_key?: string
          month_start?: string
          trading_days?: number
        }
      }
    }
  }
}

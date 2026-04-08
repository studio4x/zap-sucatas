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
      system_settings: {
        Row: {
          allow_guest_questions: boolean
          created_at: string
          id: string
          support_email: string | null
          support_phone: string | null
          updated_at: string
        }
        Insert: {
          allow_guest_questions?: boolean
          created_at?: string
          id?: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Update: {
          allow_guest_questions?: boolean
          created_at?: string
          id?: string
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
  }
}

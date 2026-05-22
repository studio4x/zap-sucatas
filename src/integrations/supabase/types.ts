export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
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
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notification_actions: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          filters_snapshot: Json | null
          id: string
          metadata: Json | null
          target_ids: Json | null
          target_type: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          filters_snapshot?: Json | null
          id?: string
          metadata?: Json | null
          target_ids?: Json | null
          target_type: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          filters_snapshot?: Json | null
          id?: string
          metadata?: Json | null
          target_ids?: Json | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notification_actions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_type: string
          id: string
          language: string | null
          pathname: string
          profile_id: string | null
          referrer: string | null
          session_id: string
          target: string | null
          timezone: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_type: string
          id?: string
          language?: string | null
          pathname: string
          profile_id?: string | null
          referrer?: string | null
          session_id: string
          target?: string | null
          timezone?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          language?: string | null
          pathname?: string
          profile_id?: string | null
          referrer?: string | null
          session_id?: string
          target?: string | null
          timezone?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          status: string
          tags: string[]
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
          status?: string
          tags?: string[]
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
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          profile_id: string | null
          request_ip: string | null
          source: string
          status: string
          subject: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          profile_id?: string | null
          request_ip?: string | null
          source?: string
          status?: string
          subject: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          profile_id?: string | null
          request_ip?: string | null
          source?: string
          status?: string
          subject?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "listing_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "listing_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_answers_responder_user_id_fkey"
            columns: ["responder_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "listing_attributes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
          status: string
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
          status?: string
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
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_questions_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_questions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
          status: string
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
          status?: string
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
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "listing_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_primary_material_id_fkey"
            columns: ["primary_material_id"]
            isOneToOne: false
            referencedRelation: "listing_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lme_price_snapshots: {
        Row: {
          created_at: string
          currency_code: string
          id: string
          metal_code: string
          metal_name: string
          price_value: number
          provider_name: string
          quoted_at: string
          quoted_date: string | null
          source_payload: Json | null
        }
        Insert: {
          created_at?: string
          currency_code: string
          id?: string
          metal_code: string
          metal_name: string
          price_value: number
          provider_name?: string
          quoted_at: string
          quoted_date?: string | null
          source_payload?: Json | null
        }
        Update: {
          created_at?: string
          currency_code?: string
          id?: string
          metal_code?: string
          metal_name?: string
          price_value?: number
          provider_name?: string
          quoted_at?: string
          quoted_date?: string | null
          source_payload?: Json | null
        }
        Relationships: []
      }
      notification_delivery_logs: {
        Row: {
          attempt_number: number
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          queue_id: string
          response_status_code: number | null
          retry_attempt: number
          status: string
        }
        Insert: {
          attempt_number: number
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          queue_id: string
          response_status_code?: number | null
          retry_attempt?: number
          status: string
        }
        Update: {
          attempt_number?: number
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          queue_id?: string
          response_status_code?: number | null
          retry_attempt?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "notification_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_digest: string
          email_enabled: boolean
          in_app_enabled: boolean
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          quiet_hours_timezone: string
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean
        }
        Insert: {
          created_at?: string
          email_digest?: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          email_digest?: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          attempt_count: number
          body: string
          category: string
          channel: string
          created_at: string
          final_error: string | null
          id: string
          last_attempt_at: string | null
          next_retry_at: string
          notification_id: string
          payload: Json
          priority: string
          provider_message_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          body: string
          category?: string
          channel: string
          created_at?: string
          final_error?: string | null
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string
          notification_id: string
          payload?: Json
          priority?: string
          provider_message_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          body?: string
          category?: string
          channel?: string
          created_at?: string
          final_error?: string | null
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string
          notification_id?: string
          payload?: Json
          priority?: string
          provider_message_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          category: string
          created_at: string
          id: string
          is_actionable: boolean
          priority: string
          read_at: string | null
          read_by_channels: Json
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          category?: string
          created_at?: string
          id?: string
          is_actionable?: boolean
          priority?: string
          read_at?: string | null
          read_by_channels?: Json
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_actionable?: boolean
          priority?: string
          read_at?: string | null
          read_by_channels?: Json
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          role: string
          status: string
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
          role?: string
          status?: string
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
          role?: string
          status?: string
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
      support_messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          id: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          category: string
          created_at: string
          description: string | null
          first_response_at: string | null
          first_response_due_at: string | null
          id: string
          priority: string
          sla_policy_key: string
          sla_status: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          first_response_at?: string | null
          first_response_due_at?: string | null
          id?: string
          priority?: string
          sla_policy_key?: string
          sla_status?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          category?: string
          created_at?: string
          description?: string | null
          first_response_at?: string | null
          first_response_due_at?: string | null
          id?: string
          priority?: string
          sla_policy_key?: string
          sla_status?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          admin_notification_email: string | null
          allow_guest_questions: boolean
          blog_enabled: boolean
          created_at: string
          crisis_protocol_config: Json | null
          featured_payments_enabled: boolean
          header_logo_scale_percent: number
          id: string
          maintenance_mode: boolean
          seo_description_default: string | null
          seo_title_default: string | null
          site_name: string
          support_business_hours_config: Json | null
          support_email: string | null
          support_phone: string | null
          support_sla_config: Json | null
          updated_at: string
        }
        Insert: {
          admin_notification_email?: string | null
          allow_guest_questions?: boolean
          blog_enabled?: boolean
          created_at?: string
          crisis_protocol_config?: Json | null
          featured_payments_enabled?: boolean
          header_logo_scale_percent?: number
          id?: string
          maintenance_mode?: boolean
          seo_description_default?: string | null
          seo_title_default?: string | null
          site_name: string
          support_business_hours_config?: Json | null
          support_email?: string | null
          support_phone?: string | null
          support_sla_config?: Json | null
          updated_at?: string
        }
        Update: {
          admin_notification_email?: string | null
          allow_guest_questions?: boolean
          blog_enabled?: boolean
          created_at?: string
          crisis_protocol_config?: Json | null
          featured_payments_enabled?: boolean
          header_logo_scale_percent?: number
          id?: string
          maintenance_mode?: boolean
          seo_description_default?: string | null
          seo_title_default?: string | null
          site_name?: string
          support_business_hours_config?: Json | null
          support_email?: string | null
          support_phone?: string | null
          support_sla_config?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_log_feed: {
        Row: {
          action_key: string | null
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string | null
          detail: string | null
          entity_id: string | null
          entity_type: string | null
          id: string | null
          kind: string | null
          label: string | null
          payload: Json | null
          secondary_label: string | null
          severity: string | null
          source_name: string | null
        }
        Relationships: []
      }
      lme_snapshot_months: {
        Row: {
          last_quoted_date: string | null
          month_key: string | null
          month_start: string | null
          trading_days: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_support_business_minutes: {
        Args: { minutes_to_add: number; start_ts: string }
        Returns: string
      }
      align_support_business_start: {
        Args: { input_ts: string }
        Returns: string
      }
      compute_support_sla_status: {
        Args: { due_at: string; first_response_at: string }
        Returns: string
      }
      current_profile_id: { Args: never; Returns: string }
      generate_unique_listing_slug: {
        Args: { current_listing_id?: string; source_title: string }
        Returns: string
      }
      get_support_business_hours_config: { Args: never; Returns: Json }
      get_support_sla_config: { Args: never; Returns: Json }
      get_support_sla_target_hours: {
        Args: { category_key: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_support_business_minute: {
        Args: { input_ts: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { input: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
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

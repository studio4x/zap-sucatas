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
    }
    Views: Record<string, never>
  }
}

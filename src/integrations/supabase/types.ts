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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string
          listing_id: string
          seller_id: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id: string
          seller_id?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accepts_offers: boolean
          alteration_potential: string | null
          bust_cm: number | null
          category: string
          closure: string | null
          colour: string
          condition: string
          condition_notes: string | null
          created_at: string
          delivery_options: string[]
          department: string
          description: string | null
          dispatch_days: number | null
          fabric: string
          fabric_notes: string | null
          favourite_count: number
          fit_notes: string | null
          hip_cm: number | null
          id: string
          image_key: string
          image_paths: string[]
          included: string | null
          length_cm: number | null
          location: string | null
          occasion: string
          original_price_pence: number | null
          package_size: string | null
          price_pence: number
          seller_id: string | null
          seller_items_sold: number
          seller_location: string | null
          seller_name: string
          seller_rating: number
          seller_review_count: number
          shoulder_cm: number | null
          sleeve_cm: number | null
          status: string
          stretch_level: string | null
          structure: string | null
          title: string
          trending: boolean
          uk_size: string | null
          waist_cm: number | null
          wearer_height_cm: number | null
        }
        Insert: {
          accepts_offers?: boolean
          alteration_potential?: string | null
          bust_cm?: number | null
          category: string
          closure?: string | null
          colour: string
          condition: string
          condition_notes?: string | null
          created_at?: string
          delivery_options?: string[]
          department?: string
          description?: string | null
          dispatch_days?: number | null
          fabric: string
          fabric_notes?: string | null
          favourite_count?: number
          fit_notes?: string | null
          hip_cm?: number | null
          id?: string
          image_key?: string
          image_paths?: string[]
          included?: string | null
          length_cm?: number | null
          location?: string | null
          occasion: string
          original_price_pence?: number | null
          package_size?: string | null
          price_pence: number
          seller_id?: string | null
          seller_items_sold?: number
          seller_location?: string | null
          seller_name?: string
          seller_rating?: number
          seller_review_count?: number
          shoulder_cm?: number | null
          sleeve_cm?: number | null
          status?: string
          stretch_level?: string | null
          structure?: string | null
          title: string
          trending?: boolean
          uk_size?: string | null
          waist_cm?: number | null
          wearer_height_cm?: number | null
        }
        Update: {
          accepts_offers?: boolean
          alteration_potential?: string | null
          bust_cm?: number | null
          category?: string
          closure?: string | null
          colour?: string
          condition?: string
          condition_notes?: string | null
          created_at?: string
          delivery_options?: string[]
          department?: string
          description?: string | null
          dispatch_days?: number | null
          fabric?: string
          fabric_notes?: string | null
          favourite_count?: number
          fit_notes?: string | null
          hip_cm?: number | null
          id?: string
          image_key?: string
          image_paths?: string[]
          included?: string | null
          length_cm?: number | null
          location?: string | null
          occasion?: string
          original_price_pence?: number | null
          package_size?: string | null
          price_pence?: number
          seller_id?: string | null
          seller_items_sold?: number
          seller_location?: string | null
          seller_name?: string
          seller_rating?: number
          seller_review_count?: number
          shoulder_cm?: number | null
          sleeve_cm?: number | null
          status?: string
          stretch_level?: string | null
          structure?: string | null
          title?: string
          trending?: boolean
          uk_size?: string | null
          waist_cm?: number | null
          wearer_height_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          order_id: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_city: string
          address_line1: string
          address_line2: string | null
          address_name: string
          address_postcode: string
          buyer_id: string
          created_at: string
          delivered_at: string | null
          delivery_method: string
          delivery_pence: number
          drop_off_by: string | null
          fee_pence: number
          id: string
          image_key: string
          image_path: string | null
          issue_details: string | null
          issue_type: string | null
          item_pence: number
          listing_id: string
          listing_title: string
          seller_id: string | null
          stage: number
          total_pence: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          address_city: string
          address_line1: string
          address_line2?: string | null
          address_name: string
          address_postcode: string
          buyer_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_method: string
          delivery_pence: number
          drop_off_by?: string | null
          fee_pence: number
          id?: string
          image_key?: string
          image_path?: string | null
          issue_details?: string | null
          issue_type?: string | null
          item_pence: number
          listing_id: string
          listing_title: string
          seller_id?: string | null
          stage?: number
          total_pence: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string
          address_line1?: string
          address_line2?: string | null
          address_name?: string
          address_postcode?: string
          buyer_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_method?: string
          delivery_pence?: number
          drop_off_by?: string | null
          fee_pence?: number
          id?: string
          image_key?: string
          image_path?: string | null
          issue_details?: string | null
          issue_type?: string | null
          item_pence?: number
          listing_id?: string
          listing_title?: string
          seller_id?: string | null
          stage?: number
          total_pence?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          fit_bust_cm: number | null
          fit_height_cm: number | null
          fit_hip_cm: number | null
          fit_waist_cm: number | null
          id: string
          intent: string | null
          last_name: string | null
          location: string | null
          onboarded: boolean
          postcode: string | null
          preferred_fit: string | null
          unit_preference: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          fit_bust_cm?: number | null
          fit_height_cm?: number | null
          fit_hip_cm?: number | null
          fit_waist_cm?: number | null
          id: string
          intent?: string | null
          last_name?: string | null
          location?: string | null
          onboarded?: boolean
          postcode?: string | null
          preferred_fit?: string | null
          unit_preference?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          fit_bust_cm?: number | null
          fit_height_cm?: number | null
          fit_hip_cm?: number | null
          fit_waist_cm?: number | null
          id?: string
          intent?: string | null
          last_name?: string | null
          location?: string | null
          onboarded?: boolean
          postcode?: string | null
          preferred_fit?: string | null
          unit_preference?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          communication: number | null
          created_at: string
          direction: string
          dispatch_speed: number | null
          id: string
          item_accuracy: number | null
          listing_id: string
          order_id: string
          rating: number
          reviewee_id: string | null
          reviewer_id: string
          smooth_transaction: number | null
        }
        Insert: {
          body?: string | null
          communication?: number | null
          created_at?: string
          direction: string
          dispatch_speed?: number | null
          id?: string
          item_accuracy?: number | null
          listing_id: string
          order_id: string
          rating: number
          reviewee_id?: string | null
          reviewer_id: string
          smooth_transaction?: number | null
        }
        Update: {
          body?: string | null
          communication?: number | null
          created_at?: string
          direction?: string
          dispatch_speed?: number | null
          id?: string
          item_accuracy?: number | null
          listing_id?: string
          order_id?: string
          rating?: number
          reviewee_id?: string | null
          reviewer_id?: string
          smooth_transaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mark_conversation_read: {
        Args: { _conversation_id: string }
        Returns: number
      }
      sync_order_tracking: { Args: { _order_id: string }; Returns: number }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

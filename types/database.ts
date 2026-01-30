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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      events: {
        Row: {
          cover_image: string | null
          created_at: string | null
          description: string | null
          end_at: string | null
          end_date: string | null
          end_time: string | null
          id: number
          information: string | null
          last_updated: string | null
          location_name: string | null
          name: string | null
          slug: string
          start_at: string | null
          start_date: string | null
          start_time: string | null
          tickets: Json | null
          url: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: number
          information?: string | null
          last_updated?: string | null
          location_name?: string | null
          name?: string | null
          slug: string
          start_at?: string | null
          start_date?: string | null
          start_time?: string | null
          tickets?: Json | null
          url?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          end_at?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: number
          information?: string | null
          last_updated?: string | null
          location_name?: string | null
          name?: string | null
          slug?: string
          start_at?: string | null
          start_date?: string | null
          start_time?: string | null
          tickets?: Json | null
          url?: string | null
        }
        Relationships: []
      }
      expensify_banks: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expensify_budgets: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expensify_cards: {
        Row: {
          bank_id: string | null
          created_at: string
          id: string
          last4: string | null
          name: string
          updated_at: string
        }
        Insert: {
          bank_id?: string | null
          created_at?: string
          id?: string
          last4?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          bank_id?: string | null
          created_at?: string
          id?: string
          last4?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expensify_cards_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "expensify_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      expensify_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expensify_transactions: {
        Row: {
          amount: number
          bank: string
          card_id: string | null
          category: string | null
          category_id: string | null
          created_at: string
          description: string
          id: number
          income_message_id: string | null
          is_manual: boolean
          occurred_at: string
          type: string
        }
        Insert: {
          amount: number
          bank?: string
          card_id?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          id?: number
          income_message_id?: string | null
          is_manual?: boolean
          occurred_at?: string
          type: string
        }
        Update: {
          amount?: number
          bank?: string
          card_id?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          id?: number
          income_message_id?: string | null
          is_manual?: boolean
          occurred_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "expensify_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "expensify_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expensify_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expensify_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expensify_tx_budget_assignments: {
        Row: {
          budget_id: string
          created_at: string
          transaction_id: number
        }
        Insert: {
          budget_id: string
          created_at?: string
          transaction_id: number
        }
        Update: {
          budget_id?: string
          created_at?: string
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "expensify_tx_budget_assignments_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "expensify_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number | null
          bank: string
          category: string | null
          created_at: string
          description: string | null
          id: number
          income_message_id: string | null
          notes: string | null
          occurred_at: string
          title: string | null
          type: string | null
        }
        Insert: {
          amount?: number | null
          bank: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: number
          income_message_id?: string | null
          notes?: string | null
          occurred_at: string
          title?: string | null
          type?: string | null
        }
        Update: {
          amount?: number | null
          bank?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: number
          income_message_id?: string | null
          notes?: string | null
          occurred_at?: string
          title?: string | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

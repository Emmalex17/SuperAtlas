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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      action_types: {
        Row: {
          created_at: string
          description: string | null
          has_penalty: boolean
          id: string
          key: string
          level: number
          name: string
          response_days: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          has_penalty?: boolean
          id?: string
          key: string
          level: number
          name: string
          response_days?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          has_penalty?: boolean
          id?: string
          key?: string
          level?: number
          name?: string
          response_days?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_name: string
          actor_user_id: string | null
          at: string
          detail: Json
          id: string
          ip: string | null
          record_id: string | null
          record_label: string | null
          record_type: string | null
          tenant_id: string
          user_agent: string | null
          workspace: string | null
        }
        Insert: {
          action: string
          actor_name: string
          actor_user_id?: string | null
          at?: string
          detail?: Json
          id?: string
          ip?: string | null
          record_id?: string | null
          record_label?: string | null
          record_type?: string | null
          tenant_id: string
          user_agent?: string | null
          workspace?: string | null
        }
        Update: {
          action?: string
          actor_name?: string
          actor_user_id?: string | null
          at?: string
          detail?: Json
          id?: string
          ip?: string | null
          record_id?: string | null
          record_label?: string | null
          record_type?: string | null
          tenant_id?: string
          user_agent?: string | null
          workspace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempts: number
          brevo_message_id: string | null
          created_at: string
          id: string
          last_error: string | null
          next_attempt_at: string
          params: Json
          status: string
          template: string
          tenant_id: string
          to_email: string
          to_name: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          brevo_message_id?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          params?: Json
          status?: string
          template: string
          tenant_id: string
          to_email: string
          to_name?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          brevo_message_id?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          params?: Json
          status?: string
          template?: string
          tenant_id?: string
          to_email?: string
          to_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_suppressions: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_suppressions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_classes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          fix_days: number
          id: string
          name: string
          sort: number
          tenant_id: string
          tone: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          fix_days?: number
          id?: string
          name: string
          sort?: number
          tenant_id: string
          tone?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          fix_days?: number
          id?: string
          name?: string
          sort?: number
          tenant_id?: string
          tone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finding_classes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      firms: {
        Row: {
          colour: string | null
          created_at: string
          id: string
          initials: string | null
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          colour?: string | null
          created_at?: string
          id?: string
          initials?: string | null
          name: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          colour?: string | null
          created_at?: string
          id?: string
          initials?: string | null
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "firms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          firm_id: string | null
          id: string
          invited_by: string | null
          org_id: string | null
          payload: Json
          role: string
          status: string
          tenant_id: string
          token_hash: string
          updated_at: string
          workspace: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          firm_id?: string | null
          id?: string
          invited_by?: string | null
          org_id?: string | null
          payload?: Json
          role: string
          status?: string
          tenant_id: string
          token_hash: string
          updated_at?: string
          workspace: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          firm_id?: string | null
          id?: string
          invited_by?: string | null
          org_id?: string | null
          payload?: Json
          role?: string
          status?: string
          tenant_id?: string
          token_hash?: string
          updated_at?: string
          workspace?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_firm_fk"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          firm_id: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          org_id: string | null
          role: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
          workspace: string
        }
        Insert: {
          created_at?: string
          firm_id?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          org_id?: string | null
          role: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
          workspace: string
        }
        Update: {
          created_at?: string
          firm_id?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          org_id?: string | null
          role?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
          workspace?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_firm_fk"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          icon: string | null
          id: string
          kind: string
          link_arg: string | null
          link_route: string | null
          read_at: string | null
          tenant_id: string
          title: string
          tone: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          kind: string
          link_arg?: string | null
          link_route?: string | null
          read_at?: string | null
          tenant_id: string
          title: string
          tone?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          kind?: string
          link_arg?: string | null
          link_route?: string | null
          read_at?: string | null
          tenant_id?: string
          title?: string
          tone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      org_tiers: {
        Row: {
          created_at: string
          id: string
          name: string
          org_type_id: string
          sort: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_type_id: string
          sort?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_type_id?: string
          sort?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_tiers_org_type_id_fkey"
            columns: ["org_type_id"]
            isOneToOne: false
            referencedRelation: "org_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_tiers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      org_types: {
        Row: {
          created_at: string
          id: string
          name: string
          plural_name: string | null
          sector_group_id: string
          sort: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plural_name?: string | null
          sector_group_id: string
          sort?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plural_name?: string | null
          sector_group_id?: string
          sort?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_types_sector_group_id_fkey"
            columns: ["sector_group_id"]
            isOneToOne: false
            referencedRelation: "sector_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          colour: string | null
          created_at: string
          id: string
          initials: string | null
          name: string
          short_name: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          colour?: string | null
          created_at?: string
          id?: string
          initials?: string | null
          name: string
          short_name?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          colour?: string | null
          created_at?: string
          id?: string
          initials?: string | null
          name?: string
          short_name?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string
          initials: string | null
          is_demo: boolean
          job_title: string | null
          last_seen_at: string | null
          notification_prefs: Json
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name: string
          initials?: string | null
          is_demo?: boolean
          job_title?: string | null
          last_seen_at?: string | null
          notification_prefs?: Json
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          initials?: string | null
          is_demo?: boolean
          job_title?: string | null
          last_seen_at?: string | null
          notification_prefs?: Json
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          permission: string
          role: string
          tenant_id: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission: string
          role: string
          tenant_id: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          permission?: string
          role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_schemes: {
        Row: {
          bands: Json
          created_at: string
          id: string
          is_default: boolean
          kind: string
          levels: Json
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bands?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          kind: string
          levels?: Json
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bands?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          kind?: string
          levels?: Json
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_schemes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          sort: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sector_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_rules: {
        Row: {
          compliance_benchmark_default: number
          conflict_months: number
          firm_grace_days: number
          firm_renewal_months: number
          tenant_id: string
          updated_at: string
          watch_cycles_running: number
          watch_late_runs: number
          watch_overdue_days: number | null
        }
        Insert: {
          compliance_benchmark_default?: number
          conflict_months?: number
          firm_grace_days?: number
          firm_renewal_months?: number
          tenant_id: string
          updated_at?: string
          watch_cycles_running?: number
          watch_late_runs?: number
          watch_overdue_days?: number | null
        }
        Update: {
          compliance_benchmark_default?: number
          conflict_months?: number
          firm_grace_days?: number
          firm_renewal_months?: number
          tenant_id?: string
          updated_at?: string
          watch_cycles_running?: number
          watch_late_runs?: number
          watch_overdue_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          branding: Json
          created_at: string
          email: string | null
          id: string
          is_demo: boolean
          legal_name: string | null
          mandate: string | null
          name: string
          phone: string | null
          sectors: string[]
          settings: Json
          short_name: string
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          branding?: Json
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          legal_name?: string | null
          mandate?: string | null
          name: string
          phone?: string | null
          sectors?: string[]
          settings?: Json
          short_name: string
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          branding?: Json
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          legal_name?: string | null
          mandate?: string | null
          name?: string
          phone?: string | null
          sectors?: string[]
          settings?: Json
          short_name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_membership: {
        Args: never
        Returns: {
          created_at: string
          firm_id: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          org_id: string | null
          role: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
          workspace: string
        }
        SetofOptions: {
          from: "*"
          to: "memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_tenant_id: { Args: never; Returns: string }
      firm_can_see_org: { Args: { target_org: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_firm_member: { Args: { target_firm: string }; Returns: boolean }
      is_org_member: { Args: { target_org: string }; Returns: boolean }
      is_regulator: { Args: { perm?: string }; Returns: boolean }
      org_can_see_firm: { Args: { target_firm: string }; Returns: boolean }
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

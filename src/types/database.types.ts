export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: number
          name: string
          type: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          type: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          type?: string
          created_at?: string
        }
        Relationships: []
      }
      ports: {
        Row: {
          id: string
          device_id: number
          label: string
          type: 'Input' | 'Output' | 'Other'
          patchbay_id: number | null
          created_at: string
        }
        Insert: {
          id: string
          device_id: number
          label: string
          type: 'Input' | 'Output' | 'Other'
          patchbay_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          device_id?: number
          label?: string
          type?: 'Input' | 'Output' | 'Other'
          patchbay_id?: number | null
          created_at?: string
        }
        Relationships: []
      }
      patchbay_points: {
        Row: {
          id: number
          name: string
          description: string | null
          type: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          type: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          type?: string
          created_at?: string
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

// Tipos de conveniencia
export type Device = Database['public']['Tables']['devices']['Row']
export type Port = Database['public']['Tables']['ports']['Row']
export type PatchbayPoint = Database['public']['Tables']['patchbay_points']['Row']

// Tipos con relaciones
export interface DeviceWithPorts extends Device {
  ports: Port[]
}

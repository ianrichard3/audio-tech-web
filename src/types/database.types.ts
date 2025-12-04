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
      get_all_data: {
        Args: Record<string, never>
        Returns: {
          patchbay_points: {
            id: number
            name: string
            description: string
            type: string
          }[]
          devices: {
            id: number
            name: string
            type: string
            ports: {
              id: string
              label: string
              type: 'Input' | 'Output' | 'Other'
              patchbayId: number | null
            }[]
          }[]
        }
      }
      link_port: {
        Args: {
          p_port_id: string
          p_patchbay_id: number
        }
        Returns: {
          id: string
          label: string
          type: string
          patchbayId: number | null
        }
      }
      unlink_port: {
        Args: {
          p_port_id: string
        }
        Returns: {
          id: string
          label: string
          type: string
          patchbayId: number | null
        }
      }
      link_patchbay_to_device: {
        Args: {
          p_patchbay_id: number
          p_port_id: string
        }
        Returns: {
          id: string
          label: string
          type: string
          patchbayId: number | null
          unlinkedPortId: string | null
        }
      }
      add_device: {
        Args: {
          p_name: string
          p_type: string
          p_ports?: { label: string; type: string; patchbayId: number | null }[]
        }
        Returns: {
          id: number
          name: string
          type: string
          ports: {
            id: string
            label: string
            type: string
            patchbayId: number | null
          }[]
        }
      }
      delete_device: {
        Args: {
          p_device_id: number
        }
        Returns: {
          id: number
          name: string
          type: string
        }
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

// Tipos de conveniencia
export type Device = Database['public']['Tables']['devices']['Row']
export type Port = Database['public']['Tables']['ports']['Row']
export type PatchbayPoint = Database['public']['Tables']['patchbay_points']['Row']

// Tipos con relaciones
export interface DeviceWithPorts extends Device {
  ports: Port[]
}

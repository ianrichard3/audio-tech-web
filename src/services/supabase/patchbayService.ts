import { supabase } from '@/lib/supabase'
import type { PatchbayPoint } from '@/types/database.types'

// ============================================
// PATCHBAY POINTS
// ============================================

export const getPatchbayPoints = async (): Promise<PatchbayPoint[]> => {
  const { data, error } = await supabase
    .from('patchbay_points')
    .select('*')
    .order('id')

  if (error) throw error
  return data
}

export const getPatchbayPointById = async (id: number): Promise<PatchbayPoint | null> => {
  const { data, error } = await supabase
    .from('patchbay_points')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const createPatchbayPoint = async (
  point: Omit<PatchbayPoint, 'id' | 'created_at'>
): Promise<PatchbayPoint> => {
  const { data, error } = await supabase
    .from('patchbay_points')
    .insert(point)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updatePatchbayPoint = async (
  id: number,
  point: Partial<Omit<PatchbayPoint, 'id' | 'created_at'>>
): Promise<PatchbayPoint> => {
  const { data, error } = await supabase
    .from('patchbay_points')
    .update(point)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deletePatchbayPoint = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from('patchbay_points')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Buscar puntos por nombre
export const searchPatchbayPoints = async (searchTerm: string): Promise<PatchbayPoint[]> => {
  const { data, error } = await supabase
    .from('patchbay_points')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .order('id')

  if (error) throw error
  return data
}

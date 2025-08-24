import mockCellsJson from './mockCellsData.json';

export interface CellData {
  id: string;
  name: string;
  description: string;
}

export const cells: CellData[] = Array.isArray(mockCellsJson)
  ? mockCellsJson.map((cell, i) => ({
    id: cell.id || `cell-${i + 1}`,
    name: cell.name || `Cell ${i + 1}`,
    description: cell.description || ''
  }))
  : [];
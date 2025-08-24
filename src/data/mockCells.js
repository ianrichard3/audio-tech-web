import mockCellsJson from './mockCellsData.json';

export const cells = Array.isArray(mockCellsJson)
  ? mockCellsJson.map((cell, i) => ({
    id: cell.id || `cell-${i + 1}`,
    name: cell.name || `Cell ${i + 1}`,
    description: cell.description || ''
  }))
  : [];
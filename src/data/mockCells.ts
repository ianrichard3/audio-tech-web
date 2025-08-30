import mockCellsJson from './mockCellsData.json';

export interface CellData {
  id: string;
  name: string;
  description: string;
}




export const cells: CellData[] = Array.isArray(mockCellsJson)
  ? mockCellsJson.map((cell, i) => ({
    id: cell.id || `cell-${i + 1}`,
    name: cell.id.slice(3, 7) || `Cell ${i + 1}`,
    description: cell.description || ''
  }))
  : [];

// export const cells: CellData[] = [
//   {
//     id: 'wall-1',
//     name: 'wall 1',
//     description: 'Better for microphones'
//   },
//   {
//     id: 'wall-2',
//     name: 'wall 2',
//     description: 'Better for speakers'
//   },
//   {
//     id: 'wall-3',
//     name: 'wall 3',
//     description: 'Better for both'
//   },
//   {
//     id: 'wall-4',
//     name: 'wall 4',
//     description: 'Best for all'
//   },
//   {
//     id: 'preamp-1',
//     name: 'preamp 1',
//     description: 'Incredible preamp in 1'
//   },
//   {
//     id: 'preamp-2',
//     name: 'preamp 2',
//     description: 'Incredible preamp in 2'
//   },
//   {
//     id: 'preamp-3',
//     name: 'preamp 3',
//     description: 'Incredible preamp in 3'
//   },
//   {
//     id: 'preamp-4',
//     name: 'preamp 4',
//     description: 'Incredible preamp in 4'
//   }
// ];


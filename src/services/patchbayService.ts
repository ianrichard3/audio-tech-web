import patchbayData from '../data/patchbayData.json';

export interface PatchBayNode {
  id: number;
  name: string;
  description: string;
  type: string;
}

export const getPatchBayData = async (): Promise<PatchBayNode[]> => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(patchbayData);
    }, 100); // 100ms delay
  });
};

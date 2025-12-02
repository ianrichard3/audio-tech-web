import devicesData from '../data/devicesData.json';

export interface DevicePort {
  id: string;
  label: string;
  type: 'Input' | 'Output';
  patchbayId: number | null;
}

export interface Device {
  id: number;
  name: string;
  type: string;
  ports: DevicePort[];
}

export const getDevices = async (): Promise<Device[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(devicesData as Device[]);
    }, 100);
  });
};

export const saveDevice = async (device: Device): Promise<Device> => {
  // Simulate saving
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Saved device:', device);
      resolve(device);
    }, 100);
  });
};

export const deleteDevice = async (id: number): Promise<void> => {
  // Simulate deletion
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Deleted device:', id);
      resolve();
    }, 100);
  });
};

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseInput {
  name: string;
  address: string;
}

export interface UpdateWarehouseInput {
  name?: string;
  address?: string;
  isActive?: boolean;
}

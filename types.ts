
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  lastUpdated: string;
}

export interface InventoryHistory {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  timestamp: string;
  notes?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  SCANNER = 'SCANNER',
  HISTORY = 'HISTORY'
}

export interface ScanResult {
  sku: string;
  name?: string;
  category?: string;
  description?: string;
  confidence: number;
}

export interface DrugStockInfo {
  quantityOnHand: number;
  expiryDate: string | null;
  batchNumber: string | null;
}

export interface DrugListItem {
  id: string;
  nameGeneric: string;
  nameBrand: string | null;
  category: string | null;
  unit: string;
  purchasePrice: string | number;
  sellingPrice: string | number;
  minimumStock: number | null;
  stocks: DrugStockInfo[];
}

export interface ExpiringStockItem {
  id: string;
  batchNumber: string | null;
  expiryDate: string;
  quantityOnHand: number;
  drug: { id: string; nameGeneric: string; unit: string };
}

export interface StockMovementItem {
  id: string;
  movementType: "IN" | "OUT" | "ADJUSTMENT" | "EXPIRED" | "RETURN";
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: string;
  performedBy: { name: string } | null;
}

export const MOVEMENT_LABEL: Record<StockMovementItem["movementType"], string> =
  {
    IN: "Masuk",
    OUT: "Keluar",
    ADJUSTMENT: "Penyesuaian",
    EXPIRED: "Expired",
    RETURN: "Retur",
  };

export function totalStock(drug: DrugListItem): number {
  return drug.stocks.reduce((sum, s) => sum + s.quantityOnHand, 0);
}

// AUTO-GENERATED — do not edit by hand.
// Regenerate via `yarn codegen`.

export type Order = {
  id: string;
  customerId: string;
  shippedAt: string | null;
  status: 'pending' | 'shipped' | 'cancelled';
};

export type Widget = {
  id: string;
  sku: string;
  inventory: number;
};

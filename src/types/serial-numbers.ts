export type SerialNumberEntity = 'sales_invoices' | 'purchase_invoices' | 'orders';

export interface SerialNumber {
  id: string;
  entity: SerialNumberEntity;
  name: string;
  value: string;
  last_num_value: number;
}

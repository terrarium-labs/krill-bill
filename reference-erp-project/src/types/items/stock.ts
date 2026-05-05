import { Vehicle } from "../general/vehicles";

export interface StockLocation {
  id: string;
  name: string;
  status: "active" | "inactive";
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  notes: string;
  distance: number;
  time_to_travel: number;
  latitude: number;
  longitude: number;
  icon_url: string;
  vehicle?: Vehicle | null;
  num_items: number;
  stock_rotation_type: "fifo" | "lifo" | "fefo" | "lefo" | "hifo" | "lofo";
  created_at: string;
  updated_at: string;
}

export interface StockLocationItem {
  location_id: string;
  location_name: string;
  quantity: number;
  last_entry: string | null;
  last_exit: string | null;
  last_adjustment: string | null;
}

export interface StockLocationInfoItem {
  item_id: string;
  item_name: string;
  quantity: number;
}


export interface StockLocationHistoryItem {
  id: string;
  quantity: number;
  type: string;
  date_stock: string;
  location_id: string | null;
  location_name: string | null;
  item_id: string | null;
  item_name: string | null;
  account_id: string | null;
  account_name: string | null;
  document_id: string | null;
  unit_price: number | null;
}
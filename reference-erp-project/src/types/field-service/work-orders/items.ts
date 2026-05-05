import {  ItemPhoto } from "@/types/items/items";

export interface WorkOrderItemDetail  {
    id: string;
    item_code?: string;
    name: string;
    description?: string;
    is_bundle: boolean;
    barcode: string;
    photos: ItemPhoto[];
}

export interface ItemWorkOrder 
{
  id: string;
  item?: WorkOrderItemDetail | null;
  quantity: number;
  notes: string;
  price: number;
  name?: string;
  description?: string;
}

/** Returns item-like data for display: prefers item, falls back to name/description from ItemWorkOrder */
export function getItemDisplayData(wo: ItemWorkOrder): { id: string; name: string; item_code?: string; description?: string } | null {
  if (wo.item) return wo.item;
  if (wo.name) return { id: wo.id, name: wo.name };
  return null;
}

/** Returns description: prefers item.description, falls back to ItemWorkOrder.description */
export function getItemDescription(wo: ItemWorkOrder): string | null | undefined {
  return wo.item?.description ?? wo.description ?? null;
}
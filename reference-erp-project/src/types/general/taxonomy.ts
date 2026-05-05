export type ItemHierarchy = {
  id: string;
  parent: {
    id: string;
    name: string;
  } | null;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  type: "family" | "sub_family" | "category";
  margin: number | null;
  num_items_hierarchy: number;
  num_items_total: number;
};
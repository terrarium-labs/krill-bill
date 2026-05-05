import { laiaFetch } from "../../0.core/basics";
import { baseApiUrl } from "@/api/0.core/url";

// GET /orgs/{org_id}/rates -> List default rates for items in an org
const getOrgRates = async (org_id: string, query?: string, page_token?: string) => {
    const url = new URL(`/orgs/${org_id}/rates`, baseApiUrl);
    const queryParams = new URLSearchParams();
    if (query) queryParams.set("query", query);
    if (page_token) queryParams.set("page_token", page_token);
    url.search = queryParams.toString();
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// POST /orgs/{org_id}/rates -> Create a rate for a group of items
const postOrgRate = async (org_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/rates`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// GET /orgs/{org_id}/rates/{rate_id} -> Get a rate for an org
const getOrgRate = async (org_id: string, rate_id: string) => {
    const url = new URL(`/orgs/${org_id}/rates/${rate_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

// DELETE /orgs/{org_id}/rates/{rate_id} -> Delete a rate for an org
const deleteOrgRate = async (org_id: string, rate_id: string) => {
    const url = new URL(`/orgs/${org_id}/rates/${rate_id}`, baseApiUrl);
    const response = await laiaFetch(url, { method: "DELETE" });
    return response;
};

// PATCH /orgs/{org_id}/rates/{rate_id} -> Update a rate
const patchOrgRate = async (org_id: string, rate_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/rates/${rate_id}`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

// PATCH /orgs/{org_id}/rates/{rate_id}/items-hierarchies-margins
const patchOrgRateItemsHierarchiesMargins = async (org_id: string, rate_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/rates/${rate_id}/items-hierarchies-margins`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

//GET /orgs/{org_id}/rates/{rate_id}/items
//{
// "items": [
//     {
//       "id": "string",
//       "item_code": "string",
//       "name": "string",
//       "description": "string",
//       "pmc": 0,
//       "is_pmc_fixed": false,
//       "cost_calc_days": 0,
//       "rate_price": {
//         "id": "string",
//         "is_default": true,
//         "priority": 0,
//         "price_quantity": 0,
//         "price_currency": "string",
//         "margin": 0,
//         "billing_type": "one-off",
//         "billing_period": "daily",
//         "price_model": "graduated",
//         "price_tiers": [
//           {
//             "from_quantity": 0,
//             "to_quantity": 0,
//             "discount": 0,
//             "discount_unit": "string",
//             "unit": "string"
//           }
//         ],
//         "tax_included": true,
//         "warranty_period": 0,
//         "warranty_unit": "days",
//         "type": "buy",
//         "notes": "string",
//         "clients": [
//           {
//             "id": "string",
//             "trade_name": "string",
//             "client_name": "string",
//             "url": "https://example.com/",
//             "photo_url": "https://example.com/",
//             "tax_code": "string",
//             "tax_code_type": "string",
//             "address_line_1": "string",
//             "address_line_2": "string",
//             "postal_code": "string",
//             "city": "string",
//             "state_province": "string",
//             "country": "st",
//             "notes": "string",
//             "tags": [
//               {
//                 "id": "string",
//                 "name": "string",
//                 "type": "items",
//                 "color": "string",
//                 "icon": "string"
//               }
//             ],
//             "created_at": "2025-12-15T14:04:26.267Z",
//             "email": "string",
//             "phone": "string",
//             "sections": [
//               {
//                 "id": "string",
//                 "title": "string",
//                 "description": "string",
//                 "table_name": "Clients",
//                 "handler": "string",
//                 "fields": [
//                   {
//                     "id": "string",
//                     "table_name": "Items",
//                     "data_type": "text",
//                     "enum_types": [
//                       "string"
//                     ],
//                     "default_value": "string",
//                     "name": "string",
//                     "description": "string",
//                     "is_nullable": true,
//                     "is_unique": true,
//                     "is_multiple_values": true,
//                     "is_shown_by_default": true,
//                     "value": "string"
//                   }
//                 ]
//               }
//             ],
//             "risk": 0,
//             "is_covered_risk": true,
//             "default_due_days": 0,
//             "default_payment_day": 0,
//             "language": "st",
//             "currency": "str"
//           }
//         ],
//         "supplier": {
//           "id": "string",
//           "trade_name": "string",
//           "supplier_name": "string",
//           "url": "https://example.com/",
//           "photo_url": "https://example.com/",
//           "tax_code": "string",
//           "tax_code_type": "string",
//           "address_line_1": "string",
//           "address_line_2": "string",
//           "postal_code": "string",
//           "city": "string",
//           "state_province": "string",
//           "country": "st",
//           "notes": "string",
//           "tags": [
//             {
//               "id": "string",
//               "name": "string",
//               "type": "items",
//               "color": "string",
//               "icon": "string"
//             }
//           ],
//           "created_at": "2025-12-15T14:04:26.267Z",
//           "email": "string",
//           "phone": "string",
//           "sections": [
//             {
//               "id": "string",
//               "title": "string",
//               "description": "string",
//               "table_name": "Clients",
//               "handler": "string",
//               "fields": [
//                 {
//                   "id": "string",
//                   "table_name": "Items",
//                   "data_type": "text",
//                   "enum_types": [
//                     "string"
//                   ],
//                   "default_value": "string",
//                   "name": "string",
//                   "description": "string",
//                   "is_nullable": true,
//                   "is_unique": true,
//                   "is_multiple_values": true,
//                   "is_shown_by_default": true,
//                   "value": "string"
//                 }
//               ]
//             }
//           ],
//           "risk": 0,
//           "is_covered_risk": true,
//           "default_due_days": 0,
//           "default_payment_day": 0,
//           "language": "st",
//           "currency": "str"
//         },
//         "taxes": [
//           {
//             "id": "string",
//             "type": "string",
//             "amount": 0,
//             "country": "st"
//           }
//         ],
//         "supplier_barcode": "string",
//         "pricing_mode": "margin_fixed",
//         "rate_id": "string",
//         "rate_name": "string",
//         "supplier_discount": 0,
//         "supplier_pvp": 0,
//         "item_hierarchy": {
//           "id": "string",
//           "parent": {
//             "id": "string",
//             "name": "string"
//           },
//           "name": "string",
//           "description": "string",
//           "icon": "string",
//           "color": "string",
//           "type": "string",
//           "margin": 0,
//           "rate_margin": 0,
//           "num_items_hierarchy": 0,
//           "num_items_total": 0
//         }
//       },
//       "default_price": {
//         "id": "string",
//         "is_default": true,
//         "priority": 0,
//         "price_quantity": 0,
//         "price_currency": "string",
//         "margin": 0,
//         "billing_type": "one-off",
//         "billing_period": "daily",
//         "price_model": "graduated",
//         "price_tiers": [
//           {
//             "from_quantity": 0,
//             "to_quantity": 0,
//             "discount": 0,
//             "discount_unit": "string",
//             "unit": "string"
//           }
//         ],
//         "tax_included": true,
//         "warranty_period": 0,
//         "warranty_unit": "days",
//         "type": "buy",
//         "notes": "string",
//         "clients": [
//           {
//             "id": "string",
//             "trade_name": "string",
//             "client_name": "string",
//             "url": "https://example.com/",
//             "photo_url": "https://example.com/",
//             "tax_code": "string",
//             "tax_code_type": "string",
//             "address_line_1": "string",
//             "address_line_2": "string",
//             "postal_code": "string",
//             "city": "string",
//             "state_province": "string",
//             "country": "st",
//             "notes": "string",
//             "tags": [
//               {
//                 "id": "string",
//                 "name": "string",
//                 "type": "items",
//                 "color": "string",
//                 "icon": "string"
//               }
//             ],
//             "created_at": "2025-12-15T14:04:26.267Z",
//             "email": "string",
//             "phone": "string",
//             "sections": [
//               {
//                 "id": "string",
//                 "title": "string",
//                 "description": "string",
//                 "table_name": "Clients",
//                 "handler": "string",
//                 "fields": [
//                   {
//                     "id": "string",
//                     "table_name": "Items",
//                     "data_type": "text",
//                     "enum_types": [
//                       "string"
//                     ],
//                     "default_value": "string",
//                     "name": "string",
//                     "description": "string",
//                     "is_nullable": true,
//                     "is_unique": true,
//                     "is_multiple_values": true,
//                     "is_shown_by_default": true,
//                     "value": "string"
//                   }
//                 ]
//               }
//             ],
//             "risk": 0,
//             "is_covered_risk": true,
//             "default_due_days": 0,
//             "default_payment_day": 0,
//             "language": "st",
//             "currency": "str"
//           }
//         ],
//         "supplier": {
//           "id": "string",
//           "trade_name": "string",
//           "supplier_name": "string",
//           "url": "https://example.com/",
//           "photo_url": "https://example.com/",
//           "tax_code": "string",
//           "tax_code_type": "string",
//           "address_line_1": "string",
//           "address_line_2": "string",
//           "postal_code": "string",
//           "city": "string",
//           "state_province": "string",
//           "country": "st",
//           "notes": "string",
//           "tags": [
//             {
//               "id": "string",
//               "name": "string",
//               "type": "items",
//               "color": "string",
//               "icon": "string"
//             }
//           ],
//           "created_at": "2025-12-15T14:04:26.267Z",
//           "email": "string",
//           "phone": "string",
//           "sections": [
//             {
//               "id": "string",
//               "title": "string",
//               "description": "string",
//               "table_name": "Clients",
//               "handler": "string",
//               "fields": [
//                 {
//                   "id": "string",
//                   "table_name": "Items",
//                   "data_type": "text",
//                   "enum_types": [
//                     "string"
//                   ],
//                   "default_value": "string",
//                   "name": "string",
//                   "description": "string",
//                   "is_nullable": true,
//                   "is_unique": true,
//                   "is_multiple_values": true,
//                   "is_shown_by_default": true,
//                   "value": "string"
//                 }
//               ]
//             }
//           ],
//           "risk": 0,
//           "is_covered_risk": true,
//           "default_due_days": 0,
//           "default_payment_day": 0,
//           "language": "st",
//           "currency": "str"
//         },
//         "taxes": [
//           {
//             "id": "string",
//             "type": "string",
//             "amount": 0,
//             "country": "st"
//           }
//         ],
//         "supplier_barcode": "string",
//         "pricing_mode": "margin_fixed",
//         "rate_id": "string",
//         "rate_name": "string",
//         "supplier_discount": 0,
//         "supplier_pvp": 0,
//         "item_hierarchy": {
//           "id": "string",
//           "parent": {
//             "id": "string",
//             "name": "string"
//           },
//           "name": "string",
//           "description": "string",
//           "icon": "string",
//           "color": "string",
//           "type": "string",
//           "margin": 0,
//           "rate_margin": 0,
//           "num_items_hierarchy": 0,
//           "num_items_total": 0
//         }
//       }
//     }
//   ],
//   "next_page_token": "string"
// }
const getOrgRateItems = async (org_id: string, rate_id: string, item_hierarchy_id?: string, query?: string, page_token?: string | null) => {
    const url = new URL(`/orgs/${org_id}/rates/${rate_id}/items`, baseApiUrl);
    if (query) {
        url.searchParams.set("query", query);
    }
    if (page_token) {
        url.searchParams.set("page_token", page_token);
    }
    if (item_hierarchy_id) {
        url.searchParams.set("item_hierarchy_id", item_hierarchy_id);
    }
    const response = await laiaFetch(url, { method: "GET" });
    return response;
};

//PATCH /orgs/{org_id}/rates/{rate_id}/items-hierarchies/{item_hierarchy_id}/items-prices
// REQUEST BODY:
// {
//     "prices": [
//       {
//         "price_quantity": 0,
//         "price_currency": "string",
//         "margin": 0,
//         "billing_type": "one-off",
//         "billing_period": "daily",
//         "price_model": "flat-rate",
//         "tax_included": true,
//         "warranty_period": 0,
//         "warranty_unit": "days",
//         "notes": "string",
//         "item_id": "string",
//         "pricing_mode": "margin_fixed"
//       }
//     ]
//   }
const patchOrgRateItemsHierarchiesItemsPrices = async (org_id: string, rate_id: string, item_hierarchy_id: string, data: any) => {
    const url = new URL(`/orgs/${org_id}/rates/${rate_id}/items-hierarchies/${item_hierarchy_id}/items-prices`, baseApiUrl);
    const response = await laiaFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response;
};

export { getOrgRates, postOrgRate, getOrgRate, deleteOrgRate, patchOrgRate, patchOrgRateItemsHierarchiesMargins, getOrgRateItems, patchOrgRateItemsHierarchiesItemsPrices };
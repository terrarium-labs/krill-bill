import { StockRotation } from "@/types/general/stock-rotation";

export interface StockRotationOption {
    code: StockRotation;
    name: string;
    description: string;
}

/**
 * Stock rotation methods for inventory management
 * 
 * FIFO - First In, First Out: Oldest inventory sold first
 * LIFO - Last In, First Out: Newest inventory sold first
 * FEFO - First Expired, First Out: Items closest to expiration sold first
 * LEFO - Last Expired, First Out: Items furthest from expiration sold first
 * HIFO - Highest In, First Out: Highest cost items sold first
 * LOFO - Lowest In, First Out: Lowest cost items sold first
 */
export const STOCK_ROTATION_OPTIONS: StockRotationOption[] = [
    {
        code: "fifo",
        name: "FIFO",
        description: "First In, First Out",
    },
    {
        code: "lifo",
        name: "LIFO",
        description: "Last In, First Out",
    },
    {
        code: "fefo",
        name: "FEFO",
        description: "First Expired, First Out",
    },
    {
        code: "lefo",
        name: "LEFO",
        description: "Last Expired, First Out",
    },
    {
        code: "hifo",
        name: "HIFO",
        description: "Highest In, First Out",
    },
    {
        code: "lofo",
        name: "LOFO",
        description: "Lowest In, First Out",
    },
];

/**
 * Get stock rotation option by code
 */
export const getStockRotationByCode = (code: StockRotation): StockRotationOption | undefined => {
    return STOCK_ROTATION_OPTIONS.find(option => option.code === code);
};

/**
 * Get all stock rotation codes
 */
export const getStockRotationCodes = (): StockRotation[] => {
    return STOCK_ROTATION_OPTIONS.map(option => option.code);
};

export default STOCK_ROTATION_OPTIONS;

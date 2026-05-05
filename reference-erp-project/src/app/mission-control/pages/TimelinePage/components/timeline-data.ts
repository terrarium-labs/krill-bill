import { addDays, format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "completed" | "failed" | "in-progress" | "todo";

export interface ScheduleBlock {
    type: "commuting" | "work-order";
    startTime: string;
    endTime: string;
    orderRef?: string;
    orderType?: string;
    address?: string;
    status?: OrderStatus;
}

export interface TechnicianOrder {
    ref: string;
    address: string;
    lat: number;
    lng: number;
    type: string;
}

export interface TimelineTechnician {
    id: string;
    name: string;
    avatar: string;
    color: string;
    role: string;
    status: "en-route" | "on-site" | "idle";
    lat: number;
    lng: number;
    currentOrder: TechnicianOrder | null;
    nextOrder: TechnicianOrder | null;
    routeStops: { lat: number; lng: number }[];
    allocatedHours: number;
    totalHours: number;
    schedule: Record<string, ScheduleBlock[]>;
}

// ─── Status styles ────────────────────────────────────────────────────────────

export const ORDER_STATUS_STYLES: Record<OrderStatus, { bg: string; border: string; text: string; label: string }> = {
    completed:     { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-700 dark:text-emerald-400", label: "Completed" },
    failed:        { bg: "bg-red-500/15",     border: "border-red-500/40",     text: "text-red-700 dark:text-red-400",         label: "Failed" },
    "in-progress": { bg: "bg-blue-500/15",    border: "border-blue-500/40",    text: "text-blue-700 dark:text-blue-400",       label: "In Progress" },
    todo:          { bg: "bg-muted",          border: "border-border",         text: "text-muted-foreground",                  label: "To Do" },
};

export const MAP_STATUS_STYLES: Record<TimelineTechnician["status"], { bg: string; ring: string; label: string; dot: string }> = {
    "en-route": { bg: "bg-blue-500", ring: "ring-blue-400/40", label: "En Route", dot: "bg-blue-400" },
    "on-site":  { bg: "bg-emerald-500", ring: "ring-emerald-400/40", label: "On Site", dot: "bg-emerald-400" },
    idle:       { bg: "bg-amber-500", ring: "ring-amber-400/40", label: "Idle", dot: "bg-amber-400" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────

function dateKey(date: Date): string { return format(date, "yyyy-MM-dd"); }

const TODAY = new Date();
const d0 = dateKey(TODAY);
const d1 = dateKey(addDays(TODAY, 1));
const d2 = dateKey(addDays(TODAY, 2));
const d3 = dateKey(addDays(TODAY, 3));
const d4 = dateKey(addDays(TODAY, 4));

const currentHour = TODAY.getHours();

export const MOCK_TECHNICIANS: TimelineTechnician[] = [
    {
        id: "tech-1", name: "Carlos García", role: "Field Tech", avatar: "CG", color: "#3b82f6",
        status: "en-route", lat: 40.4168, lng: -3.7038,
        currentOrder: { ref: "ORD-2841", address: "C/ Gran Vía 28", lat: 40.4203, lng: -3.7059, type: "Installation" },
        nextOrder: { ref: "ORD-2855", address: "C/ Alcalá 50", lat: 40.4189, lng: -3.6923, type: "Repair" },
        routeStops: [{ lat: 40.4168, lng: -3.7038 }, { lat: 40.4203, lng: -3.7059 }, { lat: 40.4189, lng: -3.6923 }],
        allocatedHours: 6, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "07:00", endTime: "07:15" },
                { type: "work-order", startTime: "07:15", endTime: "09:15", orderRef: "ORD-2841", orderType: "Installation", address: "C/ Gran Vía 28", status: "completed" },
                { type: "commuting", startTime: "09:15", endTime: "09:30" },
                { type: "work-order", startTime: "09:30", endTime: "11:30", orderRef: "ORD-2855", orderType: "Repair", address: "C/ Alcalá 50", status: currentHour >= 12 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "13:00", endTime: "13:20" },
                { type: "work-order", startTime: "13:20", endTime: "15:20", orderRef: "ORD-2870", orderType: "Maintenance", address: "C/ Serrano 12", status: currentHour >= 16 ? "completed" : "todo" },
                { type: "commuting", startTime: "15:20", endTime: "15:35" },
                { type: "work-order", startTime: "15:35", endTime: "17:00", orderRef: "ORD-2878", orderType: "Inspection", address: "C/ Velázquez 30", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "08:00", endTime: "08:20" },
                { type: "work-order", startTime: "08:20", endTime: "10:20", orderRef: "ORD-2900", orderType: "Installation", address: "C/ Goya 14", status: "todo" },
                { type: "commuting", startTime: "10:20", endTime: "10:40" },
                { type: "work-order", startTime: "10:40", endTime: "12:40", orderRef: "ORD-2905", orderType: "Repair", address: "C/ Príncipe de Vergara 80", status: "todo" },
                { type: "commuting", startTime: "14:00", endTime: "14:15" },
                { type: "work-order", startTime: "14:15", endTime: "16:15", orderRef: "ORD-2910", orderType: "Maintenance", address: "C/ O'Donnell 12", status: "todo" },
            ],
            [d2]: [
                { type: "commuting", startTime: "07:30", endTime: "07:45" },
                { type: "work-order", startTime: "07:45", endTime: "10:00", orderRef: "ORD-2920", orderType: "Installation", address: "C/ Atocha 55", status: "todo" },
            ],
        },
    },
    {
        id: "tech-2", name: "Ana Martínez", role: "Installer", avatar: "AM", color: "#10b981",
        status: "on-site", lat: 40.4530, lng: -3.6883,
        currentOrder: { ref: "ORD-2839", address: "Av. de América 15", lat: 40.4530, lng: -3.6883, type: "Maintenance" },
        nextOrder: { ref: "ORD-2860", address: "C/ Arturo Soria 120", lat: 40.4520, lng: -3.6380, type: "Inspection" },
        routeStops: [{ lat: 40.4530, lng: -3.6883 }, { lat: 40.4520, lng: -3.6380 }],
        allocatedHours: 7, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "06:45", endTime: "07:00" },
                { type: "work-order", startTime: "07:00", endTime: "09:00", orderRef: "ORD-2839", orderType: "Maintenance", address: "Av. de América 15", status: "completed" },
                { type: "commuting", startTime: "09:00", endTime: "09:20" },
                { type: "work-order", startTime: "09:20", endTime: "11:20", orderRef: "ORD-2860", orderType: "Inspection", address: "C/ Arturo Soria 120", status: currentHour >= 12 ? "failed" : "in-progress" },
                { type: "commuting", startTime: "11:20", endTime: "11:40" },
                { type: "work-order", startTime: "11:40", endTime: "13:40", orderRef: "ORD-2863", orderType: "Installation", address: "C/ López de Hoyos 33", status: currentHour >= 14 ? "completed" : "todo" },
                { type: "commuting", startTime: "14:30", endTime: "14:50" },
                { type: "work-order", startTime: "14:50", endTime: "16:50", orderRef: "ORD-2872", orderType: "Repair", address: "C/ María de Molina 22", status: currentHour >= 15 && currentHour < 17 ? "in-progress" : currentHour >= 17 ? "completed" : "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "07:30", endTime: "07:45" },
                { type: "work-order", startTime: "07:45", endTime: "09:45", orderRef: "ORD-2901", orderType: "Installation", address: "C/ Castellana 85", status: "todo" },
                { type: "commuting", startTime: "09:45", endTime: "10:05" },
                { type: "work-order", startTime: "10:05", endTime: "12:05", orderRef: "ORD-2906", orderType: "Maintenance", address: "C/ Orense 20", status: "todo" },
            ],
            [d2]: [
                { type: "commuting", startTime: "08:00", endTime: "08:15" },
                { type: "work-order", startTime: "08:15", endTime: "10:15", orderRef: "ORD-2880", orderType: "Installation", address: "C/ Velázquez 5", status: "todo" },
                { type: "commuting", startTime: "10:15", endTime: "10:30" },
                { type: "work-order", startTime: "10:30", endTime: "12:30", orderRef: "ORD-2885", orderType: "Inspection", address: "C/ Serrano 50", status: "todo" },
            ],
            [d3]: [
                { type: "commuting", startTime: "09:00", endTime: "09:15" },
                { type: "work-order", startTime: "09:15", endTime: "11:15", orderRef: "ORD-2930", orderType: "Repair", address: "C/ Preciados 10", status: "todo" },
            ],
        },
    },
    {
        id: "tech-3", name: "Miguel López", role: "Repair Tech", avatar: "ML", color: "#f59e0b",
        status: "en-route", lat: 40.3890, lng: -3.7000,
        currentOrder: { ref: "ORD-2845", address: "Paseo de las Delicias 61", lat: 40.3950, lng: -3.6930, type: "Repair" },
        nextOrder: null,
        routeStops: [{ lat: 40.3890, lng: -3.7000 }, { lat: 40.3950, lng: -3.6930 }],
        allocatedHours: 5, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "07:30", endTime: "07:45" },
                { type: "work-order", startTime: "07:45", endTime: "09:45", orderRef: "ORD-2845", orderType: "Repair", address: "Paseo de las Delicias 61", status: "completed" },
                { type: "commuting", startTime: "09:45", endTime: "10:05" },
                { type: "work-order", startTime: "10:05", endTime: "12:35", orderRef: "ORD-2871", orderType: "Installation", address: "C/ Embajadores 40", status: currentHour >= 13 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "13:30", endTime: "13:50" },
                { type: "work-order", startTime: "13:50", endTime: "15:50", orderRef: "ORD-2876", orderType: "Repair", address: "C/ Toledo 45", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "08:00", endTime: "08:15" },
                { type: "work-order", startTime: "08:15", endTime: "10:15", orderRef: "ORD-2902", orderType: "Repair", address: "C/ Segovia 12", status: "todo" },
                { type: "commuting", startTime: "10:15", endTime: "10:30" },
                { type: "work-order", startTime: "10:30", endTime: "12:30", orderRef: "ORD-2907", orderType: "Maintenance", address: "C/ Bailén 8", status: "todo" },
                { type: "commuting", startTime: "14:00", endTime: "14:20" },
                { type: "work-order", startTime: "14:20", endTime: "16:20", orderRef: "ORD-2912", orderType: "Repair", address: "C/ Mayor 44", status: "todo" },
            ],
            [d4]: [
                { type: "commuting", startTime: "07:00", endTime: "07:20" },
                { type: "work-order", startTime: "07:20", endTime: "09:20", orderRef: "ORD-2940", orderType: "Installation", address: "Av. Complutense 5", status: "todo" },
            ],
        },
    },
    {
        id: "tech-4", name: "Laura Sánchez", role: "Installer", avatar: "LS", color: "#8b5cf6",
        status: "idle", lat: 40.4400, lng: -3.7200,
        currentOrder: null,
        nextOrder: { ref: "ORD-2862", address: "C/ Princesa 25", lat: 40.4310, lng: -3.7170, type: "Installation" },
        routeStops: [{ lat: 40.4400, lng: -3.7200 }, { lat: 40.4310, lng: -3.7170 }],
        allocatedHours: 4, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "08:50", endTime: "09:05" },
                { type: "work-order", startTime: "09:05", endTime: "11:05", orderRef: "ORD-2862", orderType: "Installation", address: "C/ Princesa 25", status: currentHour >= 11 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "11:05", endTime: "11:25" },
                { type: "work-order", startTime: "11:25", endTime: "13:25", orderRef: "ORD-2866", orderType: "Inspection", address: "C/ Alberto Aguilera 15", status: currentHour >= 14 ? "failed" : "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "08:00", endTime: "08:20" },
                { type: "work-order", startTime: "08:20", endTime: "10:20", orderRef: "ORD-2890", orderType: "Repair", address: "C/ Fuencarral 88", status: "todo" },
                { type: "commuting", startTime: "10:20", endTime: "10:35" },
                { type: "work-order", startTime: "10:35", endTime: "12:35", orderRef: "ORD-2891", orderType: "Maintenance", address: "C/ Bravo Murillo 73", status: "todo" },
                { type: "commuting", startTime: "14:00", endTime: "14:15" },
                { type: "work-order", startTime: "14:15", endTime: "16:15", orderRef: "ORD-2895", orderType: "Installation", address: "C/ San Bernardo 44", status: "todo" },
            ],
            [d3]: [
                { type: "commuting", startTime: "09:00", endTime: "09:10" },
                { type: "work-order", startTime: "09:10", endTime: "11:10", orderRef: "ORD-2935", orderType: "Installation", address: "C/ Montera 30", status: "todo" },
                { type: "commuting", startTime: "11:10", endTime: "11:30" },
                { type: "work-order", startTime: "11:30", endTime: "13:30", orderRef: "ORD-2936", orderType: "Repair", address: "C/ Hortaleza 60", status: "todo" },
            ],
        },
    },
    {
        id: "tech-5", name: "Javier Ruiz", role: "Technician", avatar: "JR", color: "#ef4444",
        status: "en-route", lat: 40.4260, lng: -3.7500,
        currentOrder: { ref: "ORD-2850", address: "C/ Cea Bermúdez 46", lat: 40.4380, lng: -3.7100, type: "Maintenance" },
        nextOrder: { ref: "ORD-2867", address: "C/ Bravo Murillo 73", lat: 40.4470, lng: -3.7040, type: "Repair" },
        routeStops: [{ lat: 40.4260, lng: -3.7500 }, { lat: 40.4380, lng: -3.7100 }, { lat: 40.4470, lng: -3.7040 }],
        allocatedHours: 7, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "06:30", endTime: "06:50" },
                { type: "work-order", startTime: "06:50", endTime: "08:50", orderRef: "ORD-2850", orderType: "Maintenance", address: "C/ Cea Bermúdez 46", status: "completed" },
                { type: "commuting", startTime: "08:50", endTime: "09:10" },
                { type: "work-order", startTime: "09:10", endTime: "11:10", orderRef: "ORD-2867", orderType: "Repair", address: "C/ Bravo Murillo 73", status: currentHour >= 11 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "11:10", endTime: "11:30" },
                { type: "work-order", startTime: "11:30", endTime: "13:30", orderRef: "ORD-2873", orderType: "Installation", address: "C/ Fuencarral 88", status: currentHour >= 14 ? "completed" : "todo" },
                { type: "commuting", startTime: "14:30", endTime: "14:45" },
                { type: "work-order", startTime: "14:45", endTime: "16:45", orderRef: "ORD-2877", orderType: "Maintenance", address: "C/ Ríos Rosas 22", status: currentHour >= 15 && currentHour < 17 ? "in-progress" : currentHour >= 17 ? "completed" : "todo" },
                { type: "commuting", startTime: "16:45", endTime: "17:00" },
                { type: "work-order", startTime: "17:00", endTime: "18:30", orderRef: "ORD-2879", orderType: "Repair", address: "C/ Santa Engracia 10", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "07:00", endTime: "07:15" },
                { type: "work-order", startTime: "07:15", endTime: "09:15", orderRef: "ORD-2903", orderType: "Maintenance", address: "C/ Ponzano 40", status: "todo" },
                { type: "commuting", startTime: "09:15", endTime: "09:30" },
                { type: "work-order", startTime: "09:30", endTime: "11:30", orderRef: "ORD-2908", orderType: "Repair", address: "C/ Eloy Gonzalo 25", status: "todo" },
            ],
            [d2]: [
                { type: "commuting", startTime: "08:00", endTime: "08:20" },
                { type: "work-order", startTime: "08:20", endTime: "10:20", orderRef: "ORD-2921", orderType: "Installation", address: "C/ Luchana 15", status: "todo" },
                { type: "commuting", startTime: "10:20", endTime: "10:40" },
                { type: "work-order", startTime: "10:40", endTime: "12:40", orderRef: "ORD-2922", orderType: "Maintenance", address: "C/ Cardenal Cisneros 8", status: "todo" },
                { type: "commuting", startTime: "14:00", endTime: "14:20" },
                { type: "work-order", startTime: "14:20", endTime: "16:20", orderRef: "ORD-2923", orderType: "Repair", address: "C/ Hartzenbusch 3", status: "todo" },
            ],
        },
    },
    {
        id: "tech-6", name: "Elena Fernández", role: "Senior Tech", avatar: "EF", color: "#06b6d4",
        status: "on-site", lat: 40.4070, lng: -3.6750,
        currentOrder: { ref: "ORD-2881", address: "C/ Alcalá 200", lat: 40.4110, lng: -3.6700, type: "Repair" },
        nextOrder: { ref: "ORD-2882", address: "C/ Narváez 15", lat: 40.4080, lng: -3.6790, type: "Maintenance" },
        routeStops: [{ lat: 40.4070, lng: -3.6750 }, { lat: 40.4110, lng: -3.6700 }, { lat: 40.4080, lng: -3.6790 }],
        allocatedHours: 6, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "08:00", endTime: "08:15" },
                { type: "work-order", startTime: "08:15", endTime: "10:15", orderRef: "ORD-2880", orderType: "Installation", address: "Av. de la Albufera 70", status: "completed" },
                { type: "commuting", startTime: "10:15", endTime: "10:35" },
                { type: "work-order", startTime: "10:35", endTime: "12:35", orderRef: "ORD-2881", orderType: "Repair", address: "C/ Alcalá 200", status: currentHour >= 13 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "14:00", endTime: "14:20" },
                { type: "work-order", startTime: "14:20", endTime: "16:20", orderRef: "ORD-2882", orderType: "Maintenance", address: "C/ Narváez 15", status: currentHour >= 14 && currentHour < 17 ? "in-progress" : currentHour >= 17 ? "completed" : "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "07:00", endTime: "07:20" },
                { type: "work-order", startTime: "07:20", endTime: "09:20", orderRef: "ORD-2915", orderType: "Installation", address: "C/ Ibiza 35", status: "todo" },
                { type: "commuting", startTime: "09:20", endTime: "09:40" },
                { type: "work-order", startTime: "09:40", endTime: "11:40", orderRef: "ORD-2916", orderType: "Repair", address: "C/ Retiro 5", status: "todo" },
            ],
            [d3]: [
                { type: "commuting", startTime: "08:30", endTime: "08:45" },
                { type: "work-order", startTime: "08:45", endTime: "10:45", orderRef: "ORD-2937", orderType: "Maintenance", address: "C/ Conde de Casal 1", status: "todo" },
                { type: "commuting", startTime: "10:45", endTime: "11:00" },
                { type: "work-order", startTime: "11:00", endTime: "13:00", orderRef: "ORD-2938", orderType: "Installation", address: "C/ Doctor Esquerdo 40", status: "todo" },
            ],
        },
    },
    {
        id: "tech-7", name: "Pablo Moreno", role: "Installer", avatar: "PM", color: "#d946ef",
        status: "idle", lat: 40.4120, lng: -3.7080,
        currentOrder: null,
        nextOrder: { ref: "ORD-2886", address: "C/ Lavapiés 15", lat: 40.4090, lng: -3.7020, type: "Repair" },
        routeStops: [{ lat: 40.4120, lng: -3.7080 }, { lat: 40.4090, lng: -3.7020 }],
        allocatedHours: 5, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "09:00", endTime: "09:15" },
                { type: "work-order", startTime: "09:15", endTime: "11:15", orderRef: "ORD-2883", orderType: "Installation", address: "C/ Atocha 80", status: currentHour >= 11 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "11:15", endTime: "11:30" },
                { type: "work-order", startTime: "11:30", endTime: "13:30", orderRef: "ORD-2884", orderType: "Inspection", address: "C/ Huertas 20", status: currentHour >= 14 ? "completed" : "todo" },
                { type: "commuting", startTime: "15:00", endTime: "15:20" },
                { type: "work-order", startTime: "15:20", endTime: "17:20", orderRef: "ORD-2886", orderType: "Repair", address: "C/ Lavapiés 15", status: currentHour >= 15 && currentHour < 17 ? "in-progress" : currentHour >= 17 ? "completed" : "todo" },
            ],
            [d2]: [
                { type: "commuting", startTime: "07:30", endTime: "07:50" },
                { type: "work-order", startTime: "07:50", endTime: "09:50", orderRef: "ORD-2925", orderType: "Installation", address: "C/ Embajadores 100", status: "todo" },
                { type: "commuting", startTime: "09:50", endTime: "10:10" },
                { type: "work-order", startTime: "10:10", endTime: "12:10", orderRef: "ORD-2926", orderType: "Maintenance", address: "Ronda de Valencia 8", status: "todo" },
            ],
            [d4]: [
                { type: "commuting", startTime: "08:00", endTime: "08:15" },
                { type: "work-order", startTime: "08:15", endTime: "10:15", orderRef: "ORD-2941", orderType: "Installation", address: "C/ Mesón de Paredes 20", status: "todo" },
            ],
        },
    },
    {
        id: "tech-8", name: "Lucía Torres", role: "Field Tech", avatar: "LT", color: "#f97316",
        status: "en-route", lat: 40.4450, lng: -3.7150,
        currentOrder: { ref: "ORD-2889", address: "C/ Islas Filipinas 8", lat: 40.4400, lng: -3.7100, type: "Installation" },
        nextOrder: { ref: "ORD-2892", address: "C/ Gaztambide 30", lat: 40.4360, lng: -3.7180, type: "Maintenance" },
        routeStops: [{ lat: 40.4450, lng: -3.7150 }, { lat: 40.4400, lng: -3.7100 }, { lat: 40.4360, lng: -3.7180 }],
        allocatedHours: 8, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "06:00", endTime: "06:20" },
                { type: "work-order", startTime: "06:20", endTime: "08:20", orderRef: "ORD-2887", orderType: "Maintenance", address: "C/ Bravo Murillo 200", status: "completed" },
                { type: "commuting", startTime: "08:20", endTime: "08:35" },
                { type: "work-order", startTime: "08:35", endTime: "10:35", orderRef: "ORD-2888", orderType: "Repair", address: "C/ Francos Rodríguez 12", status: "completed" },
                { type: "commuting", startTime: "10:35", endTime: "10:55" },
                { type: "work-order", startTime: "10:55", endTime: "12:55", orderRef: "ORD-2889", orderType: "Installation", address: "C/ Islas Filipinas 8", status: currentHour >= 13 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "14:00", endTime: "14:15" },
                { type: "work-order", startTime: "14:15", endTime: "16:15", orderRef: "ORD-2892", orderType: "Maintenance", address: "C/ Gaztambide 30", status: currentHour >= 14 && currentHour < 16 ? "in-progress" : currentHour >= 16 ? "completed" : "todo" },
                { type: "commuting", startTime: "16:15", endTime: "16:30" },
                { type: "work-order", startTime: "16:30", endTime: "18:00", orderRef: "ORD-2893", orderType: "Inspection", address: "C/ Meléndez Valdés 5", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "06:30", endTime: "06:50" },
                { type: "work-order", startTime: "06:50", endTime: "08:50", orderRef: "ORD-2917", orderType: "Maintenance", address: "C/ Blasco de Garay 40", status: "todo" },
                { type: "commuting", startTime: "08:50", endTime: "09:10" },
                { type: "work-order", startTime: "09:10", endTime: "11:10", orderRef: "ORD-2918", orderType: "Repair", address: "C/ Vallehermoso 15", status: "todo" },
                { type: "commuting", startTime: "11:10", endTime: "11:30" },
                { type: "work-order", startTime: "11:30", endTime: "13:30", orderRef: "ORD-2919", orderType: "Installation", address: "C/ Guzmán el Bueno 50", status: "todo" },
            ],
        },
    },
    {
        id: "tech-9", name: "Diego Herrera", role: "Senior Tech", avatar: "DH", color: "#0ea5e9",
        status: "on-site", lat: 40.4320, lng: -3.6800,
        currentOrder: { ref: "ORD-2950", address: "C/ Jorge Juan 40", lat: 40.4280, lng: -3.6830, type: "Repair" },
        nextOrder: { ref: "ORD-2951", address: "C/ Villanueva 12", lat: 40.4250, lng: -3.6870, type: "Maintenance" },
        routeStops: [{ lat: 40.4320, lng: -3.6800 }, { lat: 40.4280, lng: -3.6830 }, { lat: 40.4250, lng: -3.6870 }],
        allocatedHours: 7, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "07:00", endTime: "07:20" },
                { type: "work-order", startTime: "07:20", endTime: "09:20", orderRef: "ORD-2948", orderType: "Maintenance", address: "C/ Goya 30", status: "completed" },
                { type: "commuting", startTime: "09:20", endTime: "09:40" },
                { type: "work-order", startTime: "09:40", endTime: "11:40", orderRef: "ORD-2950", orderType: "Repair", address: "C/ Jorge Juan 40", status: currentHour >= 12 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "13:00", endTime: "13:15" },
                { type: "work-order", startTime: "13:15", endTime: "15:15", orderRef: "ORD-2951", orderType: "Maintenance", address: "C/ Villanueva 12", status: currentHour >= 16 ? "completed" : "todo" },
                { type: "commuting", startTime: "15:15", endTime: "15:30" },
                { type: "work-order", startTime: "15:30", endTime: "17:30", orderRef: "ORD-2952", orderType: "Installation", address: "C/ Claudio Coello 55", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "08:00", endTime: "08:15" },
                { type: "work-order", startTime: "08:15", endTime: "10:15", orderRef: "ORD-2960", orderType: "Repair", address: "C/ Lagasca 20", status: "todo" },
                { type: "commuting", startTime: "10:15", endTime: "10:30" },
                { type: "work-order", startTime: "10:30", endTime: "12:30", orderRef: "ORD-2961", orderType: "Installation", address: "C/ Ayala 15", status: "todo" },
            ],
            [d3]: [
                { type: "commuting", startTime: "07:30", endTime: "07:50" },
                { type: "work-order", startTime: "07:50", endTime: "10:00", orderRef: "ORD-2970", orderType: "Maintenance", address: "C/ Padilla 30", status: "todo" },
            ],
        },
    },
    {
        id: "tech-10", name: "Marta Díaz", role: "Installer", avatar: "MD", color: "#14b8a6",
        status: "en-route", lat: 40.4600, lng: -3.7050,
        currentOrder: { ref: "ORD-2953", address: "C/ Sor Ángela de la Cruz 8", lat: 40.4650, lng: -3.7000, type: "Installation" },
        nextOrder: null,
        routeStops: [{ lat: 40.4600, lng: -3.7050 }, { lat: 40.4650, lng: -3.7000 }],
        allocatedHours: 5, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "08:00", endTime: "08:20" },
                { type: "work-order", startTime: "08:20", endTime: "10:20", orderRef: "ORD-2953", orderType: "Installation", address: "C/ Sor Ángela de la Cruz 8", status: currentHour >= 11 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "10:20", endTime: "10:40" },
                { type: "work-order", startTime: "10:40", endTime: "12:40", orderRef: "ORD-2954", orderType: "Repair", address: "Av. de Brasil 15", status: currentHour >= 13 ? "completed" : "todo" },
                { type: "commuting", startTime: "14:00", endTime: "14:20" },
                { type: "work-order", startTime: "14:20", endTime: "16:20", orderRef: "ORD-2955", orderType: "Inspection", address: "C/ Capitán Haya 30", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "07:00", endTime: "07:20" },
                { type: "work-order", startTime: "07:20", endTime: "09:20", orderRef: "ORD-2962", orderType: "Installation", address: "Paseo de la Habana 50", status: "todo" },
                { type: "commuting", startTime: "09:20", endTime: "09:40" },
                { type: "work-order", startTime: "09:40", endTime: "11:40", orderRef: "ORD-2963", orderType: "Maintenance", address: "C/ Costa Rica 10", status: "todo" },
            ],
        },
    },
    {
        id: "tech-11", name: "Raúl Jiménez", role: "Repair Tech", avatar: "RJ", color: "#a855f7",
        status: "idle", lat: 40.3980, lng: -3.7200,
        currentOrder: null,
        nextOrder: { ref: "ORD-2956", address: "C/ Arganzuela 15", lat: 40.3950, lng: -3.7150, type: "Repair" },
        routeStops: [{ lat: 40.3980, lng: -3.7200 }, { lat: 40.3950, lng: -3.7150 }],
        allocatedHours: 4, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "09:00", endTime: "09:15" },
                { type: "work-order", startTime: "09:15", endTime: "11:15", orderRef: "ORD-2956", orderType: "Repair", address: "C/ Arganzuela 15", status: currentHour >= 12 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "11:15", endTime: "11:35" },
                { type: "work-order", startTime: "11:35", endTime: "13:35", orderRef: "ORD-2957", orderType: "Installation", address: "Paseo de las Acacias 20", status: currentHour >= 14 ? "completed" : "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "08:00", endTime: "08:20" },
                { type: "work-order", startTime: "08:20", endTime: "10:20", orderRef: "ORD-2964", orderType: "Repair", address: "C/ Antonio López 60", status: "todo" },
                { type: "commuting", startTime: "10:20", endTime: "10:40" },
                { type: "work-order", startTime: "10:40", endTime: "12:40", orderRef: "ORD-2965", orderType: "Maintenance", address: "C/ Palos de la Frontera 25", status: "todo" },
                { type: "commuting", startTime: "14:00", endTime: "14:15" },
                { type: "work-order", startTime: "14:15", endTime: "16:15", orderRef: "ORD-2966", orderType: "Installation", address: "C/ Méndez Álvaro 40", status: "todo" },
            ],
            [d2]: [
                { type: "commuting", startTime: "07:30", endTime: "07:45" },
                { type: "work-order", startTime: "07:45", endTime: "09:45", orderRef: "ORD-2971", orderType: "Repair", address: "Ronda de Segovia 15", status: "todo" },
            ],
        },
    },
    {
        id: "tech-12", name: "Sofía Navarro", role: "Field Tech", avatar: "SN", color: "#ec4899",
        status: "en-route", lat: 40.4350, lng: -3.6600,
        currentOrder: { ref: "ORD-2958", address: "C/ O'Donnell 45", lat: 40.4300, lng: -3.6650, type: "Maintenance" },
        nextOrder: { ref: "ORD-2959", address: "C/ Ibiza 22", lat: 40.4280, lng: -3.6700, type: "Repair" },
        routeStops: [{ lat: 40.4350, lng: -3.6600 }, { lat: 40.4300, lng: -3.6650 }, { lat: 40.4280, lng: -3.6700 }],
        allocatedHours: 6, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "06:45", endTime: "07:00" },
                { type: "work-order", startTime: "07:00", endTime: "09:00", orderRef: "ORD-2958", orderType: "Maintenance", address: "C/ O'Donnell 45", status: "completed" },
                { type: "commuting", startTime: "09:00", endTime: "09:15" },
                { type: "work-order", startTime: "09:15", endTime: "11:15", orderRef: "ORD-2959", orderType: "Repair", address: "C/ Ibiza 22", status: currentHour >= 12 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "13:00", endTime: "13:20" },
                { type: "work-order", startTime: "13:20", endTime: "15:20", orderRef: "ORD-2967", orderType: "Installation", address: "C/ Narváez 50", status: currentHour >= 16 ? "completed" : "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "07:30", endTime: "07:50" },
                { type: "work-order", startTime: "07:50", endTime: "09:50", orderRef: "ORD-2972", orderType: "Repair", address: "C/ Conde de Peñalver 30", status: "todo" },
                { type: "commuting", startTime: "09:50", endTime: "10:10" },
                { type: "work-order", startTime: "10:10", endTime: "12:10", orderRef: "ORD-2973", orderType: "Maintenance", address: "C/ Lista 40", status: "todo" },
            ],
            [d2]: [
                { type: "commuting", startTime: "08:00", endTime: "08:15" },
                { type: "work-order", startTime: "08:15", endTime: "10:15", orderRef: "ORD-2980", orderType: "Installation", address: "C/ Doctor Esquerdo 80", status: "todo" },
                { type: "commuting", startTime: "10:15", endTime: "10:30" },
                { type: "work-order", startTime: "10:30", endTime: "12:30", orderRef: "ORD-2981", orderType: "Repair", address: "C/ Menéndez Pelayo 15", status: "todo" },
            ],
        },
    },
    {
        id: "tech-13", name: "Andrés Romero", role: "Technician", avatar: "AR", color: "#84cc16",
        status: "on-site", lat: 40.4500, lng: -3.7300,
        currentOrder: { ref: "ORD-2974", address: "C/ Princesa 70", lat: 40.4470, lng: -3.7250, type: "Installation" },
        nextOrder: { ref: "ORD-2975", address: "C/ Marqués de Urquijo 10", lat: 40.4440, lng: -3.7200, type: "Repair" },
        routeStops: [{ lat: 40.4500, lng: -3.7300 }, { lat: 40.4470, lng: -3.7250 }, { lat: 40.4440, lng: -3.7200 }],
        allocatedHours: 7, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "07:00", endTime: "07:15" },
                { type: "work-order", startTime: "07:15", endTime: "09:15", orderRef: "ORD-2974", orderType: "Installation", address: "C/ Princesa 70", status: "completed" },
                { type: "commuting", startTime: "09:15", endTime: "09:30" },
                { type: "work-order", startTime: "09:30", endTime: "11:30", orderRef: "ORD-2975", orderType: "Repair", address: "C/ Marqués de Urquijo 10", status: currentHour >= 12 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "13:00", endTime: "13:15" },
                { type: "work-order", startTime: "13:15", endTime: "15:15", orderRef: "ORD-2976", orderType: "Maintenance", address: "C/ Ferraz 25", status: currentHour >= 16 ? "completed" : "todo" },
                { type: "commuting", startTime: "15:15", endTime: "15:30" },
                { type: "work-order", startTime: "15:30", endTime: "17:30", orderRef: "ORD-2977", orderType: "Inspection", address: "Paseo de Rosales 15", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "08:00", endTime: "08:15" },
                { type: "work-order", startTime: "08:15", endTime: "10:15", orderRef: "ORD-2982", orderType: "Repair", address: "C/ Quintana 20", status: "todo" },
            ],
            [d4]: [
                { type: "commuting", startTime: "07:00", endTime: "07:15" },
                { type: "work-order", startTime: "07:15", endTime: "09:15", orderRef: "ORD-2990", orderType: "Installation", address: "C/ Hilarión Eslava 30", status: "todo" },
                { type: "commuting", startTime: "09:15", endTime: "09:30" },
                { type: "work-order", startTime: "09:30", endTime: "11:30", orderRef: "ORD-2991", orderType: "Maintenance", address: "C/ Gaztambide 60", status: "todo" },
            ],
        },
    },
    {
        id: "tech-14", name: "Carmen Vega", role: "Installer", avatar: "CV", color: "#e11d48",
        status: "en-route", lat: 40.4100, lng: -3.7400,
        currentOrder: { ref: "ORD-2978", address: "C/ Segovia 30", lat: 40.4130, lng: -3.7350, type: "Installation" },
        nextOrder: null,
        routeStops: [{ lat: 40.4100, lng: -3.7400 }, { lat: 40.4130, lng: -3.7350 }],
        allocatedHours: 3, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "09:30", endTime: "09:50" },
                { type: "work-order", startTime: "09:50", endTime: "11:50", orderRef: "ORD-2978", orderType: "Installation", address: "C/ Segovia 30", status: currentHour >= 12 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "11:50", endTime: "12:10" },
                { type: "work-order", startTime: "12:10", endTime: "14:10", orderRef: "ORD-2979", orderType: "Repair", address: "C/ Bailén 25", status: currentHour >= 15 ? "completed" : "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "07:00", endTime: "07:20" },
                { type: "work-order", startTime: "07:20", endTime: "09:20", orderRef: "ORD-2983", orderType: "Installation", address: "C/ Mayor 20", status: "todo" },
                { type: "commuting", startTime: "09:20", endTime: "09:35" },
                { type: "work-order", startTime: "09:35", endTime: "11:35", orderRef: "ORD-2984", orderType: "Maintenance", address: "Plaza de Oriente 5", status: "todo" },
                { type: "commuting", startTime: "13:00", endTime: "13:15" },
                { type: "work-order", startTime: "13:15", endTime: "15:15", orderRef: "ORD-2985", orderType: "Repair", address: "C/ Arenal 10", status: "todo" },
            ],
        },
    },
    {
        id: "tech-15", name: "Fernando Castro", role: "Senior Tech", avatar: "FC", color: "#0d9488",
        status: "on-site", lat: 40.4230, lng: -3.6500,
        currentOrder: { ref: "ORD-2986", address: "C/ Alcalá 150", lat: 40.4250, lng: -3.6550, type: "Maintenance" },
        nextOrder: { ref: "ORD-2987", address: "C/ Cartagena 80", lat: 40.4350, lng: -3.6600, type: "Inspection" },
        routeStops: [{ lat: 40.4230, lng: -3.6500 }, { lat: 40.4250, lng: -3.6550 }, { lat: 40.4350, lng: -3.6600 }],
        allocatedHours: 8, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "06:30", endTime: "06:45" },
                { type: "work-order", startTime: "06:45", endTime: "08:45", orderRef: "ORD-2986", orderType: "Maintenance", address: "C/ Alcalá 150", status: "completed" },
                { type: "commuting", startTime: "08:45", endTime: "09:00" },
                { type: "work-order", startTime: "09:00", endTime: "11:00", orderRef: "ORD-2987", orderType: "Inspection", address: "C/ Cartagena 80", status: currentHour >= 11 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "11:00", endTime: "11:20" },
                { type: "work-order", startTime: "11:20", endTime: "13:20", orderRef: "ORD-2988", orderType: "Installation", address: "C/ López de Hoyos 100", status: currentHour >= 14 ? "completed" : "todo" },
                { type: "commuting", startTime: "14:00", endTime: "14:15" },
                { type: "work-order", startTime: "14:15", endTime: "16:15", orderRef: "ORD-2989", orderType: "Repair", address: "C/ María de Molina 50", status: currentHour >= 14 && currentHour < 17 ? "in-progress" : currentHour >= 17 ? "completed" : "todo" },
                { type: "commuting", startTime: "16:15", endTime: "16:30" },
                { type: "work-order", startTime: "16:30", endTime: "18:00", orderRef: "ORD-2992", orderType: "Maintenance", address: "C/ Príncipe de Vergara 120", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "07:00", endTime: "07:15" },
                { type: "work-order", startTime: "07:15", endTime: "09:15", orderRef: "ORD-2993", orderType: "Installation", address: "C/ Velázquez 100", status: "todo" },
                { type: "commuting", startTime: "09:15", endTime: "09:30" },
                { type: "work-order", startTime: "09:30", endTime: "11:30", orderRef: "ORD-2994", orderType: "Repair", address: "C/ Hermosilla 60", status: "todo" },
            ],
            [d2]: [
                { type: "commuting", startTime: "08:00", endTime: "08:20" },
                { type: "work-order", startTime: "08:20", endTime: "10:20", orderRef: "ORD-2995", orderType: "Maintenance", address: "C/ Juan Bravo 30", status: "todo" },
                { type: "commuting", startTime: "10:20", endTime: "10:40" },
                { type: "work-order", startTime: "10:40", endTime: "12:40", orderRef: "ORD-2996", orderType: "Installation", address: "C/ Castelló 40", status: "todo" },
            ],
        },
    },
    {
        id: "tech-16", name: "Isabel Muñoz", role: "Technician", avatar: "IM", color: "#7c3aed",
        status: "idle", lat: 40.3850, lng: -3.6900,
        currentOrder: null,
        nextOrder: { ref: "ORD-3000", address: "C/ Embajadores 180", lat: 40.3900, lng: -3.6950, type: "Repair" },
        routeStops: [{ lat: 40.3850, lng: -3.6900 }, { lat: 40.3900, lng: -3.6950 }],
        allocatedHours: 6, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "07:30", endTime: "07:45" },
                { type: "work-order", startTime: "07:45", endTime: "09:45", orderRef: "ORD-2997", orderType: "Repair", address: "C/ Valencia 20", status: "completed" },
                { type: "commuting", startTime: "09:45", endTime: "10:00" },
                { type: "work-order", startTime: "10:00", endTime: "12:00", orderRef: "ORD-2998", orderType: "Installation", address: "Ronda de Atocha 30", status: currentHour >= 12 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "13:30", endTime: "13:45" },
                { type: "work-order", startTime: "13:45", endTime: "15:45", orderRef: "ORD-2999", orderType: "Maintenance", address: "C/ Santa Isabel 15", status: currentHour >= 16 ? "completed" : "todo" },
                { type: "commuting", startTime: "15:45", endTime: "16:00" },
                { type: "work-order", startTime: "16:00", endTime: "17:30", orderRef: "ORD-3000", orderType: "Repair", address: "C/ Embajadores 180", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "08:00", endTime: "08:20" },
                { type: "work-order", startTime: "08:20", endTime: "10:20", orderRef: "ORD-3001", orderType: "Installation", address: "C/ Lavapiés 40", status: "todo" },
                { type: "commuting", startTime: "10:20", endTime: "10:35" },
                { type: "work-order", startTime: "10:35", endTime: "12:35", orderRef: "ORD-3002", orderType: "Repair", address: "C/ Ave María 20", status: "todo" },
            ],
            [d3]: [
                { type: "commuting", startTime: "07:00", endTime: "07:20" },
                { type: "work-order", startTime: "07:20", endTime: "09:20", orderRef: "ORD-3010", orderType: "Maintenance", address: "Glorieta de Embajadores 5", status: "todo" },
                { type: "commuting", startTime: "09:20", endTime: "09:40" },
                { type: "work-order", startTime: "09:40", endTime: "11:40", orderRef: "ORD-3011", orderType: "Repair", address: "C/ Ribera de Curtidores 10", status: "todo" },
            ],
        },
    },
    {
        id: "tech-17", name: "Roberto Álvarez", role: "Field Tech", avatar: "RA", color: "#059669",
        status: "en-route", lat: 40.4700, lng: -3.6900,
        currentOrder: { ref: "ORD-3003", address: "C/ Arturo Soria 200", lat: 40.4650, lng: -3.6500, type: "Repair" },
        nextOrder: { ref: "ORD-3004", address: "C/ Alcalá 400", lat: 40.4550, lng: -3.6300, type: "Installation" },
        routeStops: [{ lat: 40.4700, lng: -3.6900 }, { lat: 40.4650, lng: -3.6500 }, { lat: 40.4550, lng: -3.6300 }],
        allocatedHours: 5, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "08:00", endTime: "08:30" },
                { type: "work-order", startTime: "08:30", endTime: "10:30", orderRef: "ORD-3003", orderType: "Repair", address: "C/ Arturo Soria 200", status: currentHour >= 11 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "10:30", endTime: "11:00" },
                { type: "work-order", startTime: "11:00", endTime: "13:00", orderRef: "ORD-3004", orderType: "Installation", address: "C/ Alcalá 400", status: currentHour >= 13 ? "completed" : "todo" },
                { type: "commuting", startTime: "14:30", endTime: "14:50" },
                { type: "work-order", startTime: "14:50", endTime: "16:50", orderRef: "ORD-3005", orderType: "Maintenance", address: "C/ López de Hoyos 200", status: "todo" },
            ],
            [d2]: [
                { type: "commuting", startTime: "07:00", endTime: "07:30" },
                { type: "work-order", startTime: "07:30", endTime: "09:30", orderRef: "ORD-3012", orderType: "Repair", address: "C/ Suero de Quiñones 10", status: "todo" },
                { type: "commuting", startTime: "09:30", endTime: "09:50" },
                { type: "work-order", startTime: "09:50", endTime: "11:50", orderRef: "ORD-3013", orderType: "Installation", address: "Av. de América 40", status: "todo" },
            ],
        },
    },
    {
        id: "tech-18", name: "Patricia Blanco", role: "Installer", avatar: "PB", color: "#dc2626",
        status: "on-site", lat: 40.4050, lng: -3.6400,
        currentOrder: { ref: "ORD-3006", address: "C/ Ibiza 50", lat: 40.4100, lng: -3.6450, type: "Maintenance" },
        nextOrder: { ref: "ORD-3007", address: "C/ Menorca 15", lat: 40.4080, lng: -3.6500, type: "Repair" },
        routeStops: [{ lat: 40.4050, lng: -3.6400 }, { lat: 40.4100, lng: -3.6450 }, { lat: 40.4080, lng: -3.6500 }],
        allocatedHours: 7, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "06:30", endTime: "06:50" },
                { type: "work-order", startTime: "06:50", endTime: "08:50", orderRef: "ORD-3006", orderType: "Maintenance", address: "C/ Ibiza 50", status: "completed" },
                { type: "commuting", startTime: "08:50", endTime: "09:05" },
                { type: "work-order", startTime: "09:05", endTime: "11:05", orderRef: "ORD-3007", orderType: "Repair", address: "C/ Menorca 15", status: currentHour >= 11 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "11:05", endTime: "11:25" },
                { type: "work-order", startTime: "11:25", endTime: "13:25", orderRef: "ORD-3008", orderType: "Installation", address: "C/ Narváez 80", status: currentHour >= 14 ? "completed" : "todo" },
                { type: "commuting", startTime: "14:30", endTime: "14:45" },
                { type: "work-order", startTime: "14:45", endTime: "16:45", orderRef: "ORD-3009", orderType: "Inspection", address: "Av. del Mediterráneo 20", status: currentHour >= 15 && currentHour < 17 ? "in-progress" : currentHour >= 17 ? "completed" : "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "07:00", endTime: "07:15" },
                { type: "work-order", startTime: "07:15", endTime: "09:15", orderRef: "ORD-3014", orderType: "Repair", address: "C/ Pacífico 25", status: "todo" },
                { type: "commuting", startTime: "09:15", endTime: "09:30" },
                { type: "work-order", startTime: "09:30", endTime: "11:30", orderRef: "ORD-3015", orderType: "Maintenance", address: "C/ Conde de Casal 20", status: "todo" },
                { type: "commuting", startTime: "13:00", endTime: "13:15" },
                { type: "work-order", startTime: "13:15", endTime: "15:15", orderRef: "ORD-3016", orderType: "Installation", address: "C/ Doctor Esquerdo 100", status: "todo" },
            ],
        },
    },
    {
        id: "tech-19", name: "Alejandro Gil", role: "Repair Tech", avatar: "AG", color: "#c026d3",
        status: "en-route", lat: 40.4380, lng: -3.7600,
        currentOrder: { ref: "ORD-3017", address: "C/ Princesa 90", lat: 40.4350, lng: -3.7500, type: "Repair" },
        nextOrder: { ref: "ORD-3018", address: "C/ Argüelles 10", lat: 40.4320, lng: -3.7400, type: "Installation" },
        routeStops: [{ lat: 40.4380, lng: -3.7600 }, { lat: 40.4350, lng: -3.7500 }, { lat: 40.4320, lng: -3.7400 }],
        allocatedHours: 6, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "07:30", endTime: "07:50" },
                { type: "work-order", startTime: "07:50", endTime: "09:50", orderRef: "ORD-3017", orderType: "Repair", address: "C/ Princesa 90", status: "completed" },
                { type: "commuting", startTime: "09:50", endTime: "10:10" },
                { type: "work-order", startTime: "10:10", endTime: "12:10", orderRef: "ORD-3018", orderType: "Installation", address: "C/ Argüelles 10", status: currentHour >= 12 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "13:30", endTime: "13:45" },
                { type: "work-order", startTime: "13:45", endTime: "15:45", orderRef: "ORD-3019", orderType: "Maintenance", address: "C/ Alberto Aguilera 40", status: currentHour >= 16 ? "completed" : "todo" },
                { type: "commuting", startTime: "15:45", endTime: "16:00" },
                { type: "work-order", startTime: "16:00", endTime: "17:30", orderRef: "ORD-3020", orderType: "Inspection", address: "C/ San Bernardo 70", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "08:00", endTime: "08:15" },
                { type: "work-order", startTime: "08:15", endTime: "10:15", orderRef: "ORD-3021", orderType: "Repair", address: "C/ Donoso Cortés 30", status: "todo" },
                { type: "commuting", startTime: "10:15", endTime: "10:30" },
                { type: "work-order", startTime: "10:30", endTime: "12:30", orderRef: "ORD-3022", orderType: "Installation", address: "C/ Fernando el Católico 20", status: "todo" },
            ],
            [d3]: [
                { type: "commuting", startTime: "07:00", endTime: "07:15" },
                { type: "work-order", startTime: "07:15", endTime: "09:15", orderRef: "ORD-3030", orderType: "Repair", address: "C/ Meléndez Valdés 30", status: "todo" },
            ],
        },
    },
    {
        id: "tech-20", name: "Beatriz Reyes", role: "Senior Tech", avatar: "BR", color: "#ea580c",
        status: "on-site", lat: 40.4550, lng: -3.6700,
        currentOrder: { ref: "ORD-3023", address: "C/ Serrano 200", lat: 40.4500, lng: -3.6750, type: "Installation" },
        nextOrder: { ref: "ORD-3024", address: "C/ Velázquez 150", lat: 40.4450, lng: -3.6800, type: "Maintenance" },
        routeStops: [{ lat: 40.4550, lng: -3.6700 }, { lat: 40.4500, lng: -3.6750 }, { lat: 40.4450, lng: -3.6800 }],
        allocatedHours: 8, totalHours: 8,
        schedule: {
            [d0]: [
                { type: "commuting", startTime: "06:00", endTime: "06:15" },
                { type: "work-order", startTime: "06:15", endTime: "08:15", orderRef: "ORD-3023", orderType: "Installation", address: "C/ Serrano 200", status: "completed" },
                { type: "commuting", startTime: "08:15", endTime: "08:30" },
                { type: "work-order", startTime: "08:30", endTime: "10:30", orderRef: "ORD-3024", orderType: "Maintenance", address: "C/ Velázquez 150", status: "completed" },
                { type: "commuting", startTime: "10:30", endTime: "10:50" },
                { type: "work-order", startTime: "10:50", endTime: "12:50", orderRef: "ORD-3025", orderType: "Repair", address: "C/ Castellana 100", status: currentHour >= 13 ? "completed" : "in-progress" },
                { type: "commuting", startTime: "14:00", endTime: "14:15" },
                { type: "work-order", startTime: "14:15", endTime: "16:15", orderRef: "ORD-3026", orderType: "Inspection", address: "C/ Orense 40", status: currentHour >= 14 && currentHour < 17 ? "in-progress" : currentHour >= 17 ? "completed" : "todo" },
                { type: "commuting", startTime: "16:15", endTime: "16:30" },
                { type: "work-order", startTime: "16:30", endTime: "18:30", orderRef: "ORD-3027", orderType: "Installation", address: "Paseo de la Castellana 150", status: "todo" },
            ],
            [d1]: [
                { type: "commuting", startTime: "06:30", endTime: "06:45" },
                { type: "work-order", startTime: "06:45", endTime: "08:45", orderRef: "ORD-3028", orderType: "Maintenance", address: "C/ Raimundo Fdez. Villaverde 10", status: "todo" },
                { type: "commuting", startTime: "08:45", endTime: "09:00" },
                { type: "work-order", startTime: "09:00", endTime: "11:00", orderRef: "ORD-3029", orderType: "Repair", address: "C/ José Abascal 50", status: "todo" },
                { type: "commuting", startTime: "11:00", endTime: "11:15" },
                { type: "work-order", startTime: "11:15", endTime: "13:15", orderRef: "ORD-3031", orderType: "Installation", address: "C/ General Perón 20", status: "todo" },
            ],
            [d2]: [
                { type: "commuting", startTime: "07:00", endTime: "07:20" },
                { type: "work-order", startTime: "07:20", endTime: "09:20", orderRef: "ORD-3032", orderType: "Maintenance", address: "C/ Almagro 30", status: "todo" },
                { type: "commuting", startTime: "09:20", endTime: "09:40" },
                { type: "work-order", startTime: "09:40", endTime: "11:40", orderRef: "ORD-3033", orderType: "Repair", address: "C/ Génova 15", status: "todo" },
                { type: "commuting", startTime: "13:00", endTime: "13:15" },
                { type: "work-order", startTime: "13:15", endTime: "15:15", orderRef: "ORD-3034", orderType: "Installation", address: "C/ Sagasta 20", status: "todo" },
            ],
        },
    },
];

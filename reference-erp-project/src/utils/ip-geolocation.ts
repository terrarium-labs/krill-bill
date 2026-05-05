import { IpLocationData } from "@/types/general/location";

// In-memory cache for IP location data
const ipLocationCache: Record<string, IpLocationData> = {};

/**
 * Fetches location data for an IP address
 * Results are cached to avoid redundant API calls
 * @param ip - The IP address to lookup
 * @returns Location data or null if fetch fails
 */
export const fetchLocationFromIp = async (ip: string): Promise<IpLocationData | null> => {
    if (!ip) return null;

    // Return cached result if available
    if (ipLocationCache[ip]) {
        return ipLocationCache[ip];
    }

    // Get API key from environment variable
    const apiKey = process.env.REACT_APP_GEOIP_API_KEY;
    if (!apiKey) {
        console.warn('REACT_GEOIP_API_KEY environment variable is not set');
        return null;
    }

    try {
        const response = await fetch(`https://api.ipgeolocation.io/v2/ipgeo?apiKey=${apiKey}&ip=${ip}`);
        if (response.ok) {
            const data = await response.json();
            // The new API returns the data directly without a status field check
            if (data.ip) {
                console.log('data', data);
                // Cache the result
                ipLocationCache[ip] = data;
                return data;
            }
        }
    } catch (error) {
        // Silently fail - geolocation is not critical
        console.error('Error fetching location from IP:', error);
    }

    return null;
};

/**
 * Batch fetch locations for multiple IPs
 * @param ips - Array of IP addresses
 * @returns Map of IP to location data
 */
export const fetchLocationsFromIps = async (ips: string[]): Promise<Record<string, IpLocationData>> => {
    const uniqueIps = [...new Set(ips.filter(ip => ip && !ipLocationCache[ip]))];

    // Fetch all IPs in parallel
    const results = await Promise.all(
        uniqueIps.map(ip => fetchLocationFromIp(ip))
    );

    // Build result map including cached entries
    const locationMap: Record<string, IpLocationData> = { ...ipLocationCache };
    uniqueIps.forEach((ip, index) => {
        if (results[index]) {
            locationMap[ip] = results[index]!;
        }
    });

    return locationMap;
};

/**
 * Get cached location data for an IP
 * @param ip - The IP address
 * @returns Cached location data or null
 */
export const getCachedLocation = (ip: string): IpLocationData | null => {
    return ipLocationCache[ip] || null;
};

/**
 * Clear the entire cache
 */
export const clearIpLocationCache = (): void => {
    Object.keys(ipLocationCache).forEach(key => delete ipLocationCache[key]);
};

/**
 * Remove specific IP from cache
 * @param ip - The IP address to remove
 */
export const removeFromCache = (ip: string): void => {
    delete ipLocationCache[ip];
};


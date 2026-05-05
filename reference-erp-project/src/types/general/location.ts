import { IconName } from "lucide-react/dynamic";
import { Workplace } from "./workplaces";
import { CommutingRate } from "./commuting-rates";

export interface BasicLocation {
    id: string;
    name: string;
    city: string;
    country: string;
    icon_url: IconName | null;
}

export interface Location extends BasicLocation {
    status: "active" | "inactive";
    address_line_1: string;
    address_line_2: string;
    state_province: string;
    postal_code: string;
    notes: string;
    // Optional fields
    distance: number;
    time_to_travel: number;
    latitude: number;
    longitude: number;
    origin_workplace_id: string | null;
    origin_workplace: Workplace | null;
    commuting_rate: CommutingRate | null;
}

/**
 * IP Geolocation utility with caching
 * Uses ipgeolocation.io API to fetch location data from IP addresses
 */

export interface IpLocationData {
    ip: string;
    hostname?: string;
    location: {
        continent_code?: string;
        continent_name?: string;
        country_code2?: string;
        country_code3?: string;
        country_name?: string;
        country_name_official?: string;
        country_capital?: string;
        state_prov?: string;
        state_code?: string;
        district?: string;
        city?: string;
        locality?: string;
        accuracy_radius?: string;
        confidence?: string;
        dma_code?: string;
        zipcode?: string;
        latitude?: string;
        longitude?: string;
        is_eu?: boolean;
        country_flag?: string;
        geoname_id?: string;
        country_emoji?: string;
    };
    country_metadata?: {
        calling_code?: string;
        tld?: string;
        languages?: string[];
    };
    network?: {
        asn?: {
            as_number?: string;
            organization?: string;
            country?: string;
            asn_name?: string;
            type?: string;
            domain?: string;
            date_allocated?: string;
            allocation_status?: string;
            num_of_ipv4_routes?: string;
            num_of_ipv6_routes?: string;
            rir?: string;
        };
        connection_type?: string;
        company?: {
            name?: string;
            type?: string;
            domain?: string;
        };
    };
    currency?: {
        code?: string;
        name?: string;
        symbol?: string;
    };
    security?: {
        threat_score?: number;
        is_tor?: boolean;
        is_proxy?: boolean;
        proxy_type?: string;
        proxy_provider?: string;
        is_anonymous?: boolean;
        is_known_attacker?: boolean;
        is_spam?: boolean;
        is_bot?: boolean;
        is_cloud_provider?: boolean;
        cloud_provider?: string;
    };
    abuse?: {
        route?: string;
        country?: string;
        handle?: string;
        name?: string;
        organization?: string;
        role?: string;
        kind?: string;
        address?: string;
        emails?: string[];
        phone_numbers?: string[];
    };
    time_zone?: {
        name?: string;
        offset?: number;
        offset_with_dst?: number;
        current_time?: string;
        current_time_unix?: number;
        is_dst?: boolean;
        dst_savings?: number;
        dst_exists?: boolean;
        dst_start?: {
            utc_time?: string;
            duration?: string;
            gap?: boolean;
            date_time_after?: string;
            date_time_before?: string;
            overlap?: boolean;
        };
        dst_end?: {
            utc_time?: string;
            duration?: string;
            gap?: boolean;
            date_time_after?: string;
            date_time_before?: string;
            overlap?: boolean;
        };
    };
    user_agent?: {
        user_agent_string?: string;
        name?: string;
        type?: string;
        version?: string;
        version_major?: string;
        device?: {
            name?: string;
            type?: string;
            brand?: string;
            cpu?: string;
        };
        engine?: {
            name?: string;
            type?: string;
            version?: string;
            version_major?: string;
        };
        operating_system?: {
            name?: string;
            type?: string;
            version?: string;
            version_major?: string;
            build?: string;
        };
    };
}
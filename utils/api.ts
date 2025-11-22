import { Alert } from 'react-native';

// ⚠️ IMPORTANT: REPLACE THIS WITH YOUR ACTUAL API KEY FROM DATA.GOV.IN
const DATA_GOV_IN_API_KEY = "579b464db66ec23bdd0000014e256e2271704bfe66ebeb13c768722d"; 

// The Resource ID for the "Current Daily Price of Various Commodities from Various Markets (Mandi)" dataset.
// This is a standard and frequently used resource for APMC prices.
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

// --- Data Structure ---
export interface MarketPrice {
    commodity: string; // The crop name (e.g., 'Wheat', 'Rice')
    state: string;     // The state (e.g., 'Maharashtra', 'Uttar Pradesh')
    district: string;  // The district (e.g., 'Pune', 'Azadpur')
    market: string;    // The specific market/mandi name
    modalPrice: number; // The most common/modal price (usually per Quintal)
    minPrice: number;   // The minimum price reported
    maxPrice: number;   // The maximum price reported
    date: string;      // The arrival date or date of update
}

/**
 * Fetches market prices from the data.gov.in APMC API.
 * @param state State name (e.g., 'Maharashtra')
 * @param district District name (e.g., 'Pune')
 * @param commodity Commodity name (e.g., 'Wheat')
 * @returns A promise that resolves to an array of MarketPrice objects.
 */
export async function fetchMarketPrices(state: string, district: string, commodity: string): Promise<MarketPrice[]> {
    if (DATA_GOV_IN_API_KEY === "579b464db66ec23bdd0000014e256e2271704bfe66ebeb13c768722d") {
        Alert.alert(
            "API Key Required", 
            "Please update utils/api.ts with your actual data.gov.in API key to fetch real data.",
            [{ text: "OK" }]
        );
        return [];
    }

    // Filters are case-sensitive and must exactly match the data in the API.
    const filters = `state:${state},district:${district},commodity:${commodity}`;

    const params = new URLSearchParams({
        'api-key': DATA_GOV_IN_API_KEY,
        format: 'json',
        filters: filters,
        limit: '20', // Fetch up to 20 relevant entries
    });

    const url = `${BASE_URL}?${params.toString()}`;

    try {
        console.log(`Fetching from: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            // Log response text for debugging, as API might return helpful error JSON
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            throw new Error(`HTTP error! Status: ${response.status}.`);
        }
        
        const data = await response.json();
        
        if (!data.records || data.records.length === 0) {
            console.log('No market records found for the specified filters.');
            return [];
        }

        // Map API response fields to the local MarketPrice interface
        const mappedPrices: MarketPrice[] = data.records.map((record: any) => ({
            // The API uses snake_case keys like commodity, state, district, etc.
            commodity: record.commodity || 'N/A', 
            state: record.state || 'N/A',
            district: record.district || 'N/A',
            market: record.market || 'N/A',
            // Ensure prices are correctly parsed as numbers
            modalPrice: parseFloat(record.modal_price) || 0,
            minPrice: parseFloat(record.min_price) || 0,
            maxPrice: parseFloat(record.max_price) || 0,
            date: record.arrival_date || 'N/A',
        }));

        return mappedPrices;
    } catch (error) {
        console.error('Failed to fetch market prices:', error);
        Alert.alert('API Error', `Failed to fetch data. Please check your network, API Key, and ensure the State/District/Commodity spellings are accurate.`);
        return []; 
    }
}
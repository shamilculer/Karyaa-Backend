
/**
 * Fetches coordinates from the structured address using the OpenCage Geocoder 
 * via the native fetch API.
 * * @param {object} addressData - The address object from req.body.
 * @returns {object|null} - { latitude: number, longitude: number } or null on failure.
 */
export const getCoordinatesFromAddress = async (addressData) => {
    
    // 1. Construct the searchable address string
    const parts = [
        addressData.street,
        addressData.area,
        addressData.city,
        addressData.state,
        "UAE"
    ].filter(p => p && p.trim() !== '');
    
    const addressQuery = parts.join(', ');


    if (!addressQuery) {
        console.warn("Address fields were empty. Cannot geocode.");
        return null;
    }
    
    // 2. Construct the API URL using URLSearchParams (native)
    const geocodeEndpoint = "https://api.opencagedata.com/geocode/v1/json";
    const params = new URLSearchParams({
        q: addressQuery,
        key: process.env.OPENCAGE_API_KEY,
        countrycode: 'ae',
        limit: 1
    });

    const finalUrl = `${geocodeEndpoint}?${params.toString()}`;

    
    // 3. Call the OpenCage Geocoding API using fetch
    try {
        const response = await fetch(finalUrl);
        
        // Check for non-2xx status codes (e.g., rate limit exceeded, invalid key)
        if (!response.ok) {
            console.error(`OpenCage API fetch failed with status: ${response.status}`);
            console.log(response)
            return null;
        }

        const data = await response.json();

        // 4. Process the response data
        if (data.status.code === 200 && data.results.length > 0) {
            const location = data.results[0].geometry;
            
            return {
                latitude: location.lat,
                longitude: location.lng
            };
        } else {
            console.warn(`Geocoding API failed for query: "${addressQuery}". Status code: ${data.status.code}.`);
            // Log detailed error from the API if available
            if (data.status.message) {
                 console.warn(`OpenCage message: ${data.status.message}`);
            }
            return null;
        }

    } catch (error) {
        console.error("Error during fetch operation to OpenCage Geocoding API:", error.message);
        return null;
    }
};
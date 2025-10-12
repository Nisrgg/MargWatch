package com.margwatch.utils

import android.content.Context
import android.location.Geocoder
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.*

object GeocoderUtils {
    
    /**
     * Get address from latitude and longitude coordinates
     * @param context Android context
     * @param latitude Latitude coordinate
     * @param longitude Longitude coordinate
     * @return Address string or null if not found
     */
    suspend fun getAddressFromLocation(
        context: Context,
        latitude: Double,
        longitude: Double
    ): String? = withContext(Dispatchers.IO) {
        try {
            Log.d("GeocoderUtils", "Getting address for lat: $latitude, lng: $longitude")
            
            val geocoder = Geocoder(context, Locale.getDefault())
            
            // Check if geocoder is available
            if (!Geocoder.isPresent()) {
                Log.w("GeocoderUtils", "Geocoder is not available on this device")
                return@withContext null
            }
            
            val addresses = geocoder.getFromLocation(latitude, longitude, 1)
            
            if (!addresses.isNullOrEmpty()) {
                val address = addresses[0]
                val addressString = buildString {
                    // Street number and name
                    address.getAddressLine(0)?.let { append(it) }
                    
                    // Add locality (city) if available
                    address.locality?.let { 
                        if (isNotEmpty()) append(", ")
                        append(it)
                    }
                    
                    // Add country if available
                    address.countryName?.let { 
                        if (isNotEmpty()) append(", ")
                        append(it)
                    }
                }
                
                Log.d("GeocoderUtils", "Address found: $addressString")
                return@withContext addressString.ifEmpty { null }
            } else {
                Log.w("GeocoderUtils", "No address found for coordinates")
                return@withContext null
            }
            
        } catch (e: Exception) {
            Log.e("GeocoderUtils", "Error getting address: ${e.message}")
            return@withContext null
        }
    }
    
    /**
     * Get a simplified address (just street name and city)
     */
    suspend fun getSimpleAddress(
        context: Context,
        latitude: Double,
        longitude: Double
    ): String? = withContext(Dispatchers.IO) {
        try {
            val geocoder = Geocoder(context, Locale.getDefault())
            
            if (!Geocoder.isPresent()) {
                return@withContext null
            }
            
            val addresses = geocoder.getFromLocation(latitude, longitude, 1)
            
            if (!addresses.isNullOrEmpty()) {
                val address = addresses[0]
                val streetName = address.thoroughfare ?: "Unknown Street"
                val city = address.locality ?: "Unknown City"
                
                return@withContext "$streetName, $city"
            }
            
            return@withContext null
            
        } catch (e: Exception) {
            Log.e("GeocoderUtils", "Error getting simple address: ${e.message}")
            return@withContext null
        }
    }
    
    /**
     * Get coordinates from location name/address (forward geocoding)
     * @param context Android context
     * @param locationName The location name or address to search for
     * @return Pair of (latitude, longitude) or null if not found
     */
    suspend fun getLocationFromAddress(
        context: Context,
        locationName: String
    ): Pair<Double, Double>? = withContext(Dispatchers.IO) {
        try {
            Log.d("GeocoderUtils", "Searching for location: $locationName")
            
            val geocoder = Geocoder(context, Locale.getDefault())
            
            if (!Geocoder.isPresent()) {
                Log.w("GeocoderUtils", "Geocoder is not available on this device")
                return@withContext null
            }
            
            val addresses = geocoder.getFromLocationName(locationName, 5) // Get up to 5 results
            
            if (!addresses.isNullOrEmpty()) {
                val address = addresses[0] // Take the first (most relevant) result
                val latitude = address.latitude
                val longitude = address.longitude
                
                Log.d("GeocoderUtils", "Found location: $locationName -> lat: $latitude, lng: $longitude")
                return@withContext Pair(latitude, longitude)
            } else {
                Log.w("GeocoderUtils", "No location found for: $locationName")
                return@withContext null
            }
            
        } catch (e: Exception) {
            Log.e("GeocoderUtils", "Error searching for location: ${e.message}")
            return@withContext null
        }
    }
    
    /**
     * Get multiple location suggestions from partial address
     * @param context Android context
     * @param partialAddress Partial address or location name
     * @return List of address suggestions
     */
    suspend fun getLocationSuggestions(
        context: Context,
        partialAddress: String
    ): List<String> = withContext(Dispatchers.IO) {
        try {
            Log.d("GeocoderUtils", "Getting suggestions for: $partialAddress")
            
            val geocoder = Geocoder(context, Locale.getDefault())
            
            if (!Geocoder.isPresent()) {
                return@withContext emptyList()
            }
            
            val addresses = geocoder.getFromLocationName(partialAddress, 10) // Get up to 10 suggestions
            
            if (!addresses.isNullOrEmpty()) {
                val suggestions = addresses.mapNotNull { address ->
                    buildString {
                        // Street number and name
                        address.getAddressLine(0)?.let { append(it) }
                        
                        // Add locality (city) if available
                        address.locality?.let { 
                            if (isNotEmpty()) append(", ")
                            append(it)
                        }
                        
                        // Add country if available
                        address.countryName?.let { 
                            if (isNotEmpty()) append(", ")
                            append(it)
                        }
                    }.ifEmpty { null }
                }
                
                Log.d("GeocoderUtils", "Found ${suggestions.size} suggestions")
                return@withContext suggestions
            } else {
                Log.w("GeocoderUtils", "No suggestions found for: $partialAddress")
                return@withContext emptyList()
            }
            
        } catch (e: Exception) {
            Log.e("GeocoderUtils", "Error getting suggestions: ${e.message}")
            return@withContext emptyList()
        }
    }
}

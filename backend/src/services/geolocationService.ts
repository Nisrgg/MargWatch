import axios from 'axios';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export class GeolocationService {
  private static instance: GeolocationService;

  private constructor() {}

  public static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService();
    }
    return GeolocationService.instance;
  }

  /**
   * Reverse geocoding - convert coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'RoadIssuePortal/1.0',
          },
          timeout: 10000,
        }
      );

      const data = response.data;
      const address = data.display_name;
      const addressParts = data.address || {};

      return {
        latitude,
        longitude,
        address,
        city: addressParts.city || addressParts.town || addressParts.village,
        state: addressParts.state,
        country: addressParts.country,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error instanceof Error ? error.message : String(error));
      
      // Return basic location data if geocoding fails
      return {
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      };
    }
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Find nearby complaints within a radius
   */
  async findNearbyComplaints(
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ): Promise<{ latitude: number; longitude: number; distance: number }[]> {
    // This would typically query the database
    // For now, return empty array - will be implemented in the controller
    return [];
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  }

  /**
   * Generate heat map data for a region
   */
  generateHeatMapData(
    complaints: Array<{ latitude: number; longitude: number; category: string }>,
    gridSize: number = 0.01 // ~1km grid
  ): Array<{ latitude: number; longitude: number; count: number; category: string }> {
    const grid: { [key: string]: { count: number; category: string } } = {};

    complaints.forEach(complaint => {
      const gridLat = Math.round(complaint.latitude / gridSize) * gridSize;
      const gridLon = Math.round(complaint.longitude / gridSize) * gridSize;
      const key = `${gridLat},${gridLon}`;

      if (!grid[key]) {
        grid[key] = { count: 0, category: complaint.category };
      }
      grid[key].count++;
    });

    return Object.entries(grid).map(([key, data]) => {
      const [lat, lon] = key.split(',').map(Number);
      return {
        latitude: lat,
        longitude: lon,
        count: data.count,
        category: data.category,
      };
    });
  }
}

export default GeolocationService.getInstance();

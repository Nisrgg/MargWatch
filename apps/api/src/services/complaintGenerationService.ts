import geolocationService from './geolocationService';

export class ComplaintGenerationService {
  /**
   * Generate automatic title based on ML category and location
   */
  static generateTitle(category: string, latitude: number, longitude: number, address?: string): string {
    const categoryTitles: { [key: string]: string } = {
      'POTHOLE': 'Pothole Reported',
      'ROAD_INSTABILITY': 'Road Surface Issue',
      'STREETLIGHT_DAMAGE': 'Streetlight Problem',
      'TREE_DAMAGE': 'Tree or Vegetation Issue',
      'OTHER': 'Road Issue Reported'
    };

    const baseTitle = categoryTitles[category] || 'Road Issue Reported';
    
    if (address) {
      // Extract street name from address
      const streetPart = address.split(',')[0].trim();
      return `${baseTitle} on ${streetPart}`;
    }
    
    // Use coordinates for fallback
    const lat = latitude.toFixed(4);
    const lon = longitude.toFixed(4);
    return `${baseTitle} at ${lat}, ${lon}`;
  }

  /**
   * Generate automatic description based on category and location
   */
  static generateDescription(category: string, latitude: number, longitude: number, address?: string, imageCount: number = 1): string {
    const categoryDescriptions: { [key: string]: string } = {
      'POTHOLE': `A ${imageCount > 1 ? 'series of ' : ''}pothole${imageCount > 1 ? 's' : ''} ${imageCount > 1 ? 'have' : 'has'} been reported${address ? ` on ${address.split(',')[0]}` : ' at this location'}. This ${imageCount > 1 ? 'road condition ' : 'issue '}could cause damage to vehicles and pose a safety hazard.`,
      
      'ROAD_INSTABILITY': `Road surface instability ${imageCount > 1 ? 'issues' : 'issue'} detected${address ? ` on ${address.split(',')[0]}` : ' at this location'}. The road surface ${imageCount > 1 ? 'show' : 'shows'} signs of deterioration that may require immediate attention.`,
      
      'STREETLIGHT_DAMAGE': `Streetlight damage reported${address ? ` on ${address.split(',')[0]}` : ' at this location'}. ${imageCount > 1 ? 'The streetlight(s) ' : 'The streetlight '}may require repair or replacement to ensure proper lighting and safety.`,
      
      'TREE_DAMAGE': `Tree or vegetation issue${imageCount > 1 ? 's' : ''} reported${address ? ` near ${address.split(',')[0]}` : ' at this location'}. ${imageCount > 1 ? 'The trees or vegetation ' : 'The tree or vegetation '}may pose a risk to traffic or pedestrians.`,
      
      'OTHER': `Road-related issue${imageCount > 1 ? 's' : ''} reported${address ? ` at ${address.split(',')[0]}` : ' at this location'}. ${imageCount > 1 ? 'Multiple images' : 'An image'} have been provided for assessment.`
    };

    return categoryDescriptions[category] || categoryDescriptions['OTHER'];
  }

  /**
   * Generate complaint data with auto-generated title and description
   */
  static async generateComplaintData(
    category: string, 
    latitude: number, 
    longitude: number, 
    imageCount: number = 1,
    address?: string
  ): Promise<{ title: string; description: string }> {
    
    // If no address provided, try to get it from geocoding
    let finalAddress = address;
    if (!finalAddress) {
      try {
        const locationData = await geolocationService.reverseGeocode(latitude, longitude);
        finalAddress = locationData.address;
      } catch (error) {
        console.log('Could not reverse geocode, using coordinates');
      }
    }

    const title = this.generateTitle(category, latitude, longitude, finalAddress);
    const description = this.generateDescription(category, latitude, longitude, finalAddress, imageCount);

    return { title, description };
  }

  /**
   * Format location string for display
   */
  static formatLocation(latitude: number, longitude: number, address?: string): string {
    if (address) {
      return address;
    }
    
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  /**
   * Generate unique complaint identifier
   */
  static generateComplaintId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `COMP-${timestamp}-${random}`.toUpperCase();
  }
}

export default ComplaintGenerationService;

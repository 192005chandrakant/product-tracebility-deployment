const CloudinaryService = require('./cloudinaryService');

/**
 * StorageFactory - Factory pattern for storage services
 * Currently supports Cloudinary as the primary storage service
 */
class StorageFactory {
  constructor() {
    this.cloudinaryService = null;
  }

  /**
   * Get the configured storage service
   * Currently returns Cloudinary service as the default
   * @returns {CloudinaryService} The storage service instance
   */
  getStorageService() {
    if (!this.cloudinaryService) {
      this.cloudinaryService = new CloudinaryService();
    }
    return this.cloudinaryService;
  }

  /**
   * Get storage service by type
   * @param {string} type - Type of storage service ('cloudinary', 'googledrive', 's3', etc.)
   * @returns {Object} The storage service instance
   */
  getStorageServiceByType(type = 'cloudinary') {
    switch (type.toLowerCase()) {
      case 'cloudinary':
        return this.getStorageService();
      
      // Future storage services can be added here
      // case 'googledrive':
      //   return new GoogleDriveService();
      // case 's3':
      //   return new S3Service();
      
      default:
        console.warn(`⚠️ Unknown storage service type: ${type}, falling back to Cloudinary`);
        return this.getStorageService();
    }
  }

  /**
   * Check if any storage service is available and configured
   * @returns {boolean} True if at least one storage service is configured
   */
  isStorageAvailable() {
    try {
      const service = this.getStorageService();
      return service && typeof service.isAuthenticated === 'function' && service.isAuthenticated();
    } catch (error) {
      console.error('❌ Error checking storage availability:', error.message);
      return false;
    }
  }

  /**
   * Get information about available storage services
   * @returns {Object} Information about configured storage services
   */
  getStorageInfo() {
    const info = {
      available: false,
      services: {},
      primary: 'cloudinary'
    };

    try {
      const cloudinaryService = this.getStorageService();
      info.services.cloudinary = {
        configured: cloudinaryService.isAuthenticated(),
        type: 'cloudinary'
      };
      
      info.available = info.services.cloudinary.configured;
    } catch (error) {
      console.error('❌ Error getting storage info:', error.message);
      info.services.cloudinary = {
        configured: false,
        error: error.message
      };
    }

    return info;
  }
}

// Export singleton instance
module.exports = new StorageFactory();

const cloudinary = require('cloudinary').v2;

class CloudinaryService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
      api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
      secure: true
    });
    
    this.isConfigured = !!(
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET
    );
    
    if (this.isConfigured) {
      console.log('✅ Cloudinary configured successfully');
    } else {
      console.warn('⚠️ Cloudinary not configured - set CLOUDINARY_* environment variables');
    }
  }

  async uploadFile(fileBuffer, fileName, mimeType, productId) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured');
      }
      
      console.log(`📤 Uploading file: ${fileName}, type: ${mimeType}, size: ${fileBuffer.length} bytes`);
      
      // Determine if it's a PDF
      const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      
      // Create upload stream
      return new Promise((resolve, reject) => {
        // Clean filename: remove spaces, special characters, and ensure proper naming
        const cleanFileName = fileName
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special characters except dots, underscores, hyphens
          .toLowerCase(); // Convert to lowercase for consistency
        
        // Create a unique public_id that preserves the original filename structure
        const fileExtension = cleanFileName.split('.').pop();
        const baseFileName = cleanFileName.split('.').slice(0, -1).join('.');
        const timestamp = Date.now();
        const uniquePublicId = `${baseFileName}_${timestamp}`;
        
        console.log(`🏷️ Original filename: ${fileName}`);
        console.log(`🧹 Cleaned filename: ${cleanFileName}`);
        console.log(`🆔 Public ID: ${uniquePublicId}`);
        
        const uploadOptions = {
          folder: `product-uploads/${productId}`,
          public_id: uniquePublicId, // Use cleaned filename without extension
          resource_type: isPdf ? 'image' : 'auto', // IMPORTANT: Use 'image' for PDFs to enable proper delivery
          type: 'upload',
          access_mode: 'public', // Ensure file is publicly accessible
          use_filename: false, // Don't use original filename to avoid conflicts
          unique_filename: false, // We're handling uniqueness manually
          filename_override: cleanFileName, // Preserve original filename for downloads
          // Additional options for better PDF sharing and access
          ...(isPdf && {
            delivery_type: 'upload', // Explicit delivery type for PDFs
            invalidate: true, // Clear cache to ensure immediate availability
            overwrite: false, // Don't overwrite existing files
            tags: ['product-certificate', 'pdf', productId], // Add tags for better organization
            context: {
              product_id: productId,
              file_type: 'certificate',
              original_name: fileName
            },
            // PDF-specific settings for proper delivery
            format: 'pdf', // Explicitly set format as PDF
            pages: true, // Enable page-based operations
            quality: 'auto', // Maintain quality
          })
        };
        
        // IMPORTANT: For PDFs, use image resource type for proper delivery
        if (isPdf) {
          // Use image resource type for PDFs - this enables proper delivery via /image/upload/
          uploadOptions.resource_type = 'image';
          uploadOptions.format = 'pdf';
          uploadOptions.pages = true; // Enable PDF page operations
          // Remove raw-specific options that don't apply to PDFs
          delete uploadOptions.transformation;
          delete uploadOptions.eager;
        }
        
        console.log('🔧 Upload options:', uploadOptions);
        
        // Upload stream
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error:', error);
              reject(error);
              return;
            }
            
            console.log('✅ File uploaded to Cloudinary:', result.public_id);
            console.log('📎 Cloudinary URLs:', {
              secure_url: result.secure_url,
              url: result.url,
              format: result.format,
              resource_type: result.resource_type,
              original_filename: result.original_filename,
              display_name: result.display_name
            });
            
            // Create proper URLs for viewing and downloading
            let viewUrl = result.secure_url;
            let downloadUrl = result.secure_url;
            let shareUrl = result.secure_url;
            
            if (isPdf) {
              // For PDFs uploaded as image resource type, URLs use /image/upload/ path
              const baseUrl = result.secure_url;
              
              // View URL: Direct PDF access via image delivery
              viewUrl = baseUrl;
              
              // Download URL: Force download with attachment flag using query parameter
              const urlParts = baseUrl.split('/upload/');
              if (urlParts.length === 2) {
                // Get the original filename for the attachment
                const originalName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
                // Use query parameter instead of path parameter for fl_attachment
                downloadUrl = `${baseUrl}?fl_attachment=${originalName}`;
              } else {
                downloadUrl = baseUrl;
              }
              
              // Share URL: Clean URL for sharing
              shareUrl = baseUrl;
              
              // Generate additional PDF-specific URLs
              const pdfPreviewUrl = baseUrl.replace('/upload/', '/upload/pg_1/'); // First page preview
              const pdfThumbnailUrl = baseUrl.replace('/upload/', '/upload/w_300,h_400,c_fit,pg_1/'); // Thumbnail
              
              console.log('📎 PDF URLs generated:', {
                view: viewUrl,
                download: downloadUrl,
                share: shareUrl,
                preview: pdfPreviewUrl,
                thumbnail: pdfThumbnailUrl
              });
            }
            
            resolve({
              success: true,
              fileId: result.public_id,
              fileName: cleanFileName, // Use cleaned filename
              originalFileName: fileName, // Preserve original filename
              publicUrl: viewUrl,
              downloadUrl: downloadUrl,
              shareUrl: shareUrl, // Add explicit share URL
              webViewLink: viewUrl,
              webContentLink: downloadUrl,
              format: result.format,
              resourceType: result.resource_type,
              isPdf: isPdf,
              cloudinaryResult: {
                public_id: result.public_id,
                secure_url: result.secure_url,
                original_filename: result.original_filename,
                url: result.url,
                bytes: result.bytes,
                created_at: result.created_at
              }
            });
          }
        );
        
        // Convert buffer to stream and pipe to uploadStream
        const bufferStream = require('stream').Readable.from(fileBuffer);
        bufferStream.pipe(uploadStream);
      });
    } catch (error) {
      console.error('❌ Error uploading to Cloudinary:', error.message);
      throw error;
    }
  }

  async getOrCreateProductFolder(productId) {
    // Cloudinary automatically creates folders, so we just return the path
    return `product-uploads/${productId}`;
  }

  async deleteFile(publicId) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured');
      }
      
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('🗑️ File deleted from Cloudinary:', publicId, result);
      
      return { success: result === 'ok' };
    } catch (error) {
      console.error('❌ Error deleting file from Cloudinary:', error.message);
      return { success: false, error: error.message };
    }
  }

  async listProductFiles(productId) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured');
      }
      
      const result = await cloudinary.search
        .expression(`folder:product-uploads/${productId}`)
        .execute();
      
      const files = result.resources.map(resource => ({
        id: resource.public_id,
        name: resource.public_id.split('/').pop(),
        size: resource.bytes,
        mimeType: resource.resource_type,
        createdTime: resource.created_at,
        modifiedTime: resource.created_at,
        webViewLink: resource.secure_url,
        webContentLink: resource.secure_url
      }));
      
      return { success: true, files };
    } catch (error) {
      console.error('❌ Error listing files from Cloudinary:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Method to get PDF information and verify access
  async getPdfInfo(publicId) {
    try {
      if (!this.isConfigured) {
        throw new Error('Cloudinary not configured');
      }
      
      console.log(`🔍 Getting PDF info for: ${publicId}`);
      
      // Get resource information with PDF-specific details
      const result = await cloudinary.api.resource(publicId, {
        pages: true, // Get PDF page information
        image_metadata: true, // Get additional metadata
        resource_type: 'image' // PDFs are stored as image resource type
      });
      
      console.log('📄 PDF Resource Info:', {
        public_id: result.public_id,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        pages: result.pages,
        url: result.url,
        secure_url: result.secure_url
      });
      
      return {
        success: true,
        info: result,
        isAccessible: true,
        pages: result.pages || 0,
        size: result.bytes,
        format: result.format
      };
    } catch (error) {
      console.error('❌ Error getting PDF info:', error.message);
      return {
        success: false,
        error: error.message,
        isAccessible: false
      };
    }
  }

  // Method to generate PDF delivery URLs
  generatePdfUrls(publicId, fileName) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
    
    return {
      // Direct PDF view
      view: `${baseUrl}/${publicId}.pdf`,
      
      // Force download with original filename as query parameter
      download: `${baseUrl}/${publicId}.pdf?fl_attachment=${fileName}`,
      
      // Shareable URL
      share: `${baseUrl}/${publicId}.pdf`,
      
      // First page preview as image
      preview: `${baseUrl}/pg_1/${publicId}.jpg`,
      
      // Thumbnail
      thumbnail: `${baseUrl}/w_300,h_400,c_fit,pg_1/${publicId}.jpg`,
      
      // Page count and info
      info: `${baseUrl}/pg_1,fl_getinfo/${publicId}.pdf`
    };
  }

  // Method to fix malformed download URLs
  fixDownloadUrl(malformedUrl, originalFileName) {
    if (!malformedUrl || !malformedUrl.includes('cloudinary.com')) {
      return malformedUrl;
    }

    try {
      // Clean the original filename for use in the URL
      const cleanFileName = originalFileName ? originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_') : 'file';
      
      // Check if URL already has fl_attachment in wrong position
      if (malformedUrl.includes('/fl_attachment:')) {
        // Extract the base URL and the file path
        const beforeAttachment = malformedUrl.split('/fl_attachment:')[0];
        const afterAttachment = malformedUrl.split('/fl_attachment:')[1];
        
        // Find where the actual file path starts (after the filename parameter)
        const filePathMatch = afterAttachment.match(/\/v\d+\/(.+)$/);
        if (filePathMatch) {
          const filePath = filePathMatch[0]; // includes the /v1234567890/...
          
          // Reconstruct URL correctly using query parameter
          const fixedUrl = `${beforeAttachment}${filePath}?fl_attachment=${cleanFileName}`;
          console.log('🔧 Fixed download URL:', {
            original: malformedUrl,
            fixed: fixedUrl
          });
          return fixedUrl;
        }
      }
      
      // If URL doesn't have fl_attachment, add it correctly as a query parameter
      if (malformedUrl.includes('/upload/') && !malformedUrl.includes('fl_attachment')) {
        // Add the fl_attachment parameter as a query parameter
        return `${malformedUrl}?fl_attachment=${cleanFileName}`;
      }
      
    } catch (error) {
      console.error('❌ Error fixing download URL:', error);
    }
    
    return malformedUrl;
  }

  /**
   * Fix broken Cloudinary URLs that have fl_attachment in the wrong place
   * @param {string} brokenUrl - The broken URL to fix
   * @returns {string} Fixed URL with proper structure
   */
  fixBrokenCloudinaryUrl(brokenUrl) {
    if (!brokenUrl || !brokenUrl.includes('cloudinary.com')) {
      return brokenUrl;
    }

    // Pattern to match broken URLs with fl_attachment in wrong place
    const brokenPattern = /^(https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/)fl_attachment:([^\/]+)\/(v\d+\/.+)$/;
    const match = brokenUrl.match(brokenPattern);
    
    if (match) {
      const [, baseUrl, filename, pathWithVersion] = match;
      // Reconstruct with correct structure: base/version/path?fl_attachment=filename
      const fixedUrl = `${baseUrl}${pathWithVersion}?fl_attachment=${filename}`;
      console.log('🔧 Fixed broken Cloudinary URL:', {
        original: brokenUrl,
        fixed: fixedUrl
      });
      return fixedUrl;
    }
    
    // If it doesn't match the broken pattern, return as-is
    return brokenUrl;
  }

  isAuthenticated() {
    return this.isConfigured;
  }
}

module.exports = CloudinaryService;

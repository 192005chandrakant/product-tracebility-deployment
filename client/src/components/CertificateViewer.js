import React, { useState } from 'react';
import { FaCertificate, FaDownload, FaExclamationTriangle } from 'react-icons/fa';

const fixDownloadUrl = (url, fileName) => {
  if (!url || typeof url !== 'string') {
    console.error('Invalid URL received:', url);
    return '';
  }

  try {
    if (!url.includes('cloudinary.com')) return url;

    // Extract base URL and version
    const matches = url.match(/(.+)\/v\d+\/(.+)$/);
    if (!matches) return url;

    const [, baseUrl, path] = matches;
    const cleanFileName = fileName?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'download.pdf';

    // Construct proper download URL with fl_attachment as a query parameter
    const downloadUrl = `${baseUrl}/v${url.match(/v(\d+)/)[1]}/${path}?fl_attachment=${cleanFileName}`;
    console.log('Fixed download URL:', downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error('Error fixing download URL:', error);
    return url;
  }
};

const CertificateViewer = ({ product, getDownloadUrl }) => {
  const [error, setError] = useState(null);

  // Helper function to transform Cloudinary URL for PDF viewing
  const getCloudinaryPdfViewUrl = (url) => {
    // Check if it's a Cloudinary URL
    if (url.includes('cloudinary.com')) {
      // For Cloudinary PDFs, ensure we're using the correct image/upload path
      if (url.includes('/raw/upload/')) {
        // Convert raw/upload to image/upload for proper PDF delivery
        return url.replace('/raw/upload/', '/image/upload/');
      } else if (url.includes('/image/upload/')) {
        // Already using correct path
        return url;
      } else if (url.includes('/upload/')) {
        // Add image prefix for PDF delivery
        const parts = url.split('/upload/');
        return `${parts[0]}/image/upload/${parts[1]}`;
      }
    }
    return url;
  };

  const handleViewCertificate = () => {
    let originalUrl = getDownloadUrl(product.certFile);
    
    if (!originalUrl) {
      setError('Certificate URL not available');
      console.error('No certificate URL available. Product certFile:', product.certFile);
      return;
    }

    console.log('Original certificate URL:', originalUrl);
    console.log('Product certFile data:', product.certFile);
    setError(null);

    try {
      // Determine file type
      const fileName = product.certFile?.fileName || product.certFile?.originalFileName || '';
      const isPdf = fileName.toLowerCase().endsWith('.pdf') || originalUrl.toLowerCase().includes('.pdf');
      
      console.log('File name:', fileName, 'Is PDF:', isPdf);
      
      let viewUrl = originalUrl;
      
      // Check for and fix broken Cloudinary URLs with fl_attachment in the wrong place
      if (originalUrl.includes('cloudinary.com') && originalUrl.includes('/fl_attachment:')) {
        // Extract parts of the broken URL
        const urlParts = originalUrl.split('/fl_attachment:');
        if (urlParts.length === 2) {
          // Find the version and path part
          const pathMatch = urlParts[1].match(/\/v\d+\/.+$/);
          if (pathMatch) {
            // Fix the URL by converting to a query parameter format
            viewUrl = `${urlParts[0]}${pathMatch[0]}`;
            console.log('Fixed broken URL for viewing:', viewUrl);
          }
        }
      }
      
      // For Cloudinary PDFs, transform the URL
      if (isPdf && originalUrl.includes('cloudinary.com')) {
        viewUrl = getCloudinaryPdfViewUrl(viewUrl);
        console.log('Transformed Cloudinary PDF URL:', viewUrl);
      }
      
      // Use browser's built-in PDF viewer for best compatibility
      console.log('Opening URL in new tab:', viewUrl);
      window.open(viewUrl, '_blank');
      
    } catch (err) {
      console.error('Error opening certificate:', err);
      setError('Failed to open certificate. Please try downloading instead.');
    }
  };

  if (!getDownloadUrl(product.certFile)) {
    return (
      <div className="col-span-1 sm:col-span-2 text-gray-500 text-sm sm:text-base mt-1">
        <strong>Certificate:</strong> <span>No certificate uploaded</span>
      </div>
    );
  }

  return (
    <div className="col-span-1 sm:col-span-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base mt-1">
      <div className="flex items-center gap-2 mb-2">
        <strong>Certificate:</strong>
        {(product.certFile?.originalFileName || product.certFile?.fileName) && (
          <span className="text-xs text-gray-500">
            ({product.certFile.originalFileName || product.certFile.fileName})
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {/* View Button */}
        <button
          onClick={handleViewCertificate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-green-400 text-green-500 font-semibold bg-transparent hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <FaCertificate />
          View
        </button>

        {/* Download Button */}
        <a
          href={fixDownloadUrl(getDownloadUrl(product.certFile), product.certFile?.originalFileName || product.certFile?.fileName)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-400 text-blue-500 font-semibold bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          style={{ textDecoration: 'none' }}
          download={product.certFile?.originalFileName || product.certFile?.fileName || 'certificate.pdf'}
          onClick={() => {
            const downloadUrl = fixDownloadUrl(getDownloadUrl(product.certFile), product.certFile?.originalFileName || product.certFile?.fileName);
            console.log('Download link clicked. URL:', downloadUrl);
            console.log('Download filename:', product.certFile?.originalFileName || product.certFile?.fileName || 'certificate.pdf');
          }}
        >
          <FaDownload />
          Download
        </a>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <FaExclamationTriangle />
          {error}
        </div>
      )}
    </div>
  );
};

export default CertificateViewer;

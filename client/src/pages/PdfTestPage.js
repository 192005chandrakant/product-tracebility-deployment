import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaExternalLinkAlt, FaDownload, FaCopy, FaCheck } from 'react-icons/fa';

const PdfTestPage = () => {
  const { productId } = useParams();
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        const response = await fetch(`/api/debug/debug-pdf-url/${productId}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setDebugInfo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchDebugInfo();
    }
  }, [productId]);

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(label);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openUrl = (url, newWindow = true) => {
    if (newWindow) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF debug information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!debugInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No debug information available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            PDF Certificate Debug - {debugInfo.productId}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">File Information</h3>
              <p><strong>Original File Name:</strong> {debugInfo.originalFileName || 'N/A'}</p>
              <p><strong>Stored File Name:</strong> {debugInfo.fileName || 'N/A'}</p>
              <p><strong>Is PDF:</strong> {debugInfo.isPdf ? 'Yes' : 'No'}</p>
              <p><strong>Original URL:</strong></p>
              <div className="bg-white p-2 rounded border mt-1 break-all text-sm">
                {debugInfo.originalUrl}
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => openUrl(debugInfo.originalUrl)}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
                >
                  <FaExternalLinkAlt className="mr-2" />
                  Open Original URL
                </button>
                <a
                  href={debugInfo.originalUrl}
                  download
                  className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center justify-center"
                >
                  <FaDownload className="mr-2" />
                  Download File
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* URL Variants */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">URL Variants (for Cloudinary)</h2>
          <div className="space-y-4">
            {Object.entries(debugInfo.urlVariants).map(([key, url]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                  <div className="flex space-x-2">
                    {url && (
                      <>
                        <button
                          onClick={() => copyToClipboard(url, key)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                          title="Copy URL"
                        >
                          {copiedUrl === key ? <FaCheck className="text-green-500" /> : <FaCopy />}
                        </button>
                        <button
                          onClick={() => openUrl(url)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Open URL"
                        >
                          <FaExternalLinkAlt />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-sm break-all">
                  {url || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test URLs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">External Viewer Test URLs</h2>
          <div className="space-y-4">
            {Object.entries(debugInfo.testUrls).map(([key, url]) => (
              <div key={key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800 capitalize">
                    {key === 'googleViewer' ? 'Google Docs Viewer' : 'PDF.js Viewer'}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(url, key)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title="Copy URL"
                    >
                      {copiedUrl === key ? <FaCheck className="text-green-500" /> : <FaCopy />}
                    </button>
                    <button
                      onClick={() => openUrl(url)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Open URL"
                    >
                      <FaExternalLinkAlt />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-sm break-all">
                  {url}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Testing Instructions</h2>
          <div className="text-yellow-700 space-y-2 text-sm">
            <p>1. <strong>Original URL:</strong> Try opening the original Cloudinary URL directly in a new tab</p>
            <p>2. <strong>Without Attachment:</strong> Try the URL without the fl_attachment flag</p>
            <p>3. <strong>Google Viewer:</strong> Test with Google Docs Viewer (good for public URLs)</p>
            <p>4. <strong>PDF.js:</strong> Test with Mozilla's PDF.js viewer</p>
            <p>5. <strong>Download:</strong> If viewing doesn't work, try downloading the file</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfTestPage;

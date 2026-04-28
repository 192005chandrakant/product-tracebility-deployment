import React, { useState } from 'react';
import { FaCertificate, FaDownload, FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';
import GlowingButton from './UI/GlowingButton';

const fixDownloadUrl = (url, fileName) => {
  if (!url || typeof url !== 'string') {
    console.error('Invalid URL received:', url);
    return '';
  }

  try {
    if (!url.includes('cloudinary.com')) return url;

    const matches = url.match(/(.+)\/v\d+\/(.+)$/);
    if (!matches) return url;

    const [, baseUrl, path] = matches;
    const cleanFileName = fileName?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'download.pdf';
    const downloadUrl = `${baseUrl}/v${url.match(/v(\d+)/)[1]}/${path}?fl_attachment=${cleanFileName}`;
    return downloadUrl;
  } catch (error) {
    console.error('Error fixing download URL:', error);
    return url;
  }
};

const CertificateViewer = ({ product, getDownloadUrl }) => {
  const [error, setError] = useState(null);

  const getCloudinaryPdfViewUrl = (url) => {
    if (url.includes('cloudinary.com')) {
      if (url.includes('/raw/upload/')) {
        return url.replace('/raw/upload/', '/image/upload/');
      }
      if (url.includes('/image/upload/')) {
        return url;
      }
      if (url.includes('/upload/')) {
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
      return;
    }

    setError(null);

    try {
      const fileName = product.certFile?.fileName || product.certFile?.originalFileName || '';
      const isPdf = fileName.toLowerCase().endsWith('.pdf') || originalUrl.toLowerCase().includes('.pdf');

      let viewUrl = originalUrl;

      if (originalUrl.includes('cloudinary.com') && originalUrl.includes('/fl_attachment:')) {
        const urlParts = originalUrl.split('/fl_attachment:');
        if (urlParts.length === 2) {
          const pathMatch = urlParts[1].match(/\/v\d+\/.+$/);
          if (pathMatch) {
            viewUrl = `${urlParts[0]}${pathMatch[0]}`;
          }
        }
      }

      if (isPdf && originalUrl.includes('cloudinary.com')) {
        viewUrl = getCloudinaryPdfViewUrl(viewUrl);
      }

      window.open(viewUrl, '_blank');
    } catch (err) {
      console.error('Error opening certificate:', err);
      setError('Failed to open certificate. Please try downloading instead.');
    }
  };

  const resolvedDownloadUrl = getDownloadUrl(product.certFile);

  if (!resolvedDownloadUrl) {
    return (
      <div className="col-span-1 sm:col-span-2 mt-1 rounded-2xl border border-dashed border-white/10 bg-white/40 px-4 py-3 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-400">
        <strong>Certificate:</strong> <span>No certificate uploaded</span>
      </div>
    );
  }

  return (
    <div className="col-span-1 sm:col-span-2 mt-1 rounded-[22px] border border-white/10 bg-white/55 p-4 text-sm text-slate-700 shadow-sm dark:bg-white/5 dark:text-slate-300">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="panel-icon-shell h-10 w-10 rounded-xl">
          <FaCertificate className="text-sm text-purple-500 dark:text-white" />
        </div>
        <div>
          <div className="font-semibold text-slate-900 dark:text-slate-100">Certificate</div>
          {(product.certFile?.originalFileName || product.certFile?.fileName) ? (
            <span className="text-xs text-slate-500">
              {product.certFile.originalFileName || product.certFile.fileName}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <GlowingButton onClick={handleViewCertificate} size="sm" variant="secondary" glowColor="purple">
          <FaExternalLinkAlt />
          View
        </GlowingButton>

        <a
          href={fixDownloadUrl(resolvedDownloadUrl, product.certFile?.originalFileName || product.certFile?.fileName)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none' }}
          download={product.certFile?.originalFileName || product.certFile?.fileName || 'certificate.pdf'}
        >
          <GlowingButton type="button" size="sm" variant="ghost" glowColor="purple">
            <FaDownload />
            Download
          </GlowingButton>
        </a>
      </div>

      {error ? (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
          <FaExclamationTriangle />
          {error}
        </div>
      ) : null}
    </div>
  );
};

export default CertificateViewer;

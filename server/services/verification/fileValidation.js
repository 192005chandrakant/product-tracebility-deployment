const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
]);

const DEFAULT_MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024);

function hasPdfSignature(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return false;
  }
  return buffer.slice(0, 4).toString('ascii') === '%PDF';
}

function hasPngSignature(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) {
    return false;
  }

  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return buffer.slice(0, 8).equals(pngHeader);
}

function hasJpegSignature(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return false;
  }

  const startMarkerOk = buffer[0] === 0xff && buffer[1] === 0xd8;
  const endMarkerOk = buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
  return startMarkerOk && endMarkerOk;
}

function validateCorruptionByMime(file) {
  const mime = String(file && file.mimetype ? file.mimetype : '').toLowerCase();
  const buffer = file && file.buffer;

  if (mime === 'application/pdf') {
    return hasPdfSignature(buffer);
  }

  if (mime === 'image/png') {
    return hasPngSignature(buffer);
  }

  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return hasJpegSignature(buffer);
  }

  return false;
}

function validateCertificateFile(file, options = {}) {
  const issues = [];
  const maxFileSizeBytes = Number(options.maxFileSizeBytes || DEFAULT_MAX_FILE_SIZE_BYTES);

  if (!file) {
    return {
      valid: false,
      issues: ['Certificate file is required for verification.']
    };
  }

  const mime = String(file.mimetype || '').toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    issues.push('Unsupported certificate file type. Allowed: PDF, PNG, JPG.');
  }

  const size = Number(file.size || 0);
  if (!size || size <= 0) {
    issues.push('Certificate file is empty.');
  }

  if (size > maxFileSizeBytes) {
    issues.push(`Certificate file exceeds max size of ${Math.floor(maxFileSizeBytes / (1024 * 1024))} MB.`);
  }

  if (Buffer.isBuffer(file.buffer) && file.buffer.length > 0) {
    const notCorrupted = validateCorruptionByMime(file);
    if (!notCorrupted) {
      issues.push('Certificate file appears corrupted or has mismatched format signature.');
    }
  } else {
    issues.push('Certificate buffer is missing or unreadable.');
  }

  return {
    valid: issues.length === 0,
    issues,
    metadata: {
      mime,
      size,
      maxFileSizeBytes
    }
  };
}

module.exports = {
  validateCertificateFile,
  ALLOWED_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE_BYTES
};

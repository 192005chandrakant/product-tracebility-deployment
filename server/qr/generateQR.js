const QRCode = require('qrcode');

exports.generateQRCode = async (text) => {
  try {
    // Generate QR code as a buffer for Google Drive upload
    return await QRCode.toBuffer(text, {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    throw err;
  }
};

// Legacy function for data URL (if needed elsewhere)
exports.generateQRCodeDataURL = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    throw err;
  }
}; 
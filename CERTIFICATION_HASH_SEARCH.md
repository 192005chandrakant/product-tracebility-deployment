# Certification Hash Search Feature

## Overview

The certification hash search feature allows users to search for products using their certification hash instead of the product ID. This is particularly useful for verifying product authenticity and traceability.

## How It Works

### Database Schema Changes

1. **New Field Added**: A `certificationHash` field has been added to the Product schema to store certification hashes separately from transaction hashes.

2. **Backward Compatibility**: The search function checks both the new `certificationHash` field and the existing `blockchainRefHash` field for compatibility with existing data.

### Search Logic

The search by certification hash works as follows:

1. **Primary Search**: First searches the `certificationHash` field in the database
2. **Fallback Search**: If not found, searches the `blockchainRefHash` field (for backward compatibility)
3. **Blockchain Verification**: Retrieves blockchain data for additional verification
4. **Response**: Returns the product details if found, or a 404 error if not found

### API Endpoint

```
GET /api/product/by-cert-hash/:certHash
```

**Parameters:**
- `certHash` (string): The certification hash to search for

**Response:**
```json
{
  "productId": "string",
  "name": "string",
  "origin": "string",
  "manufacturer": "string",
  "certificationHash": "string",
  "blockchainRefHash": "string",
  "onChain": {
    // Blockchain data if available
  }
}
```

## Frontend Implementation

The search feature is available on the Home page for logged-in users. Users can:

1. Enter a certification hash in the search field
2. Click "View" to search for the product
3. If found, they are redirected to the product detail page
4. If not found, an error message is displayed

## Migration

For existing products that have certification hashes stored in the `blockchainRefHash` field, a migration script is provided:

```bash
cd server
node migrate-cert-hashes.js
```

This script will:
- Identify products with certification hashes in `blockchainRefHash`
- Copy them to the new `certificationHash` field
- Preserve the original `blockchainRefHash` for transaction tracking

## Testing

A test script is provided to verify the functionality:

```bash
cd server
node test-cert-hash-search.js
```

This script will:
- Check for products with certification hashes
- Test the search functionality
- Verify backward compatibility
- Display sample data

## Files Modified

### Backend Changes

1. **`server/models/Product.js`**
   - Added `certificationHash` field to schema

2. **`server/models/controllers/productController.js`**
   - Updated `addProduct` to store certification hash in new field
   - Enhanced `getProductByCertHash` with improved search logic and error handling

3. **`server/utils/blockchain.js`**
   - Added `searchByCertificationHash` function for future blockchain-based search

### Frontend Changes

1. **`client/src/pages/Home.js`**
   - Search functionality already implemented and working

### New Files

1. **`server/migrate-cert-hashes.js`**
   - Migration script for existing data

2. **`server/test-cert-hash-search.js`**
   - Test script for verification

## Usage Examples

### Adding a Product with Certification Hash

When adding a product, the certification hash is automatically generated from uploaded certificate files or can be manually provided.

### Searching by Certification Hash

1. Go to the Home page
2. Scroll to the "Search Product by Certification Hash" section
3. Enter the certification hash
4. Click "View" to find the product

### API Usage

```javascript
// Example API call
const response = await fetch('/api/product/by-cert-hash/your-certification-hash');
const product = await response.json();
console.log(product.productId); // Product ID if found
```

## Error Handling

The feature includes comprehensive error handling:

- **404 Error**: Product not found
- **500 Error**: Server error
- **Frontend Validation**: Ensures certification hash is provided
- **User Feedback**: Toast notifications for success/error states

## Future Enhancements

1. **Blockchain Indexing**: Implement proper indexing for blockchain-based search
2. **Hash Validation**: Add validation for certification hash format
3. **Batch Search**: Support for searching multiple certification hashes
4. **Advanced Filtering**: Combine certification hash search with other filters

## Troubleshooting

### Common Issues

1. **"Product not found" error**
   - Verify the certification hash is correct
   - Check if the product exists in the database
   - Ensure the migration script has been run for existing data

2. **Search not working**
   - Check server logs for errors
   - Verify MongoDB connection
   - Ensure the API endpoint is accessible

3. **Migration issues**
   - Check MongoDB connection
   - Verify database permissions
   - Review migration script output

### Debug Steps

1. Run the test script to verify functionality
2. Check server logs for detailed error messages
3. Verify database schema and data
4. Test API endpoint directly with tools like Postman 
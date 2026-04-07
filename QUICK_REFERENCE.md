# Quick Reference: Product Data Flow

## Where To Find Product Rendering Code

### Frontend Pages That Display Products

| Page | File Path | Fetch API | Line # | State Variable |
|------|-----------|-----------|--------|---|
| Home/Dashboard | `client/src/pages/Home.js` | `/api/recent-products` or `/api/my-products` | 65-118 | `recentProducts` |
| Admin Dashboard | `client/src/pages/AdminDashboard.js` | `/api/my-products` + `/api/products` | 173-218 | `myProducts`, `allProducts`, `flaggedProducts` |
| Product Detail | `client/src/pages/ProductDetail.js` | `/api/product/:id` | URL params | product via direct API |
| User Profile | `client/src/pages/UserProfile.js` | `/api/products` | 90-106 | `products` |
| Update Product | `client/src/pages/UpdateProduct.js` | `/api/products` | 136-160 | Local search results |
| Update Product (Alt) | `client/src/pages/UpdateProductNew.js` | `/api/products` | 140-160 | Local search results |
| Add Product | `client/src/pages/AddProduct.js` | POST `/api/add-product` | 300+ | Form submission |

### Reusable Components That Display Products

| Component | File Path | Purpose | Receives Data Via |
|-----------|-----------|---------|---|
| ProductSearch | `client/src/components/ProductSearch.js` | Search interface | Props: user |
| ProductStageEventsSection | `client/src/components/ProductStageEventsSection.js` | Stage timeline | Props: stageEvents |
| StageDocumentsSection | `client/src/components/StageDocumentsSection.js` | Documents viewer | Props: stageEvents, documents |
| BlockchainTransparencySection | `client/src/components/BlockchainTransparencySection.js` | TX history | Props: blockchainEvents |
| VerificationTimeline | `client/src/components/VerificationTimeline.js` | Status timeline | Props: verification |
| CertificateViewer | `client/src/components/CertificateViewer.js` | Cert viewer | Props: certFile |
| AIProductChatPanel | `client/src/components/AIProductChatPanel.js` | AI chat | Props: productId |

---

## API Endpoints Quick Reference

### Read (GET)

```
GET /api/product/:id                    # Single product by ID
GET /api/products                       # All products (supports pagination)
GET /api/products?page=1&limit=20       # With pagination
GET /api/my-products                    # Current user's products (AUTH required)
GET /api/my-products?page=1&limit=20    # With pagination (AUTH required)
GET /api/recent-products                # Latest N products (default limit=6)
GET /api/recent-products?limit=10       # Latest 10 products
GET /api/product/by-cert-hash/:hash     # Search by certificate hash
GET /api/product/:id/qr                 # Get/generate QR code
```

### Write (POST)

```
POST /api/add-product                   # Create new product (producer role)
POST /api/update-product/:id            # Update product (producer/admin role)
```

---

## Product Schema Fields

```javascript
{
  productId:           String   // Unique identifier
  name:                String   // Product name
  origin:              String   // Place of origin
  manufacturer:        String   // Manufacturer
  description:         String   // Description
  imageFile:           Object   // {publicUrl, downloadUrl, secure_url}
  certFile:            Object   // Certificate file metadata
  qrCode:              Object   // QR code metadata
  stages:              Array    // ['Harvested', 'Processed', ...]
  stageEvents:         Array    // {stage, location, documents, recordedAt}
  blockchainRefHash:   String   // Blockchain reference
  blockchainEvents:    Array    // [{action, txHash, status, ...}]
  verification: {
    status:            String   // 'allowed' | 'flagged' | 'blocked' | 'skipped'
    reviewState:       String   // 'verified' | 'pending_review' | 'rejected'
    riskScore:         Number   // 0-100
    issues:            Array    // List of issues
    criticalFailures:  Array    // Critical issues
  }
  createdByWallet:     String   // Creator email
  isActive:            Boolean  // Active/inactive
  createdAt:           Date     // Creation timestamp
}
```

---

## Authentication

### Token Storage
- **Location**: `localStorage.getItem('token')`
- **Format**: JWT token
- **Usage**: Attached to requests as `Authorization: Bearer ${token}`
- **Protected APIs**: `/api/my-products`, `/api/add-product`, `/api/update-product`

### Roles
- `admin` - Full access to all products and admin functions
- `producer` - Can create/update own products only
- `consumer` - Read-only access to public products

---

## Image & File URLs

### Cloudinary URLs (Public)
- Images stored in `product.imageFile.publicUrl`
- PDFs stored in `product.certFile.downloadUrl` or `shareUrl`
- Example: `https://res.cloudinary.com/xxx/image/upload/v123456/filename.jpg`

### Resolution Function
```javascript
// In ProductDetail.js line 35-43
getImageUrl(fileData) {
  if (fileData?.publicUrl) return fileData.publicUrl;
  if (typeof fileData === 'string') return resolveFileURL(fileData);
  return null;
}
```

---

## No Hardcoded Products

✅ **Verified**:
- No constant files with product data
- No demo products in components
- No seed/fixture files with products
- No fallback product arrays
- No localStorage/sessionStorage product data

**All products are fetched from MongoDB via API**

---

## Common Patterns

### Fetch Product Data
```javascript
useEffect(() => {
  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(buildAPIURL('/api/products'), {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const data = await response.json();
    setProducts(data);
  };
  fetchData();
}, []);
```

### Use ProductSearch Component
```javascript
import ProductSearch from '../components/ProductSearch';

function MyPage() {
  return <ProductSearch user={userObj} />;
}
```

### Get Single Product Detail
```javascript
const { id } = useParams();
useEffect(() => {
  const fetchProduct = async () => {
    const response = await fetch(buildAPIURL(`/api/product/${id}`));
    const product = await response.json();
    setProduct(product);
  };
  fetchProduct();
}, [id]);
```

---

## Debugging Checklist

- [ ] Check Network tab → API endpoint being called
- [ ] Verify token is in localStorage for protected endpoints
- [ ] Check product._id exists (database product indicator)
- [ ] Verify imageFile.publicUrl is set for images
- [ ] Check verification.status for admin features
- [ ] Look at blockchainEvents for tx history
- [ ] Verify stageEvents array for stage data

---

## Performance Tips

1. **Pagination**: Use `?page=X&limit=Y` for large product lists
2. **Search**: Use `/api/product/by-cert-hash/:hash` for fast lookups
3. **Caching**: Consider wrapping API calls in Context API
4. **Images**: All images use Cloudinary CDN (fast globally)
5. **Lazy Load**: Components use dynamic import for code splitting

---

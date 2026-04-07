# Detailed Code Reference: Product Fetching & Rendering

## File 1: Home.js (Recent Products Display)

**File**: `client/src/pages/Home.js`



### Key Fetching Function

```javascript
// Lines 65-118
const fetchRecentProducts = async () => {
  setRecentProductsLoading(true); 
  setRecentProductsError(null);
  try {
    const apiConfig = await import('../utils/apiConfig');
    const token = localStorage.getItem('token');
    
    // LINE 71: Determines which endpoint to call based on user role
    const isPrivilegedUser = user && (user.role === 'producer' || user.role === 'admin');
    const endpoint = isPrivilegedUser
      ? '/api/my-products?page=1&limit=6'      // Producer sees their own products
      : '/api/recent-products?limit=6';         // Public sees recent products
    
    // LINE 79-88: Fetch from API
    const apiUrl = apiConfig.buildAPIURL(endpoint);
    const response = await fetch(apiUrl, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        : {},
      cache: 'no-store'
    });
    
    // LINE 90-96: Handle response
    if (!response.ok) {
      throw new Error(`Failed to fetch recent products: ${response.status}`);
    }
    
    const payload = await response.json();
    const data = Array.isArray(payload) 
      ? payload 
      : (Array.isArray(payload?.data) ? payload.data : null);
    
    // LINE 102: Filter to only database products (those with _id)
    if (Array.isArray(data)) {
      const dbProducts = data.filter(isDatabaseProduct);
      setRecentProducts(dbProducts);  // LINE 103: Update state
    }
  } catch (error) {
    console.error('Error fetching recent products:', error);
    setRecentProductsError(error.message);
  } finally {
    setRecentProductsLoading(false);
  }
};

// Helper function to identify database products
function isDatabaseProduct(product) {
  return Boolean(product && typeof product === 'object' && product._id);
}
```

### State Variables
```javascript
// Line 25-27: Product state
const [recentProducts, setRecentProducts] = useState([]);
const [recentProductsLoading, setRecentProductsLoading] = useState(false);
const [recentProductsError, setRecentProductsError] = useState(null);
```

### When Fetch is Called
```javascript
// Lines 54-62: useEffect hook
useEffect(() => {
  if (user) {
    fetchRecentProducts();
    
    // Set up periodic refresh every 60 seconds
    const refreshInterval = setInterval(fetchRecentProducts, 60000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }
}, [user]);
```

---

## File 2: AdminDashboard.js (Admin Product Management)

**File**: `client/src/pages/AdminDashboard.js`

### State Variables
```javascript
// Lines 125-137: Product-related state
const [myProducts, setMyProducts] = useState([]);
const [allProducts, setAllProducts] = useState([]);
const [filteredProducts, setFilteredProducts] = useState([]);
const [searchQuery, setSearchQuery] = useState('');
const [selectedStage, setSelectedStage] = useState('');
const [sortBy, setSortBy] = useState('name');
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('my-products');
const [adminOverview, setAdminOverview] = useState(null);
const [flaggedProducts, setFlaggedProducts] = useState([]);
const [selectedReviewProduct, setSelectedReviewProduct] = useState(null);
```

### Fetch My Products
```javascript
// Lines 173-204
const fetchMyProducts = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log('🔍 Fetching my products with token:', token ? 'Present' : 'Missing');
    
    // LINE 178: Fetch with Bearer token
    const res = await fetch(buildAPIURL('/api/my-products'), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('🔍 My products response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      const normalizedProducts = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      
      // LINE 193: Filter to database products only
      const dbProducts = normalizedProducts.filter(isDatabaseProduct);
      console.log('🔍 My products count:', dbProducts.length);
      
      setMyProducts(dbProducts);  // LINE 195: Update state
    } else {
      const errorText = await res.text();
      console.error('❌ Failed to fetch my products:', res.status, errorText);
    }
  } catch (error) {
    console.error('❌ Error fetching my products:', error);
  }
};
```

### Fetch All Products
```javascript
// Lines 206-220
const fetchAllProducts = async () => {
  try {
    // LINE 208: Fetch all products
    const res = await fetch(buildAPIURL('/api/products'));
    const data = await res.json();
    const normalizedProducts = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : [];
    
    const dbProducts = normalizedProducts.filter(isDatabaseProduct);
    setAllProducts(dbProducts);  // LINE 215: Update state
  } catch (error) {
    console.error('Error fetching all products:', error);
  } finally {
    setLoading(false);
  }
};
```

### Product Rendering
```javascript
// Lines 710-750: Rendering product table
{filteredModerationQueue.map((product) => {
  const verificationMeta = getVerificationMeta(product.verification);
  const isSelected = selectedReviewProduct?.productId === product.productId;

  return (
    <tr key={product.productId} onClick={() => handleSelectReviewProduct(product)}>
      <td className="px-4 py-4">
        <div className="flex items-start gap-3">
          {/* Product Image - Line 725 */}
          <div className="w-12 h-12 rounded-xl overflow-hidden">
            {isValidImage(product.imageFile) ? (
              <img
                src={getFullUrl(product.imageFile)}  // Get Cloudinary URL
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center">
                <FaBoxOpen className="text-lg" />
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div>
            <div className="font-semibold">{product.name || 'Unnamed'}</div>
            <div className="text-xs text-slate-500">{product.productId}</div>
            
            {/* Verification Status Badge */}
            <span className={`inline-flex text-[11px] font-semibold ${verificationMeta.statusClass}`}>
              {verificationMeta.label}
            </span>
            
            {/* Stage Badge */}
            <span className="inline-flex text-[11px] font-semibold">
              {product.stages?.length ? product.stages[product.stages.length - 1] : 'No stage'}
            </span>
          </div>
        </div>
      </td>
    </tr>
  );
})}
```

---

## File 3: ProductDetail.js (Single Product View)

**File**: `client/src/pages/ProductDetail.js`

### Image Handling
```javascript
// Lines 35-50: getImageUrl function
function getImageUrl(fileData) {
  if (!fileData) return null;
  
  // If it's an object with publicUrl (Cloudinary or other storage)
  if (typeof fileData === 'object' && fileData.publicUrl) {
    return fileData.publicUrl;  // ← Direct Cloudinary URL
  }
  
  // Legacy format - local file path
  if (typeof fileData === 'string' && fileData) {
    // Use API config utility for resolving file URLs
    const { resolveFileURL } = require('../utils/apiConfig');
    return resolveFileURL(fileData);
  }
  
  return null;
}

// Lines 43-85: getDownloadUrl function (for PDFs/certificates)
function getDownloadUrl(fileData) {
  if (!fileData) return null;
  
  // If it's an object with downloadUrl
  if (typeof fileData === 'object') {
    let url = null;
    
    if (fileData.downloadUrl) {
      url = fileData.downloadUrl;
    } else if (fileData.shareUrl) {
      url = fileData.shareUrl;
    } else if (fileData.publicUrl) {
      url = fileData.publicUrl;
    } else if (fileData.url) {
      url = fileData.url;
    } else if (fileData.secure_url) {
      url = fileData.secure_url;
    }
    
    return url;
  }
  
  // Legacy format
  if (typeof fileData === 'string' && fileData) {
    return fileData.startsWith('/uploads') 
      ? `${getAPIBaseURL()}${fileData}` 
      : fileData;
  }
  
  return null;
}
```

### Status Options (Always Hardcoded - Not From Database)
```javascript
// Lines 21-27
const PLACEHOLDER_IMG = 'https://via.placeholder.com/600x300?text=No+Image';
const STATUS_OPTIONS = [
  'Harvested',
  'Processed',
  'Packaged',
  'Shipped',
  'Delivered',
  'Sold',
];

// NOTE: These are options for stage management, NOT the actual product data
// Actual stages come from product.stages array from database
```

---

## File 4: ProductSearch.js (Search Component)

**File**: `client/src/components/ProductSearch.js`

### Search Function
```javascript
// Lines 21-48: Main search function
const searchProduct = useCallback(async (query, type) => {
  if (!query.trim()) {
    setSearchResults([]);
    return;
  }

  setSearchLoading(true);
  try {
    const apiConfig = await import('../utils/apiConfig');
    let apiUrl;
    
    // LINE 24-27: Choose endpoint based on search type
    if (type === 'certHash') {
      apiUrl = apiConfig.buildAPIURL(
        `/api/product/by-cert-hash/${encodeURIComponent(query)}`
      );
    } else {
      apiUrl = apiConfig.buildAPIURL(
        `/api/product/${encodeURIComponent(query)}`
      );
    }

    // LINE 30: Fetch from API
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      const product = await response.json();
      setSearchResults([product]);  // LINE 36: Store in state
    } else if (response.status === 404) {
      setSearchResults([]);
      toast.error(`No product found with this ${type === 'certHash' ? 'certificate hash' : 'product ID'}`);
    } else {
      throw new Error(`Search failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Search error:', error);
    setSearchResults([]);
    toast.error('Error searching for product');
  } finally {
    setSearchLoading(false);
  }
}, []);
```

### State
```javascript
// Lines 8-12
const [searchQuery, setSearchQuery] = useState('');
const [searchType, setSearchType] = useState('productId');  // or 'certHash'
const [searchLoading, setSearchLoading] = useState(false);
const [searchResults, setSearchResults] = useState([]);
```

---

## File 5: productController.js (Backend - API Implementation)

**File**: `server/models/controllers/productController.js`

### getAllProducts Function
```javascript
// Lines 901-935
exports.getAllProducts = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page);
    const limit = parsePositiveInt(req.query.limit);
    const usePagination = Boolean(page || limit);

    if (!usePagination) {
      // No pagination - return all products
      const products = await Product.find();
      return res.json(products);
    }

    // With pagination
    const normalizedPage = page || 1;
    const normalizedLimit = Math.min(limit || 20, 100);
    const skip = (normalizedPage - 1) * normalizedLimit;

    // LINE 916-920: MongoDB query with pagination
    const [products, total] = await Promise.all([
      Product.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit),
      Product.countDocuments()
    ]);

    // LINE 922-930: Return with pagination metadata
    return res.json({
      data: products,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit),
        hasNextPage: skip + products.length < total,
        hasPrevPage: normalizedPage > 1
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
```

### getMyProducts Function  
```javascript
// Lines 937-976
exports.getMyProducts = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = parsePositiveInt(req.query.page);
    const limit = parsePositiveInt(req.query.limit);
    const usePagination = Boolean(page || limit);
    
    // LINE 949: Filter by creator (authenticated user's email)
    const filter = { createdByWallet: req.user.email };

    if (!usePagination) {
      const products = await Product.find(filter);
      return res.json(products);
    }

    const normalizedPage = page || 1;
    const normalizedLimit = Math.min(limit || 20, 100);
    const skip = (normalizedPage - 1) * normalizedLimit;

    // LINE 957-961: MongoDB query filtered by creator
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit),
      Product.countDocuments(filter)
    ]);

    return res.json({
      data: products,
      pagination: { /* ... */ }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
```

### getRecentProducts Function
```javascript
// Lines 1021-1048
exports.getRecentProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;

    // LINE 1025-1027: Get most recent products
    const recentProducts = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        'productId name manufacturer origin stage stages stageEvents ' +
        'imageFile createdAt updatedAt'
      );

    // LINE 1030-1041: Transform products for frontend
    const transformedProducts = recentProducts.map((product) => {
      const productObj = product.toObject();

      // Ensure stages array is present
      if (!productObj.stages || productObj.stages.length === 0) {
        productObj.stages = productObj.stage 
          ? [productObj.stage] 
          : ['Created'];
      }

      return productObj;
    });

    return res.status(200).json(transformedProducts);
  } catch (error) {
    console.error('Error fetching recent products:', error);
    return res.status(500).json({ error: 'Failed to fetch recent products' });
  }
};
```

### getProductByCertHash Function
```javascript
// Lines 978-1019
exports.getProductByCertHash = async (req, res) => {
  try {
    const { certHash } = req.params;
    
    // LINE 981: Try to find by certificationHash
    let product = await Product.findOne({ certificationHash: certHash });

    // LINE 983-984: Fallback to blockchainRefHash
    if (!product) {
      product = await Product.findOne({ blockchainRefHash: certHash });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // LINE 992-1006: Fetch blockchain data if available
    let onChain = null;
    try {
      onChain = await blockchain.getProductOnChain(product.productId);
      // ... bigint conversion ...
    } catch (e) {
      console.error('Blockchain error in getProductByCertHash:', e);
    }

    // Return combined response
    const productObject = product.toObject();
    if (!Array.isArray(productObject.blockchainEvents) || 
        productObject.blockchainEvents.length === 0) {
      productObject.blockchainEvents = buildLegacyBlockchainEvents(productObject);
    }

    return res.json({ ...productObject, onChain });
  } catch (err) {
    console.error('Error in getProductByCertHash:', err);
    return res.status(500).json({ error: err.message });
  }
};
```

---

## File 6: API Config Helper

**File**: `client/src/utils/apiConfig.js`

### Important Functions
```javascript
// buildAPIURL function - constructs full API endpoint
export function buildAPIURL(endpoint) {
  const baseUrl = getAPIBaseURL();
  return `${baseUrl}${endpoint}`;
}

// resolveFileURL - converts local paths to public URLs
export function resolveFileURL(filePath) {
  if (!filePath) return null;
  // Converts /uploads/file.jpg to full URL
  const baseUrl = getAPIBaseURL();
  return `${baseUrl}${filePath}`;
}
```

---

## Summary of Data Flow

```
1. Component mounts or action triggered
   ↓
2. useEffect() calls fetchFunction()
   ↓
3. buildAPIURL() constructs endpoint (e.g., '/api/products')
   ↓
4. fetch(url, {headers, auth}) sends HTTP request
   ↓
5. Server receives at productRoutes.js
   ↓
6. Router calls productController function (getAllProducts, etc.)
   ↓
7. MongoDB query via Product.find() / Product.findOne()
   ↓
8. Returns JSON array of product documents
   ↓
9. Frontend receives response.json()
   ↓
10. setState(products) updates React state
   ↓
11. Component re-renders
   ↓
12. {products.map(p => <ProductCard product={p} />)}
   ↓
13. Images loaded from product.imageFile.publicUrl (Cloudinary)
   ↓
14. Display complete
```

---

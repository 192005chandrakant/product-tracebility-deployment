const mongoose = require('mongoose');
const Product = require('./models/Product.js');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/product-traceability', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testCertHashSearch() {
  try {
    console.log('Testing certification hash search functionality...\n');

    // Test 1: Check if we can find products by certificationHash field
    console.log('1. Testing search by certificationHash field...');
    const productsByCertHash = await Product.find({ certificationHash: { $exists: true, $ne: null } });
    console.log(`Found ${productsByCertHash.length} products with certificationHash field`);
    
    if (productsByCertHash.length > 0) {
      console.log('Sample products with certificationHash:');
      productsByCertHash.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. Product ID: ${product.productId}, Cert Hash: ${product.certificationHash}`);
      });
    }

    // Test 2: Check if we can find products by blockchainRefHash field (backward compatibility)
    console.log('\n2. Testing search by blockchainRefHash field...');
    const productsByBlockchainHash = await Product.find({ blockchainRefHash: { $exists: true, $ne: null } });
    console.log(`Found ${productsByBlockchainHash.length} products with blockchainRefHash field`);
    
    if (productsByBlockchainHash.length > 0) {
      console.log('Sample products with blockchainRefHash:');
      productsByBlockchainHash.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. Product ID: ${product.productId}, Blockchain Hash: ${product.blockchainRefHash}`);
      });
    }

    // Test 3: Test the actual search function
    console.log('\n3. Testing actual search functionality...');
    if (productsByCertHash.length > 0) {
      const testCertHash = productsByCertHash[0].certificationHash;
      console.log(`Testing with certification hash: ${testCertHash}`);
      
      // Test search by certificationHash
      const foundByCertHash = await Product.findOne({ certificationHash: testCertHash });
      if (foundByCertHash) {
        console.log(`✓ Found product by certificationHash: ${foundByCertHash.productId}`);
      } else {
        console.log('✗ No product found by certificationHash');
      }

      // Test search by blockchainRefHash (backward compatibility)
      const foundByBlockchainHash = await Product.findOne({ blockchainRefHash: testCertHash });
      if (foundByBlockchainHash) {
        console.log(`✓ Found product by blockchainRefHash: ${foundByBlockchainHash.productId}`);
      } else {
        console.log('✗ No product found by blockchainRefHash');
      }
    } else {
      console.log('No products with certification hash found to test with');
    }

    // Test 4: Check for products that might have certification hash in blockchainRefHash
    console.log('\n4. Checking for products that might have cert hash in blockchainRefHash...');
    const allProducts = await Product.find();
    console.log(`Total products in database: ${allProducts.length}`);
    
    const productsWithPossibleCertHash = allProducts.filter(product => 
      product.blockchainRefHash && 
      product.blockchainRefHash.length > 20 && 
      !product.blockchainRefHash.startsWith('0x')
    );
    
    console.log(`Products with possible certification hash in blockchainRefHash: ${productsWithPossibleCertHash.length}`);
    
    if (productsWithPossibleCertHash.length > 0) {
      console.log('Sample products:');
      productsWithPossibleCertHash.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. Product ID: ${product.productId}, Hash: ${product.blockchainRefHash}`);
      });
    }

    console.log('\n✅ Certification hash search test completed!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testCertHashSearch(); 
const mongoose = require('mongoose');
const Product = require('./models/Product.js');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/product-traceability', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateCertificationHashes() {
  try {
    console.log('Starting certification hash migration...\n');

    // Find all products that have blockchainRefHash but no certificationHash
    const productsToMigrate = await Product.find({
      blockchainRefHash: { $exists: true, $ne: null },
      $or: [
        { certificationHash: { $exists: false } },
        { certificationHash: null }
      ]
    });

    console.log(`Found ${productsToMigrate.length} products to migrate`);

    if (productsToMigrate.length === 0) {
      console.log('No products need migration. All products already have certificationHash field.');
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const product of productsToMigrate) {
      try {
        // Check if blockchainRefHash looks like a certification hash (not a transaction hash)
        const isCertHash = product.blockchainRefHash && 
                          product.blockchainRefHash.length > 20 && 
                          !product.blockchainRefHash.startsWith('0x');

        if (isCertHash) {
          // Update the product to set certificationHash
          await Product.updateOne(
            { _id: product._id },
            { certificationHash: product.blockchainRefHash }
          );
          console.log(`✓ Migrated product ${product.productId}: ${product.blockchainRefHash}`);
          migratedCount++;
        } else {
          console.log(`- Skipped product ${product.productId}: blockchainRefHash looks like a transaction hash`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`✗ Error migrating product ${product.productId}:`, error.message);
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`  ✓ Migrated: ${migratedCount} products`);
    console.log(`  - Skipped: ${skippedCount} products`);
    console.log(`  Total processed: ${migratedCount + skippedCount} products`);

    // Verify migration
    console.log('\nVerifying migration...');
    const productsWithCertHash = await Product.find({ certificationHash: { $exists: true, $ne: null } });
    console.log(`Products with certificationHash field: ${productsWithCertHash.length}`);

    if (productsWithCertHash.length > 0) {
      console.log('Sample migrated products:');
      productsWithCertHash.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. Product ID: ${product.productId}`);
        console.log(`     Certification Hash: ${product.certificationHash}`);
        console.log(`     Blockchain Ref Hash: ${product.blockchainRefHash}`);
      });
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the migration
migrateCertificationHashes(); 
/**
 * Blockchain Event Listener Service
 * Monitors Sepolia for ProductTraceability contract events and syncs to MongoDB
 * Handles:
 * - ProductAdded events → confirms pending product registrations
 * - StageUpdated events → confirms pending logistics stage updates
 * - Automatic polling and manual sync via admin endpoint
 */

const { ethers } = require('ethers');
const Product = require('../models/Product');
const { buildBlockchainEventRecord } = require('./blockchainLedger');

class BlockchainEventListener {
  constructor(config = {}) {
    this.config = {
      rpcUrl: config.rpcUrl || process.env.SEPOLIA_RPC_URL,
      contractAddress: config.contractAddress || process.env.CONTRACT_ADDRESS,
      contractAbi: config.contractAbi || require('../contracts/ProductTraceability.abi.json'),
      pollInterval: config.pollInterval || parseInt(process.env.BLOCKCHAIN_EVENT_POLL_INTERVAL_MS || '30000'),
      startBlock: config.startBlock || parseInt(process.env.BLOCKCHAIN_EVENT_START_BLOCK || '0'),
      confirmations: config.confirmations || 1,
      logLevel: config.logLevel || process.env.LOG_LEVEL || 'info',
    };

    this.provider = null;
    this.contract = null;
    this.isRunning = false;
    this.lastBlockProcessed = this.config.startBlock;
    this.pollTimeout = null;
    this.eventStats = {
      productAddedProcessed: 0,
      stageUpdatedProcessed: 0,
      productsConfirmed: 0,
      lastPollTime: null,
      lastPollBlockHeight: null,
      errors: [],
    };
  }

  /**
   * Initialize provider and contract instance
   */
  async initialize() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      this.contract = new ethers.Contract(
        this.config.contractAddress,
        this.config.contractAbi,
        this.provider
      );

      // Verify connection
      const chainId = (await this.provider.getNetwork()).chainId;
      if (chainId !== 11155111) {
        throw new Error(
          `Invalid chain. Expected Sepolia (11155111), got ${chainId}`
        );
      }

      const blockNumber = await this.provider.getBlockNumber();
      this.lastBlockProcessed = Math.max(
        this.lastBlockProcessed,
        blockNumber - 100 // Start 100 blocks back for safety
      );

      this.log('info', 'BlockchainEventListener initialized', {
        rpcUrl: this.config.rpcUrl,
        contractAddress: this.config.contractAddress,
        startBlock: this.lastBlockProcessed,
        chainId,
        currentBlockNumber: blockNumber,
      });

      return true;
    } catch (error) {
      this.logError('Initialization failed', error);
      throw error;
    }
  }

  /**
   * Start polling for events
   */
  start() {
    if (this.isRunning) {
      this.log('warn', 'Event listener already running');
      return;
    }

    this.isRunning = true;
    this.log('info', 'BlockchainEventListener started');
    this.poll();
  }

  /**
   * Stop polling for events
   */
  stop() {
    this.isRunning = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    this.log('info', 'BlockchainEventListener stopped');
  }

  /**
   * Poll for new events
   */
  async poll() {
    if (!this.isRunning) return;

    try {
      const currentBlock = await this.provider.getBlockNumber();
      const toBlock = Math.min(
        currentBlock,
        this.lastBlockProcessed + 5000 // Max 5000 block range per query
      );

      this.log('debug', 'Polling for events', {
        fromBlock: this.lastBlockProcessed,
        toBlock,
        currentBlockHeight: currentBlock,
      });

      // Query ProductAdded events
      await this.processProductAddedEvents(this.lastBlockProcessed, toBlock);

      // Query StageUpdated events
      await this.processStageUpdatedEvents(this.lastBlockProcessed, toBlock);

      this.lastBlockProcessed = toBlock;
      this.eventStats.lastPollTime = new Date();
      this.eventStats.lastPollBlockHeight = toBlock;

      if (toBlock < currentBlock) {
        // More blocks to process, schedule next poll immediately
        this.pollTimeout = setTimeout(() => this.poll(), 0);
      } else {
        // Caught up with chain, wait for poll interval
        this.pollTimeout = setTimeout(() => this.poll(), this.config.pollInterval);
      }
    } catch (error) {
      this.logError('Poll failed', error);
      this.eventStats.errors.push({
        timestamp: new Date(),
        message: error.message,
      });
      // Retry after interval even on error
      this.pollTimeout = setTimeout(() => this.poll(), this.config.pollInterval);
    }
  }

  /**
   * Process ProductAdded events
   */
  async processProductAddedEvents(fromBlock, toBlock) {
    try {
      const events = await this.contract.queryFilter(
        this.contract.filters.ProductAdded(),
        fromBlock,
        toBlock
      );

      for (const event of events) {
        await this.handleProductAddedEvent(event);
      }

      if (events.length > 0) {
        this.log('info', `Processed ${events.length} ProductAdded events`, {
          blockRange: `${fromBlock}-${toBlock}`,
        });
      }
    } catch (error) {
      this.logError('Failed to process ProductAdded events', error);
    }
  }

  /**
   * Handle single ProductAdded event
   */
  async handleProductAddedEvent(event) {
    try {
      const { productId, creator } = event.args || event;
      const txHash = event.transactionHash;
      const blockNumber = event.blockNumber;
      const blockTimestamp = (
        await this.provider.getBlock(blockNumber)
      )?.timestamp;

      // Find pending product in DB
      const product = await Product.findOne({
        productId,
        blockchainStatus: 'pending',
      });

      if (!product) {
        this.log('debug', 'No pending product found for event', {
          productId,
          txHash,
        });
        return;
      }

      // Update product to confirmed
      product.blockchainStatus = 'confirmed';
      product.blockchainTx = txHash;
      product.blockchainUpdatedAt = new Date();

      // Add blockchain event record
      const eventRecord = buildBlockchainEventRecord({
        eventType: 'ProductAdded',
        productId,
        creator,
        txHash,
        blockNumber,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        status: 'confirmed',
        recordedAt: new Date(blockTimestamp * 1000),
      });

      if (!product.blockchainEvents) {
        product.blockchainEvents = [];
      }
      product.blockchainEvents.push(eventRecord);

      await product.save();

      this.eventStats.productAddedProcessed++;
      this.eventStats.productsConfirmed++;

      this.log('info', 'Product confirmed on-chain', {
        productId,
        txHash,
        blockNumber,
      });
    } catch (error) {
      this.logError('Failed to handle ProductAdded event', error);
    }
  }

  /**
   * Process StageUpdated events
   */
  async processStageUpdatedEvents(fromBlock, toBlock) {
    try {
      const events = await this.contract.queryFilter(
        this.contract.filters.StageUpdated(),
        fromBlock,
        toBlock
      );

      for (const event of events) {
        await this.handleStageUpdatedEvent(event);
      }

      if (events.length > 0) {
        this.log('info', `Processed ${events.length} StageUpdated events`, {
          blockRange: `${fromBlock}-${toBlock}`,
        });
      }
    } catch (error) {
      this.logError('Failed to process StageUpdated events', error);
    }
  }

  /**
   * Handle single StageUpdated event
   */
  async handleStageUpdatedEvent(event) {
    try {
      const { productId, stage } = event.args || event;
      const txHash = event.transactionHash;
      const blockNumber = event.blockNumber;
      const blockTimestamp = (
        await this.provider.getBlock(blockNumber)
      )?.timestamp;

      // Find product with pending stage update
      const product = await Product.findOne({
        productId,
        'blockchainEvents.eventType': 'StageUpdated',
        'blockchainEvents.status': 'pending',
      });

      if (!product) {
        this.log('debug', 'No product with pending stage update found', {
          productId,
          stage,
          txHash,
        });
        return;
      }

      // Find the pending stage update event
      const pendingEvent = product.blockchainEvents.find(
        (e) =>
          e.eventType === 'StageUpdated' &&
          e.status === 'pending' &&
          e.stage === stage
      );

      if (!pendingEvent) {
        return;
      }

      // Mark event as confirmed
      pendingEvent.status = 'confirmed';
      pendingEvent.txHash = txHash;
      pendingEvent.blockNumber = blockNumber;
      pendingEvent.recordedAt = new Date(blockTimestamp * 1000);

      product.blockchainUpdatedAt = new Date();
      await product.save();

      this.eventStats.stageUpdatedProcessed++;

      this.log('info', 'Stage update confirmed on-chain', {
        productId,
        stage,
        txHash,
        blockNumber,
      });
    } catch (error) {
      this.logError('Failed to handle StageUpdated event', error);
    }
  }

  /**
   * Manual sync trigger - process all pending products
   */
  async syncPendingProducts() {
    try {
      const pendingProducts = await Product.find({
        blockchainStatus: 'pending',
      }).select('productId blockchainRequest blockchainEvents');

      if (pendingProducts.length === 0) {
        this.log('info', 'No pending products to sync');
        return { processed: 0, confirmed: 0 };
      }

      let confirmed = 0;

      for (const product of pendingProducts) {
        // Find on-chain event matching this product
        try {
          const onChainProduct = await this.contract.getProduct(
            product.productId
          );

          if (onChainProduct && onChainProduct.productId === product.productId) {
            product.blockchainStatus = 'confirmed';
            product.blockchainUpdatedAt = new Date();
            await product.save();
            confirmed++;
          }
        } catch (error) {
          // Product not found on-chain yet
        }
      }

      this.log('info', 'Manual sync completed', {
        total: pendingProducts.length,
        confirmed,
      });

      return {
        processed: pendingProducts.length,
        confirmed,
      };
    } catch (error) {
      this.logError('Manual sync failed', error);
      throw error;
    }
  }

  /**
   * Get listener statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      lastBlockProcessed: this.lastBlockProcessed,
      ...this.eventStats,
    };
  }

  /**
   * Reset listener state
   */
  reset() {
    this.stop();
    this.lastBlockProcessed = this.config.startBlock;
    this.eventStats = {
      productAddedProcessed: 0,
      stageUpdatedProcessed: 0,
      productsConfirmed: 0,
      lastPollTime: null,
      lastPollBlockHeight: null,
      errors: [],
    };
    this.log('info', 'BlockchainEventListener reset');
  }

  /**
   * Logging helpers
   */
  log(level, message, details = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [BlockchainEventListener] [${level}] ${message}`, details);
  }

  logError(message, error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [BlockchainEventListener] [error] ${message}`, {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
  }
}

module.exports = BlockchainEventListener;

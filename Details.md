# Product Traceability Platform - Detailed Project Notes

## 1. What This Project Is

Product Traceability Platform is a full-stack system for tracking products through their lifecycle, proving authenticity with blockchain references, storing certificates and media in cloud storage, and generating AI-assisted insights for producers, admins, and consumers.

The main idea is simple: a product should not only exist in a database. It should be explainable, traceable, and verifiable from multiple trust signals. This project combines:
- MongoDB product records
- blockchain proof anchors
- file and certificate uploads
- QR code based discovery
- AI-powered product chat and insights
- admin moderation and audit tools

The system is designed to support real operational workflows, not just demo CRUD screens.

---

## 2. The Problem It Solves

Supply chain and product authenticity workflows often fail in three common ways:

1. Product data becomes fragmented across systems.
2. Supporting proof documents are hard to verify consistently.
3. Teams do not have a clear view of what happened to a product over time.

This platform solves those problems by bringing the full product journey into one place. A producer can register a product, attach supporting evidence, record lifecycle updates, and generate a QR code. An admin can review flagged records, inspect blockchain and document history, and export audit data. A consumer can inspect the product and see trust indicators in a readable format.

---

## 3. High-Level Architecture

The application is built as a layered system.

### Client Layer
The React frontend handles:
- login and registration
- product detail views
- admin dashboard
- AI tools
- profile and statistics views
- QR scanning and verification pages

### API Layer
The Express backend exposes:
- auth routes
- product routes
- AI routes
- admin routes
- profile routes
- statistics routes

### Domain Layer
Controllers and services implement the actual business logic:
- authentication and role checks
- product creation and update workflows
- certificate verification
- AI prompt generation and response formatting
- blockchain writes and ledger snapshots
- QR generation
- storage abstraction

### Persistence Layer
MongoDB stores:
- users
- products
- product stage events
- blockchain event history
- verification summaries
- audit logs

### Trust and External Services
The app integrates with:
- Gemini for AI generation
- blockchain RPC for contract writes and reads
- Cloudinary or other configured storage for files
- QR generation utilities for product links

---

## 4. Why the Architecture Is Designed This Way

The design uses a hybrid trust model.

MongoDB is used for fast queries, rich UI rendering, filtering, and history storage. Blockchain is used for immutable trust anchors. Cloud storage is used for large media and document assets. Gemini is used for structured analysis and explanations.

This approach is practical because:
- blockchain is not ideal as the primary database for rich UI queries
- MongoDB is not enough by itself for tamper-evident proof
- AI is useful for interpretation, but it must be constrained and normalized
- file storage should be separate from application records

The result is a system that is both usable and auditable.

---

## 5. Technology Stack

### Frontend
- React
- React Router
- Framer Motion
- Tailwind CSS
- React Toastify
- jwt-decode
- custom animated UI components
- 3D visual elements

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcryptjs password hashing
- multer file uploads
- express-rate-limit
- helmet
- compression
- dotenv
- ethers.js

### AI and Verification
- Gemini API
- structured prompt engineering
- JSON-based response normalization
- certificate validation
- field matching
- risk scoring
- decision engine

### Storage and Proof
- Cloudinary-backed storage abstraction
- blockchain transparency snapshots
- QR code generation
- explorer URLs for transaction visibility

---

## 6. Backend Entry Point and Middleware

The backend starts in [server/index.js](server/index.js#L1).

That file configures:
- CORS
- security headers through helmet
- request compression in production
- JSON and URL-encoded body parsing
- rate limiting
- static client hosting
- route registration
- health and database test endpoints

### Why this matters
This file defines the operational envelope of the app. It controls which origins are allowed, how requests are parsed, how the app behaves in development versus production, and how the frontend is served when a build exists.

### Authentication Middleware
The base JWT middleware is in [server/middleware/auth.js](server/middleware/auth.js#L1). It:
- reads the Bearer token
- verifies it with JWT_SECRET
- attaches the decoded user to req.user
- rejects missing or invalid tokens

The admin middleware in [server/middleware/requireAdminAuth.js](server/middleware/requireAdminAuth.js#L1) adds stronger admin protection and supports controlled bypasses for test and local development.

### Why this is important
Access control is not only about login. It also protects who can create products, update products, and access moderation tools.

---

## 7. Authentication Flow

Authentication starts in [server/models/controllers/authController.js](server/models/controllers/authController.js#L1).

### Registration
- validates email, password, and role
- checks whether the role is allowed
- hashes the password with bcrypt
- stores the user in MongoDB

### Login
- normalizes the email
- checks the password against the stored hash
- updates last login time
- signs a JWT token containing user id, email, and role

### Roles
The system currently supports:
- admin
- producer
- consumer

### Design choice
The token includes role information because the frontend and backend both need to make access decisions. This keeps route protection consistent across the app.

---

## 8. Product Lifecycle Flow

The product workflow is handled mainly by [server/models/controllers/productController.js](server/models/controllers/productController.js#L1) and the routes in [server/routes/productRoutes.js](server/routes/productRoutes.js#L1).

### Product Creation
When a producer adds a product:
1. The request is authenticated.
2. The role and permission are checked.
3. File uploads are received in memory using multer.
4. Files are uploaded to storage.
5. Certificates are validated.
6. Gemini may analyze the certificate content.
7. Product metadata is matched against certificate fields.
8. A risk score and decision are generated.
9. Blockchain references are written.
10. A QR code is created.
11. The final record is stored in MongoDB.

### Product Update
Updates follow a similar flow:
- authenticate the user
- enforce producer/admin access
- process file changes
- validate and verify documents when required
- update stage data
- record blockchain and transparency history

### Why this is built as a pipeline
Verification is not a single yes/no event. Real product trust is usually a combination of:
- file integrity
- metadata matching
- AI extraction quality
- risk scoring
- human review status

This codebase models that reality instead of oversimplifying it.

---

## 9. Blockchain Design

Blockchain interaction is handled in [server/utils/blockchain.js](server/utils/blockchain.js#L1).

It:
- loads the contract ABI
- connects to an Ethereum RPC endpoint
- creates a signer wallet
- submits product and stage transactions
- waits for confirmation
- returns transaction hashes

The transparency layer is extended by [server/services/blockchainLedger.js](server/services/blockchainLedger.js#L1), which:
- normalizes blockchain event records
- creates explorer URLs
- builds proof hashes
- optionally signs a verification badge
- compares database fields against on-chain data

### Why blockchain is used this way
Blockchain is not used as the main database. It is used as a proof layer. That makes the system easier to query and display while still preserving tamper-evident trust anchors.

---

## 10. AI Design

The AI system is intentionally structured and controlled.

The main AI controller is [server/models/controllers/aiController.js](server/models/controllers/aiController.js#L1). It exposes:
- chat
- generateDescription
- dashboardInsights
- health

### AI Services
- [server/services/ai/chatService.js](server/services/ai/chatService.js#L1)
- [server/services/ai/descriptionService.js](server/services/ai/descriptionService.js#L1)
- [server/services/ai/dashboardService.js](server/services/ai/dashboardService.js#L1)
- [server/services/ai/geminiClient.js](server/services/ai/geminiClient.js#L1)
- [server/services/ai/responseFormatter.js](server/services/ai/responseFormatter.js#L1)

### What the AI does

#### Product Chat
Lets a user ask questions about a product using:
- product metadata
- stage events
- document history
- blockchain records
- verification context

#### Description Generation
Turns keywords and tone into a polished product description.

#### Dashboard Insights
Analyzes a set of products and produces executive-style summaries and actions.

### Why the AI layer is built this way
AI output is often inconsistent. The backend therefore:
- sanitizes input
- builds strict prompts
- requests structured JSON
- formats the output into readable sections
- avoids raw, unstructured model text in the UI

This keeps the user experience reliable and professional.

### Important implementation note
The codebase is Gemini-only for AI responses. It does not rely on local mock answers as a fallback path. That means the AI system is designed around real model calls with response normalization, not fake generated text.

---

## 11. Verification Design

Verification is a major feature of the system and is implemented as a multi-step decision pipeline.

### File Validation
In [server/services/verification/fileValidation.js](server/services/verification/fileValidation.js#L1), the system checks:
- allowed MIME types
- file size
- file signature
- corruption or unreadable content

### Decision Engine
In [server/services/verification/decisionEngine.js](server/services/verification/decisionEngine.js#L1), the system decides whether a product or document should be:
- allowed
- flagged
- blocked

### Verification Principles
The verification model is designed around practical risk handling:
- a hard failure should block the record
- uncertain evidence should flag the record for review
- clean evidence should allow the record
- AI failures may still allow a cautious, reviewable path depending on policy

### Why this matters
This is closer to real compliance operations than a binary valid/invalid check. It allows the platform to encode nuance and human review into the product lifecycle.

---

## 12. Storage and File Handling

Storage is abstracted through [server/services/storageFactory.js](server/services/storageFactory.js#L1).

### What the factory does
- returns the active storage service
- currently supports Cloudinary-based storage
- leaves room for future providers such as Google Drive or S3

### Why this abstraction is useful
By isolating storage behind a factory:
- the controllers do not depend on one vendor
- uploads can be tested more easily
- future storage integrations become easier
- storage logic stays out of business flow code

Files stored through the system include:
- product images
- certificate files
- stage documents
- QR code images

---

## 13. Frontend Design

The React frontend uses route-based rendering and role-aware navigation.

### Main app bootstrap
- [client/src/index.js](client/src/index.js#L1)
- [client/src/App.js](client/src/App.js#L1)

### Main user views
- landing page
- login and registration
- home dashboard
- product detail
- QR scan
- profile
- admin dashboard
- AI console

### Important pages

#### Product Detail
[client/src/pages/ProductDetail.js](client/src/pages/ProductDetail.js#L1)
This page is the most important UI screen in the app. It shows:
- product information
- image and certificate assets
- stage history
- QR code
- blockchain transparency
- AI product chat
- verification state

#### Admin Dashboard
[client/src/pages/AdminDashboard.js](client/src/pages/AdminDashboard.js#L1)
This page combines:
- my products
- all products
- flagged products
- moderation actions
- action logs
- overview metrics
- AI insights

#### Auth Login
[client/src/pages/AuthLogin.js](client/src/pages/AuthLogin.js#L1)
This page handles user sign-in and stores the JWT token used by protected routes.

### UI Components
Important reusable pieces include:
- [client/src/components/BlockchainTransparencySection.js](client/src/components/BlockchainTransparencySection.js#L1)
- [client/src/components/AIProductChatPanel.js](client/src/components/AIProductChatPanel.js#L1)
- [client/src/components/AIInsightsPanel.js](client/src/components/AIInsightsPanel.js#L1)
- [client/src/components/AIDescriptionGeneratorPanel.js](client/src/components/AIDescriptionGeneratorPanel.js#L1)

### Frontend approach
The frontend uses:
- route guards
- lazy loading
- loading fallbacks
- reusable trust sections
- animated cards and transitions
- responsive layouts

This keeps the interface fast, polished, and usable across roles.

---

## 14. Route Structure

### Auth Routes
- POST /api/auth/register
- POST /api/auth/login

### Product Routes
- GET /api/product/:id
- GET /api/products
- GET /api/my-products
- GET /api/recent-products
- GET /api/product/by-cert-hash/:certHash
- GET /api/product/:id/qr
- POST /api/add-product
- POST /api/update-product/:id

### AI Routes
- GET /api/ai/health
- POST /api/ai/chat
- POST /api/ai/generate-description
- POST /api/ai/dashboard-insights

### Admin Routes
- GET /api/admin/overview
- GET /api/admin/dashboard
- GET /api/admin/actions
- GET /api/admin/transparency-export
- GET /api/admin/products/flagged
- GET /api/admin/product/:id
- POST /api/admin/product/:id/action

### Profile Routes
- GET /api/profile
- PUT /api/profile
- GET /api/profile/stats

### Statistics Routes
- GET /api/statistics/stats
- GET /api/statistics/dashboard
- POST /api/statistics/scan/:productId

---

## 15. Security Model

The platform uses layered security.

### Authentication
- JWT-based sign-in
- password hashing with bcrypt
- protected route middleware

### Authorization
- role-based access control
- admin-only protection
- producer-only product creation
- permission-based sensitive actions

### Request Protection
- CORS origin checking
- rate limiting
- helmet security headers
- input validation
- file validation
- AI prompt sanitization

### Operational Controls
- health endpoint
- db test endpoint
- environment-based admin bypass for local/testing only

---

## 16. Developer Onboarding Guide

If you are new to the repo, read it in this order:

1. [server/index.js](server/index.js#L1) to understand bootstrapping.
2. [server/routes/productRoutes.js](server/routes/productRoutes.js#L1) to see request entry points.
3. [server/models/controllers/productController.js](server/models/controllers/productController.js#L1) to understand the product workflow.
4. [server/services/ai/geminiClient.js](server/services/ai/geminiClient.js#L1) and [server/services/ai/responseFormatter.js](server/services/ai/responseFormatter.js#L1) to understand AI structure.
5. [server/services/verification/fileValidation.js](server/services/verification/fileValidation.js#L1) and [server/services/verification/decisionEngine.js](server/services/verification/decisionEngine.js#L1) to understand verification logic.
6. [client/src/App.js](client/src/App.js#L1) and [client/src/pages/ProductDetail.js](client/src/pages/ProductDetail.js#L1) to understand the user experience.

### Mental model
Think of the system as three linked subsystems:
- business records in MongoDB
- trust anchors on blockchain
- assistant intelligence from Gemini

The application is easiest to understand when you treat those as separate layers that are stitched together by the controller and UI.

---

## 17. Setup Summary

To run the project locally:
- install dependencies in the backend and frontend
- configure environment variables
- start MongoDB
- start the backend server
- start the frontend client

Common environment variables:
- MONGODB_URI
- JWT_SECRET
- GEMINI_API_KEY
- SEPOLIA_RPC_URL or INFURA_API_URL
- BLOCKCHAIN_PRIVATE_KEY
- CONTRACT_ADDRESS
- CLOUDINARY credentials
- CLIENT_APP_URL
- CORS origin settings

---

## 18. Troubleshooting

### Login problems
Check:
- JWT_SECRET
- MongoDB connectivity
- user credentials
- token storage in the browser

### Product upload problems
Check:
- file size
- file type
- Cloudinary configuration
- multer field names
- request form encoding

### AI problems
Check:
- GEMINI_API_KEY
- prompt payload structure
- model availability
- response formatting

### Blockchain problems
Check:
- RPC URL
- private key
- contract address
- ABI file availability
- network connection

### UI problems
Check:
- frontend build output
- API base URL
- route permissions
- browser network tab
- token expiration

---

## 19. Important Implementation Ideas

A few ideas define the codebase:

- fail closed for security-sensitive paths
- normalize data before rendering it
- keep AI output structured
- separate storage, blockchain, and AI responsibilities
- preserve compatibility with legacy product data where possible
- use transparent audit and verification records
- keep the UI readable even when the backend data is complex

Those ideas are what make this repository more than a basic product form app.

---

## 20. Suggested Future Enhancements

Good next steps for the project would be:
- add architecture diagrams
- add a deployment checklist
- add a small glossary of domain terms
- add sample API request and response payloads
- add a contributor guide
- add a more detailed environment variable reference

## 21. Final Summary

This project is a traceability platform that combines:
- operational product management
- blockchain proof
- AI-assisted verification
- cloud file storage
- QR verification
- admin audit workflows

Its core strength is that it explains a product from multiple angles at once: what the product is, what proof it has, how it moved, what was verified, and whether the record is trustworthy.

That is the main engineering value of the system.
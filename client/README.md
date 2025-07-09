# Client - React Frontend Application

The frontend application for the Product Traceability System built with React, Tailwind CSS, and modern web technologies.

## 🏗️ Architecture

```
client/
├── public/                 # Public assets and index.html
├── src/
│   ├── components/         # Reusable React components
│   │   ├── UI/            # UI components (buttons, forms, etc.)
│   │   ├── 3D/            # 3D animation components
│   │   ├── CertificateViewer.js
│   │   ├── Layout.js      # Main layout wrapper
│   │   ├── Navbar.js      # Navigation component
│   │   └── PerformanceMonitor.js
│   ├── pages/             # Page components
│   │   ├── AddProduct.js  # Product creation form
│   │   ├── AdminDashboard.js
│   │   ├── AuthLogin.js   # Login page
│   │   ├── AuthRegister.js # Registration page
│   │   ├── Home.js        # Landing page
│   │   ├── ProductDetail.js # Product details view
│   │   ├── QRScan.js      # QR code scanner
│   │   ├── UpdateProduct.js # Product update form
│   │   └── UserProfile.js # User profile management
│   ├── hooks/             # Custom React hooks
│   │   └── useRealTimeStats.js
│   ├── styles/            # CSS and styling files
│   │   └── animations.css # Custom animations
│   ├── utils/             # Utility functions
│   │   ├── lazyLoading.js
│   │   └── performanceOptimizations.js
│   ├── App.js             # Main App component
│   ├── index.js           # Entry point
│   └── index.css          # Global styles
├── build/                 # Production build (generated)
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
└── config-overrides.js   # Create React App overrides
```

## 🛠️ Technologies Used

- **React** (18+) - UI library with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Hot Toast** - Toast notifications
- **React Icons** - Icon library
- **QR Scanner** - QR code scanning functionality
- **Performance Monitoring** - Custom performance hooks

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend server running on port 5000

### Installation

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📋 Available Scripts

### Development
```bash
npm start          # Start development server
npm run build      # Create production build
npm run test       # Run test suite
npm run eject      # Eject from Create React App
```

### Production
```bash
npm run build      # Build for production
npm run serve      # Serve production build locally
```

## 🎨 Styling & UI

### Tailwind CSS
The application uses Tailwind CSS for styling with custom configurations:

- **Dark Mode**: Automatic dark/light mode support
- **Custom Colors**: Brand-specific color palette
- **Responsive Design**: Mobile-first responsive layouts
- **Animations**: Custom CSS animations for enhanced UX

### Component Structure
- **Layout.js**: Main layout wrapper with navigation
- **Navbar.js**: Responsive navigation component
- **UI Components**: Reusable form elements, buttons, and modals

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the client directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NODE_ENV=development

# Optional: Analytics or other services
REACT_APP_ANALYTICS_ID=your-analytics-id
```

### Proxy Configuration
The development server is configured to proxy API requests to the backend:

```javascript
// In config-overrides.js or package.json
"proxy": "http://localhost:5000"
```

## 📱 Features & Pages

### Authentication Pages
- **Login** (`/login`) - JWT-based authentication
- **Register** (`/register`) - User registration with role selection

### Product Management
- **Add Product** (`/admin/add`) - Create new products with file uploads
- **Product Detail** (`/product/:id`) - View product information and certificates
- **Update Product** (`/admin/update/:id`) - Modify product details
- **QR Scanner** (`/scan`) - Scan QR codes for product lookup

### Dashboard
- **Admin Dashboard** (`/admin/dashboard`) - Product management interface
- **User Profile** (`/profile`) - User account management
- **Home** (`/`) - Landing page with overview

## 🔐 Authentication & Security

### JWT Token Management
- Tokens stored in localStorage
- Automatic token refresh
- Protected routes with role-based access

### Role-Based Access Control
- **Admin**: Full access to all features
- **Manufacturer**: Can create and manage their products
- **Consumer**: Read-only access to product information

### Security Features
- Input validation on all forms
- XSS protection
- CSRF protection via token validation
- Secure file upload handling

## 📡 API Integration

### HTTP Client
Uses fetch API for backend communication with:
- Request/response interceptors
- Error handling
- Loading states management

### Key API Endpoints
```javascript
// Authentication
POST /api/auth/login
POST /api/auth/register

// Products
GET /api/products
POST /api/products
GET /api/product/:id
PUT /api/product/:id/status

// File Management
POST /storage/upload
GET /api/product/:id/qr
```

## 🎯 Performance Optimization

### Code Splitting
- Lazy loading for route components
- Dynamic imports for heavy components
- Bundle size optimization

### Caching
- Local storage for user preferences
- Session storage for temporary data
- Browser caching for static assets

### Monitoring
- Performance monitoring hooks
- Real-time statistics tracking
- Error boundary implementation

## 🧪 Testing

### Test Structure
```bash
src/
├── __tests__/           # Test files
├── components/
│   └── __tests__/       # Component tests
└── utils/
    └── __tests__/       # Utility tests
```

### Running Tests
```bash
npm test                 # Run all tests
npm test -- --coverage  # Run with coverage report
npm test -- --watch     # Run in watch mode
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **API Connection Issues**
   - Verify backend server is running on port 5000
   - Check CORS configuration
   - Verify API endpoints in network tab

3. **Styling Issues**
   - Check Tailwind CSS configuration
   - Verify PostCSS setup
   - Clear browser cache

4. **Authentication Problems**
   - Check localStorage for valid token
   - Verify JWT token format
   - Check token expiration

### Debug Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Network tab for API debugging
- Console for error messages

## 📚 Component Documentation

### Core Components

#### CertificateViewer
Handles PDF certificate viewing and downloading:
```javascript
<CertificateViewer 
  product={product} 
  getDownloadUrl={getDownloadUrl} 
/>
```

#### Layout
Main application layout wrapper:
```javascript
<Layout>
  <YourPageContent />
</Layout>
```

#### Navbar
Navigation component with authentication state:
```javascript
<Navbar user={currentUser} onLogout={handleLogout} />
```

### Form Components
- Form validation with real-time feedback
- File upload with progress indicators
- Password confirmation for sensitive actions

## 🔄 State Management

### Local State
- Component-level state with useState
- Form state management
- UI state (loading, errors, etc.)

### Global State
- User authentication context
- Application settings
- Real-time data updates

## 📦 Build & Deployment

### Production Build
```bash
npm run build
```

### Static File Serving
The build folder contains optimized static files:
- Minified JavaScript bundles
- Optimized CSS files
- Compressed images and assets

### Deployment Options
- **Netlify**: Easy static site deployment
- **Vercel**: Automatic deployments from Git
- **AWS S3**: Static website hosting
- **Traditional Hosting**: Upload build folder to web server

## 🤝 Contributing

### Development Workflow
1. Create feature branch from main
2. Follow component naming conventions
3. Add tests for new components
4. Update documentation
5. Submit pull request

### Code Style
- Use functional components with hooks
- Follow React best practices
- Maintain consistent file structure
- Add PropTypes for component props

## 📞 Support

For frontend-specific issues:
- Check browser console for errors
- Verify component props and state
- Test API endpoints separately
- Review network requests in dev tools
└── tailwind.config.js   # Tailwind CSS configuration
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Start Development Server
```bash
npm start
```

The application will be available at: **http://localhost:3000**

### 3. Backend Requirement
Ensure the backend server is running on **http://localhost:5000** before starting the client.

## ✨ Features

### 🎨 User Interface
- **Modern Design**: Clean, professional interface with glassmorphism effects
- **3D Animations**: Interactive Three.js scenes and floating elements
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme detection and manual toggle
- **Smooth Transitions**: Framer Motion animations throughout

### 🔐 Authentication
- **User Registration**: Multi-role signup (Producer, Distributor, Consumer)
- **Secure Login**: JWT-based authentication
- **Protected Routes**: Role-based access control
- **User Profiles**: Editable user information and preferences

### 📦 Product Management
- **Product Creation**: Rich form with file uploads
- **Product Tracking**: Complete lifecycle visualization
- **QR Code Integration**: Built-in scanner and generator
- **Real-time Updates**: Live product status updates
- **Advanced Search**: Filter and sort capabilities

### ☁️ Google Drive Integration
- **OAuth Setup**: Beautiful setup flow for Google Drive connection
- **15GB Free Storage**: Utilize personal Google Drive storage
- **File Management**: Upload certificates, images, and documents
- **Mock Mode**: Fully functional without Google Drive

### 📊 Analytics & Monitoring
- **Real-time Dashboard**: Live statistics and metrics
- **Visual Charts**: Product lifecycle visualization
- **Performance Monitoring**: Built-in performance tracking
- **Interactive Elements**: Hover effects and animations

## 🛠️ Technology Stack

### Core Technologies
- **React.js 18+** - Modern React with hooks and functional components
- **React Router v6** - Client-side routing
- **Framer Motion** - Advanced animations and transitions
- **Three.js + React Three Fiber** - 3D graphics and animations

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Comprehensive icon library
- **CSS Modules** - Scoped styling
- **Responsive Design** - Mobile-first approach

### State Management & Data
- **React Hooks** - Built-in state management
- **Custom Hooks** - Reusable stateful logic
- **Fetch API** - HTTP client for API calls
- **Local Storage** - Client-side data persistence

### Development Tools
- **Create React App** - Project scaffolding and build tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing and optimization

## 📱 Application Pages

### Public Pages
- **Landing Page** (`/`) - Hero section with features overview
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - New user registration

### Protected Pages
- **Admin Dashboard** (`/admin-dashboard`) - Product management hub
- **Add Product** (`/add-product`) - Create new products
- **Product Details** (`/product/:id`) - View product information
- **Update Product** (`/update-product/:id`) - Edit product details
- **QR Scanner** (`/qr-scan`) - Scan product QR codes
- **User Profile** (`/profile`) - User account management

## 🎯 Key Components

### 🌟 UI Components (`src/components/UI/`)

#### `GlowingButton`
Beautiful animated buttons with glow effects
```jsx
<GlowingButton 
  onClick={handleClick}
  glowColor="blue"
  className="px-6 py-3"
>
  Click Me
</GlowingButton>
```

#### `AnimatedCard`
Responsive cards with hover animations
```jsx
<AnimatedCard className="p-6">
  <h3>Card Title</h3>
  <p>Card content...</p>
</AnimatedCard>
```

#### `ParticleBackground`
Animated particle system background
```jsx
<ParticleBackground />
```

### 🎮 3D Components (`src/components/3D/`)

#### `Scene3D`
Main 3D scene with interactive elements
```jsx
<Scene3D />
```

#### `FloatingCubeWrapper`
Animated floating cube with customizable size
```jsx
<FloatingCubeWrapper size={1.2} className="w-24 h-24" />
```

### 🔧 Custom Hooks (`src/hooks/`)

#### `useRealTimeStats`
Real-time statistics with auto-refresh
```jsx
const { statistics, loading, refreshStats } = useRealTimeStats(5000);
```

## 🎨 Styling & Theming

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      }
    }
  },
  plugins: []
}
```

### Custom CSS Classes
```css
/* Glassmorphism effect */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(45deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## 🔧 Configuration

### Environment Variables (Optional)
Create `.env` file in client directory for custom configuration:
```properties
# API Base URL (default: uses proxy from package.json)
REACT_APP_API_URL=http://localhost:5000

# App Configuration
REACT_APP_NAME=Product Traceability
REACT_APP_VERSION=1.0.0
```

### Proxy Configuration
The `package.json` includes proxy configuration for API calls:
```json
{
  "proxy": "http://localhost:5000"
}
```

This allows API calls like `/api/products` to automatically proxy to the backend server.

## 📱 Responsive Design

### Breakpoints
- **Mobile**: `< 640px`
- **Tablet**: `640px - 1024px`
- **Desktop**: `> 1024px`

### Mobile-First Approach
```jsx
<div className="
  w-full 
  md:w-1/2 
  lg:w-1/3 
  p-4 
  md:p-6 
  lg:p-8
">
  Responsive content
</div>
```

## 🔍 Development Workflow

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm test` | Run test suite with Jest |
| `npm run eject` | Eject from Create React App (irreversible) |

### Development Server Features
- **Hot Reload** - Automatic browser refresh on file changes
- **Error Overlay** - In-browser error display
- **Source Maps** - Debug with original source code
- **Performance Monitoring** - Built-in performance metrics

### Code Structure Best Practices

```jsx
// Component structure example
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlowingButton from '../components/UI/GlowingButton';

function MyComponent() {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="component-container"
    >
      <h1>Component Content</h1>
      <GlowingButton onClick={handleClick}>
        Action Button
      </GlowingButton>
    </motion.div>
  );
}

export default MyComponent;
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Utilities
- **Jest** - Test runner and assertion library
- **React Testing Library** - Component testing utilities
- **User Event** - Simulate user interactions

### Example Test
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

test('renders component correctly', () => {
  render(<MyComponent />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  expect(screen.getByText('Expected Result')).toBeInTheDocument();
});
```

## 🚀 Production Build

### Building for Production
```bash
npm run build
```

This creates an optimized build in the `build/` folder with:
- **Minified code** - Reduced file sizes
- **Asset optimization** - Compressed images and fonts
- **Code splitting** - Lazy loading for better performance
- **Service worker** - Offline functionality (optional)

### Deployment Options

#### Static Hosting (Recommended)
- **Netlify** - Drag and drop the `build/` folder
- **Vercel** - Connect your Git repository
- **GitHub Pages** - Use `gh-pages` package
- **AWS S3** - Static website hosting

#### Server Deployment
- Serve the `build/` folder with any static file server
- Configure proper routing for single-page application
- Set up HTTPS and proper cache headers

### Production Checklist
- [ ] API endpoints point to production server
- [ ] HTTPS enabled for secure connections
- [ ] Proper error boundaries implemented
- [ ] Performance optimizations applied
- [ ] Accessibility standards met
- [ ] Cross-browser testing completed

## 🔧 Troubleshooting

### Common Issues

1. **Development Server Won't Start**
   ```bash
   Error: EADDRINUSE: address already in use :::3000
   ```
   **Solution**: Kill process on port 3000 or use different port
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   ```

2. **API Calls Failing**
   ```
   Error: Network Error or 404
   ```
   **Solution**: 
   - Ensure backend server is running on port 5000
   - Check proxy configuration in `package.json`
   - Verify API endpoint URLs

3. **Build Fails**
   ```
   Error: Build failed due to ESLint warnings
   ```
   **Solution**: Fix ESLint warnings or disable warnings for build
   ```bash
   # Disable ESLint for build
   GENERATE_SOURCEMAP=false npm run build
   ```

4. **Memory Issues During Build**
   ```
   Error: JavaScript heap out of memory
   ```
   **Solution**: Increase Node.js memory limit
   ```bash
   # Windows
   set NODE_OPTIONS=--max-old-space-size=4096 && npm run build
   
   # macOS/Linux
   NODE_OPTIONS=--max-old-space-size=4096 npm run build
   ```

### Performance Optimization

1. **Code Splitting**
   ```jsx
   import { lazy, Suspense } from 'react';
   
   const LazyComponent = lazy(() => import('./LazyComponent'));
   
   function App() {
     return (
       <Suspense fallback={<div>Loading...</div>}>
         <LazyComponent />
       </Suspense>
     );
   }
   ```

2. **Image Optimization**
   - Use appropriate image formats (WebP, AVIF)
   - Implement lazy loading for images
   - Optimize image sizes for different screen densities

3. **Bundle Analysis**
   ```bash
   # Install bundle analyzer
   npm install --save-dev webpack-bundle-analyzer
   
   # Analyze bundle
   npm run build
   npx webpack-bundle-analyzer build/static/js/*.js
   ```

## 🎨 Customization

### Theme Customization
Update `tailwind.config.js` to customize colors, fonts, and animations:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        'custom': ['Your Custom Font', 'sans-serif'],
      }
    }
  }
}
```

### Component Customization
All components accept `className` props for easy customization:

```jsx
<GlowingButton 
  className="custom-styles" 
  glowColor="purple"
>
  Custom Button
</GlowingButton>
```

## 📊 Performance Monitoring

### Built-in Performance Tracking
The app includes performance monitoring hooks:

```jsx
// Performance monitoring hook
const usePerformanceMonitor = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      console.log('Performance metrics:', list.getEntries());
    });
    observer.observe({ entryTypes: ['measure'] });
  }, []);
};
```

### Web Vitals
Monitor Core Web Vitals for optimal user experience:
- **Largest Contentful Paint (LCP)**
- **First Input Delay (FID)**
- **Cumulative Layout Shift (CLS)**

---

**Frontend Documentation Complete! 🎨**

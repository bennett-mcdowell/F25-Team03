# Market Page Architecture

## Component Hierarchy

```
App.jsx
  └── Router
      └── ProtectedRoute (/market)
          └── Market.jsx (Main Page)
              └── Layout
                  ├── Sidebar (Navigation)
                  └── Main Content
                      ├── Market Header
                      │   ├── Title & Subtitle
                      │   ├── Balance Display (Driver only)
                      │   └── Cart Button
                      │
                      ├── Notification (Toast)
                      │
                      ├── Controls
                      │   └── Show Hidden Checkbox (Driver only)
                      │
                      └── Market Content
                          ├── ProductFilters (Sidebar)
                          │   ├── Filter Header
                          │   └── Category Buttons
                          │
                          └── Product Grid
                              └── ProductCard[] (Multiple)
                                  ├── Product Image
                                  ├── Product Info
                                  ├── Rating
                                  ├── Description
                                  ├── Price (in points)
                                  └── Actions
                                      ├── Add to Cart Button
                                      └── Hide/Show Button (Driver only)
```

## Data Flow

```
┌─────────────────┐
│  FakeStore API  │ (External)
└────────┬────────┘
         │
         ▼
  ┌─────────────┐
  │ useProducts │ (Hook)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Market.jsx │ (Page Component)
  └──────┬──────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
  ┌─────────────┐    ┌─────────────┐
  │ useCart     │    │ useHidden   │ (Hooks)
  └──────┬──────┘    │  Products   │
         │           └──────┬──────┘
         │                  │
         ▼                  ▼
  ┌─────────────┐    ┌─────────────┐
  │ localStorage│    │ Backend API │
  └─────────────┘    └─────────────┘
         │                  │
         │                  │
         └────────┬─────────┘
                  │
                  ▼
         ┌────────────────┐
         │  ProductCard   │ (Component)
         └────────────────┘
```

## State Management

```
┌──────────────────────────────────────────────┐
│              Market.jsx (Page)                │
├──────────────────────────────────────────────┤
│                                               │
│  Local State:                                 │
│  • selectedCategory: string                   │
│  • showHidden: boolean                        │
│  • notification: {message, type} | null       │
│                                               │
│  Custom Hooks:                                │
│  • useProducts() → {products, loading, error} │
│  • useCart() → {cart, addToCart, ...}         │
│  • useHiddenProducts() → {isHidden, hide...}  │
│  • useAuth() → {user}                         │
│                                               │
│  Computed (Memoized):                         │
│  • categories: string[]                       │
│  • filteredProducts: Product[]                │
│  • pointBalance: number                       │
│                                               │
└──────────────────────────────────────────────┘
```

## Hook Responsibilities

### useProducts Hook
```javascript
Responsibility: Product Data Management
├── Fetch products from FakeStore API
├── Handle loading state
├── Handle error state
└── Return products array

Exports:
• products: Product[]
• loading: boolean
• error: string | null
```

### useCart Hook
```javascript
Responsibility: Shopping Cart Management
├── Load cart from localStorage
├── Persist cart to localStorage
├── Add item to cart
├── Remove item from cart
├── Update item quantity
├── Clear entire cart
├── Calculate cart total
└── Get total item count

Exports:
• cart: CartItem[]
• addToCart: (product) => void
• removeFromCart: (id) => void
• updateQuantity: (id, qty) => void
• clearCart: () => void
• getCartTotal: () => number
• getCartItemCount: () => number
```

### useHiddenProducts Hook
```javascript
Responsibility: Product Visibility (Driver only)
├── Fetch hidden products from backend
├── Hide a product
├── Unhide a product
├── Check if product is hidden
└── Handle API errors gracefully

Exports:
• hiddenProducts: Set<number>
• hideProduct: (id) => Promise<boolean>
• unhideProduct: (id) => Promise<boolean>
• isHidden: (id) => boolean
• loading: boolean
```

## Component Responsibilities

### ProductCard Component
```javascript
Responsibility: Display Single Product
├── Show product image
├── Show product title
├── Show category
├── Show rating
├── Show description (truncated)
├── Show price in points
├── Handle "Add to Cart" action
├── Handle "Hide/Show" action
└── Display hidden state visually

Props:
• product: Product (required)
• onAddToCart: (product) => void (required)
• onHide: (id) => void (required)
• isHidden: boolean (optional, default: false)
• showHideButton: boolean (optional, default: true)
```

### ProductFilters Component
```javascript
Responsibility: Category Filtering UI
├── Display filter header
├── Show product count
├── Render category buttons
├── Highlight active category
└── Handle category selection

Props:
• categories: string[] (required)
• selectedCategory: string (required)
• onCategoryChange: (category) => void (required)
• productCount: number (required)
```

## Code Quality Metrics

### Separation of Concerns
✅ Business logic in hooks
✅ Presentation logic in components  
✅ Styling in separate CSS file
✅ Type checking with PropTypes

### Reusability
✅ All hooks are reusable
✅ ProductCard can be used in Cart page
✅ ProductFilters can be extended for more filters
✅ Layout is shared across all pages

### Maintainability
✅ Single Responsibility per component/hook
✅ Clear naming conventions
✅ Consistent code style
✅ Comments for complex logic
✅ Error handling

### Performance
✅ useMemo for expensive computations
✅ Lazy loading for images
✅ LocalStorage for cart persistence
✅ Minimal re-renders

### Testability
✅ Hooks can be tested independently
✅ Components receive props (easy to mock)
✅ Pure functions (predictable behavior)
✅ No hidden dependencies

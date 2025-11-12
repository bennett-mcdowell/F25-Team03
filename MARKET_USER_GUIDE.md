# Market Page Usage Guide

## Accessing the Market

### For Drivers
1. Log in as a driver
2. Click "Market" in the sidebar navigation
3. URL: `http://localhost:3000/market`

### For Other Roles
The market is accessible to all authenticated users, but certain features are driver-only:
- Point balance display
- Product hiding
- Cart functionality

## Features

### 1. Browse Products
- Products are displayed in a responsive grid
- Each card shows:
  - Product image
  - Title
  - Category
  - Rating (stars and review count)
  - Description (truncated)
  - Price in points (1 point = $0.01)

### 2. Filter by Category
Use the sidebar to filter products by category:
- All Categories
- Electronics
- Jewelery
- Men's Clothing
- Women's Clothing

Click any category button to filter. The product count updates automatically.

### 3. Add to Cart (All Users)
1. Click "Add to Cart" button on any product
2. A notification confirms the item was added
3. Cart count updates in the header
4. Click "Cart" button to view your cart

### 4. Hide Products (Driver Only)
Drivers can hide products they're not interested in:

**To Hide:**
1. Click the 🚫 button on any product
2. Product becomes semi-transparent
3. A notification confirms the action

**To Show:**
1. Check "Show hidden products" checkbox
2. Hidden products appear with dashed border
3. Click 👁️ button to unhide
4. Product returns to normal display

**Note:** Hidden products are saved to your account and will remain hidden across sessions.

### 5. View Point Balance (Driver Only)
Your total point balance from all sponsors is displayed in the header:
- Shows your current available points
- Updates when you earn or spend points
- Formatted with commas for readability

## User Interface Elements

### Header
```
┌─────────────────────────────────────────────────────┐
│ Product Catalog                    Balance: 10,000  │
│ Browse and shop our selection      🛒 Cart (3)      │
└─────────────────────────────────────────────────────┘
```

### Controls (Driver Only)
```
☐ Show hidden products
```

### Sidebar
```
┌──────────────────┐
│ Filters    25    │ ← Product count
├──────────────────┤
│ Category         │
│ • All Categories │ ← Active (blue)
│ • Electronics    │
│ • Jewelery       │
│ • Men's Clothing │
│ • Women's Clothing│
└──────────────────┘
```

### Product Card
```
┌──────────────────────────┐
│    [Product Image]       │
├──────────────────────────┤
│ Product Title            │
│ electronics              │
│ ⭐ 4.5 (120 reviews)    │
│                          │
│ Product description...   │
│                          │
│ 2,999 points             │
│ [Add to Cart]  [🚫/👁️]  │
└──────────────────────────┘
```

## Keyboard Navigation

- **Tab**: Navigate between elements
- **Enter/Space**: Activate buttons
- **Arrow Keys**: Navigate filter buttons

## Mobile Experience

On mobile devices (< 768px):
- Filters move above the product grid
- Products display in a single or double column
- Touch-optimized buttons
- Responsive images

## Notifications

Notifications appear in the top-right corner:
- **Success** (green): Action completed successfully
- **Error** (red): Action failed

Notifications auto-dismiss after 3 seconds.

## Tips

1. **Finding Specific Items**: Use category filters to narrow down products
2. **Managing Hidden Products**: Use "Show hidden products" to review and unhide items
3. **Cart Management**: Cart persists even if you close your browser
4. **Point Planning**: Check your balance before adding expensive items to cart

## Troubleshooting

### Products not loading
- **Issue**: Blank grid with "Loading products..."
- **Solution**: Check internet connection (requires access to fakestoreapi.com)

### Can't hide products
- **Issue**: Hide button does nothing
- **Solution**: Ensure you're logged in as a driver

### Cart count not updating
- **Issue**: Added items but count stays at 0
- **Solution**: Clear browser cache and reload page

### Hidden products still showing
- **Issue**: Hid products but they still appear
- **Solution**: Uncheck "Show hidden products" checkbox

## Developer Notes

### Data Sources
- Products: FakeStore API (https://fakestoreapi.com/products)
- Hidden products: Backend API (`/api/driver/catalog/hidden`)
- Cart: Browser localStorage
- Point balance: User's role data from auth context

### Price Conversion
Prices from FakeStore API are in dollars. They're converted to points:
- $29.99 → 2,999 points
- Formula: `Math.floor(price * 100)`

### Cart Persistence
Cart data is stored in localStorage as JSON:
```javascript
{
  "cart": [
    {
      "id": 1,
      "title": "Product Name",
      "price": 109.95,
      "quantity": 2,
      ...
    }
  ]
}
```

### API Endpoints Used
```
GET  /api/driver/catalog/hidden    # Get hidden product IDs
POST /api/driver/catalog/hide      # Hide a product
POST /api/driver/catalog/unhide    # Unhide a product
```

## Accessibility

The Market page includes:
- ✅ Semantic HTML
- ✅ Alt text for all images
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Screen reader support
- ✅ Color contrast compliance

## Next Steps

After browsing the market:
1. Navigate to **Cart** to review your selections
2. Adjust quantities or remove items
3. Proceed to checkout
4. Complete your purchase with your points

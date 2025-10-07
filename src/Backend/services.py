import requests

# ------------------------------
# Fake Store API interaction
def get_fake_store_data():
    """Get products from Fake Store API"""
    try:
        # Fake Store API - no authentication needed
        url = "https://fakestoreapi.com/products"
        
        response = requests.get(url)
        
        if response.status_code == 200:
            products = response.json()
            print(f"Fake Store API success: Found {len(products)} items")
            
            # Transform to consistent format
            return {
                "products": products,
                "total": len(products)
            }
        else:
            return {"error": f"API request failed: {response.status_code}"}
    
    except Exception as e:
        return {"error": str(e)}
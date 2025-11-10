import requests

# ------------------------------
# Fake Store API interaction
def get_fake_store_data():
    """Get products from Fake Store API"""
    try:
        # Fake Store API - no authentication needed
        url = "https://fakestoreapi.com/products"
        
        # Add headers to avoid 403 (some APIs block requests without User-Agent)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            products = response.json()
            print(f"Fake Store API success: Found {len(products)} items")
            
            # Transform to consistent format
            return {
                "products": products,
                "total": len(products)
            }
        else:
            print(f"Fake Store API error: {response.status_code} - {response.text}")
            return {"error": f"API request failed: {response.status_code}", "products": [], "total": 0}
    
    except requests.exceptions.Timeout:
        print("Fake Store API timeout")
        return {"error": "Request timeout", "products": [], "total": 0}
    except Exception as e:
        print(f"Fake Store API exception: {str(e)}")
        return {"error": str(e), "products": [], "total": 0}
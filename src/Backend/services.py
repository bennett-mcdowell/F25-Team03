import requests, os, base64

# ------------------------------
# eBay API interaction
def get_raw_ebay_data():
    """Get raw eBay API data"""
    client_id = os.getenv('EBAY_CLIENT_ID')
    client_secret = os.getenv('EBAY_CLIENT_SECRET')
    
    if not client_id or not client_secret:
        return {"error": "eBay credentials not found in .env file"}
    
    try:
        # Get token
        token_url = "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
        credentials = f"{client_id}:{client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {encoded_credentials}'
        }
        
        data = {
            'grant_type': 'client_credentials',
            'scope': 'https://api.ebay.com/oauth/api_scope'
        }
        
        response = requests.post(token_url, headers=headers, data=data)
        if response.status_code != 200:
            return {"error": f"Token failed: {response.status_code}"}
        
        token = response.json().get('access_token')
        
        # Get products
        search_url = "https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search"
        search_headers = {
            'Authorization': f'Bearer {token}',
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        }
        
        params = {
            'q': 'electronics',
            'limit': 6,
            'filter': 'price:[1..1000]'
        }
        
        search_response = requests.get(search_url, headers=search_headers, params=params)
        if search_response.status_code == 200:
            raw_data = search_response.json()
            
            # Ensure every item has image and URL fields
            for item in raw_data.get('itemSummaries', []):
                # Image fallback
                if not item.get('image'):
                    item['image'] = {'imageUrl': '/static/img/placeholder.png'}  # your placeholder image
                elif not item['image'].get('imageUrl') and item['image'].get('images'):
                    item['image']['imageUrl'] = item['image']['images'][0].get('imageUrl', '/static/img/placeholder.png')
                
                # URL fallback
                if not item.get('itemWebUrl') and item.get('hubItemUrl'):
                    item['itemWebUrl'] = item['hubItemUrl']
            
            return raw_data
        else:
            return {"error": f"Search failed: {search_response.status_code}"}
    
    except Exception as e:
        return {"error": str(e)}

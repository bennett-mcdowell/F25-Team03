import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/apiService';
import Layout from '../components/Layout';
import OrderCard from '../components/OrderCard';
import '../styles/Orders.css';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get orders from API
      const response = await orderService.getOrders({ status: filter !== 'ALL' ? filter : undefined });
      
      // Transform API response to match frontend format
      const transformedOrders = response.orders.map(order => ({
        id: order.order_id,
        orderNumber: `ORD-${String(order.order_id).padStart(6, '0')}`,
        status: order.status,
        createdAt: order.created_at,
        driverId: order.driver_id,
        driverName: order.driver_name,
        sponsorId: order.sponsor_id,
        sponsorName: order.sponsor_name,
        totalPoints: order.total_points,
        items: order.items.map(item => ({
          productName: `Product ${item.product_id}`, // Will be enriched with actual product data
          productId: item.product_id,
          quantity: item.quantity,
          pointCost: item.points_per_item
        })),
        trackingNumber: order.tracking_number,
        note: order.notes
      }));
      
      setOrders(transformedOrders);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setError(null);
      const reason = 'Cancelled by user';
      
      await orderService.cancelOrder(orderId, reason);
      
      // Reload orders to get updated data
      await loadOrders();
      
      alert('Order cancelled successfully. Points have been refunded.');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setError(err.response?.data?.error || 'Failed to cancel order. Please try again.');
      alert(err.response?.data?.error || 'Failed to cancel order. Please try again.');
    }
  };

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      setError(null);
      await orderService.updateOrder(orderId, updates);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, ...updates }
          : order
      ));
      
      alert('Order updated successfully.');
    } catch (err) {
      console.error('Failed to update order:', err);
      setError(err.response?.data?.error || 'Failed to update order. Please try again.');
      alert(err.response?.data?.error || 'Failed to update order. Please try again.');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setError(null);
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // Reload orders to get updated data
      await loadOrders();
      
      alert(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError(err.response?.data?.error || 'Failed to update order status. Please try again.');
      alert(err.response?.data?.error || 'Failed to update order status. Please try again.');
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Filter by status
    if (filter !== 'ALL') {
      filtered = filtered.filter(order => order.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(term) ||
        order.driverName.toLowerCase().includes(term) ||
        order.sponsorName.toLowerCase().includes(term) ||
        order.items.some(item => item.productName.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'PENDING').length,
      processing: orders.filter(o => o.status === 'PROCESSING').length,
      shipped: orders.filter(o => o.status === 'SHIPPED').length,
      delivered: orders.filter(o => o.status === 'DELIVERED').length,
      cancelled: orders.filter(o => o.status === 'CANCELLED').length
    };
  };

  const stats = getOrderStats();

  // Update filter and reload orders
  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter);
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrders({ 
        status: newFilter !== 'ALL' ? newFilter : undefined 
      });
      
      const transformedOrders = response.orders.map(order => ({
        id: order.order_id,
        orderNumber: `ORD-${String(order.order_id).padStart(6, '0')}`,
        status: order.status,
        createdAt: order.created_at,
        driverId: order.driver_id,
        driverName: order.driver_name,
        sponsorId: order.sponsor_id,
        sponsorName: order.sponsor_name,
        totalPoints: order.total_points,
        items: order.items.map(item => ({
          productName: `Product ${item.product_id}`,
          productId: item.product_id,
          quantity: item.quantity,
          pointCost: item.points_per_item
        })),
        trackingNumber: order.tracking_number,
        note: order.notes
      }));
      
      setOrders(transformedOrders);
    } catch (err) {
      console.error('Failed to filter orders:', err);
      setError('Failed to filter orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="orders-page">
        <div className="orders-header">
          <h1>
            {user.role_name?.toLowerCase() === 'admin' && 'All Orders'}
            {user.role_name?.toLowerCase() === 'sponsor' && 'Driver Orders'}
            {user.role_name?.toLowerCase() === 'driver' && 'My Orders'}
          </h1>
          <p className="orders-subtitle">
            {user.role_name?.toLowerCase() === 'admin' && 'View and manage all orders across the system'}
            {user.role_name?.toLowerCase() === 'sponsor' && 'Track orders placed by your drivers'}
            {user.role_name?.toLowerCase() === 'driver' && 'View your purchase history and order status'}
          </p>
        </div>

        {error && (
          <div className="error-message" style={{ 
            padding: '1rem', 
            marginBottom: '1rem', 
            backgroundColor: '#fee', 
            color: '#c00',
            borderRadius: '4px',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}

        <div className="orders-stats">
          <div className="stat-card">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-card stat-pending">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
          <div className="stat-card stat-processing">
            <span className="stat-label">Processing</span>
            <span className="stat-value">{stats.processing}</span>
          </div>
          <div className="stat-card stat-shipped">
            <span className="stat-label">Shipped</span>
            <span className="stat-value">{stats.shipped}</span>
          </div>
          <div className="stat-card stat-delivered">
            <span className="stat-label">Delivered</span>
            <span className="stat-value">{stats.delivered}</span>
          </div>
          <div className="stat-card stat-cancelled">
            <span className="stat-label">Cancelled</span>
            <span className="stat-value">{stats.cancelled}</span>
          </div>
        </div>

        <div className="orders-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search orders by number, driver, sponsor, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <button 
              className={filter === 'ALL' ? 'active' : ''}
              onClick={() => handleFilterChange('ALL')}
            >
              All ({stats.total})
            </button>
            <button 
              className={filter === 'PENDING' ? 'active' : ''}
              onClick={() => handleFilterChange('PENDING')}
            >
              Pending ({stats.pending})
            </button>
            <button 
              className={filter === 'PROCESSING' ? 'active' : ''}
              onClick={() => handleFilterChange('PROCESSING')}
            >
              Processing ({stats.processing})
            </button>
            <button 
              className={filter === 'SHIPPED' ? 'active' : ''}
              onClick={() => handleFilterChange('SHIPPED')}
            >
              Shipped ({stats.shipped})
            </button>
            <button 
              className={filter === 'DELIVERED' ? 'active' : ''}
              onClick={() => handleFilterChange('DELIVERED')}
            >
              Delivered ({stats.delivered})
            </button>
            <button 
              className={filter === 'CANCELLED' ? 'active' : ''}
              onClick={() => handleFilterChange('CANCELLED')}
            >
              Cancelled ({stats.cancelled})
            </button>
          </div>
        </div>

        <div className="orders-list">
          {loading ? (
            <div className="loading-state">
              <p>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <p>No orders found</p>
              {searchTerm && (
                <button 
                  className="btn-secondary"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map(order => (
              <OrderCard 
                key={order.id}
                order={order}
                onCancel={handleCancelOrder}
                onUpdate={handleUpdateOrder}
                onUpdateStatus={handleUpdateStatus}
                userRole={user.role_name}
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
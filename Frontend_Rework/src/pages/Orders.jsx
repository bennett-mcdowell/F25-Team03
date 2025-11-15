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

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // TODO: In production, this would be: const data = await orderService.getOrders();
      // For now, using mock data
      const mockOrders = getMockOrders();
      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockOrders = () => {
    const baseOrders = [
      {
        id: 1,
        orderNumber: 'ORD-2025-001',
        status: 'DELIVERED',
        createdAt: '2025-11-10T14:30:00',
        driverId: 1,
        driverName: 'John Driver',
        sponsorId: 1,
        sponsorName: 'Tech Corp',
        totalPoints: 250,
        items: [
          { productName: 'Wireless Mouse', quantity: 1, pointCost: 150 },
          { productName: 'USB Cable', quantity: 2, pointCost: 50 }
        ],
        trackingNumber: 'TRK123456789',
        note: null
      },
      {
        id: 2,
        orderNumber: 'ORD-2025-002',
        status: 'PROCESSING',
        createdAt: '2025-11-12T09:15:00',
        driverId: 1,
        driverName: 'John Driver',
        sponsorId: 1,
        sponsorName: 'Tech Corp',
        totalPoints: 500,
        items: [
          { productName: 'Mechanical Keyboard', quantity: 1, pointCost: 500 }
        ],
        trackingNumber: null,
        note: 'Rush order - requested expedited shipping'
      },
      {
        id: 3,
        orderNumber: 'ORD-2025-003',
        status: 'PENDING',
        createdAt: '2025-11-14T11:00:00',
        driverId: 2,
        driverName: 'Jane Smith',
        sponsorId: 1,
        sponsorName: 'Tech Corp',
        totalPoints: 100,
        items: [
          { productName: 'Notebook Set', quantity: 1, pointCost: 100 }
        ],
        trackingNumber: null,
        note: null
      },
      {
        id: 4,
        orderNumber: 'ORD-2025-004',
        status: 'SHIPPED',
        createdAt: '2025-11-11T16:45:00',
        driverId: 3,
        driverName: 'Bob Wilson',
        sponsorId: 2,
        sponsorName: 'Retail Inc',
        totalPoints: 350,
        items: [
          { productName: 'Headphones', quantity: 1, pointCost: 300 },
          { productName: 'Phone Stand', quantity: 1, pointCost: 50 }
        ],
        trackingNumber: 'TRK987654321',
        note: null
      },
      {
        id: 5,
        orderNumber: 'ORD-2025-005',
        status: 'CANCELLED',
        createdAt: '2025-11-08T13:20:00',
        driverId: 1,
        driverName: 'John Driver',
        sponsorId: 1,
        sponsorName: 'Tech Corp',
        totalPoints: 200,
        items: [
          { productName: 'Coffee Mug', quantity: 2, pointCost: 100 }
        ],
        trackingNumber: null,
        note: 'Cancelled by driver - duplicate order'
      }
    ];

    // Filter based on user role
    if (user.role === 'driver') {
      return baseOrders.filter(order => order.driverId === user.id);
    } else if (user.role === 'sponsor') {
      return baseOrders.filter(order => order.sponsorId === user.id);
    }
    // Admin sees all orders
    return baseOrders;
  };

  const handleCancelOrder = async (orderId) => {
    try {
      // TODO: In production: await orderService.cancelOrder(orderId);
      console.log('Cancelling order:', orderId);
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: 'CANCELLED', note: 'Cancelled by user' }
          : order
      ));
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    }
  };

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      // In production: await orderService.updateOrder(orderId, updates);
      console.log('Updating order:', orderId, updates);
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, ...updates }
          : order
      ));
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('Failed to update order. Please try again.');
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

  return (
    <Layout>
      <div className="orders-page">
        <div className="orders-header">
          <h1>
            {user.role === 'admin' && 'All Orders'}
            {user.role === 'sponsor' && 'Driver Orders'}
            {user.role === 'driver' && 'My Orders'}
          </h1>
          <p className="orders-subtitle">
            {user.role === 'admin' && 'View and manage all orders across the system'}
            {user.role === 'sponsor' && 'Track orders placed by your drivers'}
            {user.role === 'driver' && 'View your purchase history and order status'}
          </p>
        </div>

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
            onClick={() => setFilter('ALL')}
          >
            All ({stats.total})
          </button>
          <button 
            className={filter === 'PENDING' ? 'active' : ''}
            onClick={() => setFilter('PENDING')}
          >
            Pending ({stats.pending})
          </button>
          <button 
            className={filter === 'PROCESSING' ? 'active' : ''}
            onClick={() => setFilter('PROCESSING')}
          >
            Processing ({stats.processing})
          </button>
          <button 
            className={filter === 'SHIPPED' ? 'active' : ''}
            onClick={() => setFilter('SHIPPED')}
          >
            Shipped ({stats.shipped})
          </button>
          <button 
            className={filter === 'DELIVERED' ? 'active' : ''}
            onClick={() => setFilter('DELIVERED')}
          >
            Delivered ({stats.delivered})
          </button>
          <button 
            className={filter === 'CANCELLED' ? 'active' : ''}
            onClick={() => setFilter('CANCELLED')}
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
              userRole={user.role}
            />
          ))
        )}
      </div>
      </div>
    </Layout>
  );
};

export default Orders;

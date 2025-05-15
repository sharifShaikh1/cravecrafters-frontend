import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

axios.defaults.baseURL = 'https://cravecrafters-backend.onrender.com';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setError('Login required');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        console.log('Orders fetched:', response.data);
        // Transform orders similar to admin approach
        const transformedOrders = response.data.map(order => {
          const transformedOrder = order.toObject ? order.toObject() : order;
          transformedOrder.items = transformedOrder.items.map(item => ({
            ...item,
            product: item.productId
              ? {
                  name: item.productId.name || 'Unknown',
                  price: item.productId.price || item.price,
                  image: item.productId.image || item.image,
                  description: item.productId.description || ''
                }
              : {
                  name: 'Unknown',
                  price: item.price,
                  image: item.image,
                  description: ''
                }
          }));
          return transformedOrder;
        });
        setOrders(transformedOrders);
        setLoading(false);

        const sessionId = searchParams.get('session_id');
        if (sessionId) {
          console.log('Found session_id, triggering success:', sessionId);
          await axios.get(`/api/payment/success?session_id=${encodeURIComponent(sessionId)}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          });
        }
        if (searchParams.get('success') === 'true') {
          toast.success('Payment successful! Order created.');
        }
      } catch (err) {
        console.error('Orders error:', err);
        setError('Failed to fetch orders: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, searchParams]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel order?')) return;
    try {
      const response = await axios.put(`/api/orders/cancel/${orderId}`, { status: 'cancelled' }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      console.log('Cancel response:', response.data);
      toast.success('Order cancelled');
      setOrders(orders.map(order => order._id === orderId ? { ...order, status: 'cancelled' } : order));
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error('Cancel failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">No orders</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          {orders.map(order => (
            <div key={order._id} className="mb-4 p-4 border-b">
              <h2 className="font-semibold">Order ID: {order._id}</h2>
              <p className="text-gray-600">Status: {order.status}</p>
              <p className="text-gray-600">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <h3 className="font-medium mt-2">Items:</h3>
              <ul className="list-disc pl-5">
                {order.items.map((item, index) => (
                  <li key={index} className="flex items-center space-x-4 mb-2">
                    <img src={item.product?.image || item.image || 'https://picsum.photos/50'} alt={item.product?.name || 'Product'} className="w-16 h-16 rounded" onError={(e) => { e.target.src = 'https://picsum.photos/50'; }} />
                    <div>
                      <p>{item.product?.name || 'Unknown'} - Qty: {item.quantity} - ₹{(item.product?.price || item.price || 0).toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <h3 className="font-medium mt-2">Address:</h3>
              <p>{order.address.street}</p>
              <p>{order.address.city}, {order.address.state} - {order.address.zip}</p>
              <p>{order.address.country}</p>
              {['Order Placed', 'Processing'].includes(order.status) && (
                <button onClick={() => handleCancelOrder(order._id)} className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Cancel</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;

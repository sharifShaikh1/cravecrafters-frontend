import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function AdminOrder() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null); // New state for product modal
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching admin orders');
      const response = await axios.get('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Admin orders response:', response.data);
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching admin orders:', err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.message : 'Failed to fetch orders');
      toast.error(err.response ? err.response.data.message : 'Failed to fetch orders');
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      console.log('Updating order status:', orderId, newStatus);
      const response = await axios.put(`/api/admin/orders/${orderId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Order updated:', response.data);
      setOrders(orders.map(order => order._id === orderId ? response.data : order));
      toast.success('Order status updated!');
    } catch (err) {
      console.error('Error updating order:', err.response ? err.response.data : err.message);
      toast.error(err.response ? err.response.data.message : 'Failed to update order');
    }
  };

  const openProductDetails = (item) => {
    setSelectedProduct(item);
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
  };

  if (loading) return <p className="text-center text-gray-700">Loading...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white/80 backdrop-blur-sm border-separate border-spacing-0 rounded-xl">
        <thead className="bg-gradient-to-r from-orange-200 to-yellow-200 sticky top-0">
          <tr>
            <th className="py-5 px-6 border-b-2 border-orange-300 text-center text-xl font-bold text-gray-800">Order ID</th>
            <th className="py-5 px-6 border-b-2 border-orange-300 text-center text-xl font-bold text-gray-800">Product Name</th>
            <th className="py-5 px-6 border-b-2 border-orange-300 text-center text-xl font-bold text-gray-800">Quantity</th>
            <th className="py-5 px-6 border-b-2 border-orange-300 text-center text-xl font-bold text-gray-800">Price</th>
            <th className="py-5 px-6 border-b-2 border-orange-300 text-center text-xl font-bold text-gray-800">Order Date</th>
            <th className="py-5 px-6 border-b-2 border-orange-300 text-center text-xl font-bold text-gray-800">Status</th>
            <th className="py-5 px-6 border-b-2 border-orange-300 text-center text-xl font-bold text-gray-800">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) =>
            order.items.map((item, itemIndex) => (
              <tr key={`${order._id}-${itemIndex}`} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white transition-colors'}>
                <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">{order._id}</td>
                <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">
                  <span
                    className="cursor-pointer text-blue-500 hover:underline"
                    onClick={() => openProductDetails(item)}
                  >
                    {item.product?.name || 'Unknown'}
                  </span>
                </td>
                <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">{item.quantity}</td>
                <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">₹{(item.price || 0).toFixed(2)}</td>
                <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">{order.status}</td>
                <td className="py-4 px-6 border-b border-gray-200 text-center">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    className="p-2 border rounded"
                  >
                    {['Order Placed', 'Processing', 'Shipped', 'Delivered', 'cancelled'].map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
            <h2 className="text-2xl font-bold mb-4">Product Details</h2>
            <div className="flex flex-col items-center">
              <img
                src={selectedProduct.product?.image || selectedProduct.image || 'https://picsum.photos/200'}
                alt={selectedProduct.product?.name || 'Unknown'}
                className="w-40 h-40 object-cover mb-4 rounded"
                onError={(e) => { e.target.src = 'https://picsum.photos/200'; }}
              />
              <p className="text-lg"><strong>Name:</strong> {selectedProduct.product?.name || 'Unknown'}</p>
              <p className="text-lg"><strong>Price:</strong> ₹{(selectedProduct.product?.price || selectedProduct.price || 0).toFixed(2)}</p>
              <p className="text-lg"><strong>Description:</strong> {selectedProduct.product?.description || 'No description'}</p>
            </div>
            <button
              onClick={closeProductDetails}
              className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrder;
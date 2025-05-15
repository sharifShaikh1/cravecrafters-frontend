import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Checkout from './Checkout';

function Cart() {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCart();
  }, [navigate]);

  const fetchCart = async () => {
    if (!token) {
      setError('Login required');
      toast.error('Login required');
      navigate('/login');
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.get('https://cravecrafters-backend.onrender.com/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setCart(data || { items: [] });
      setLoading(false);
    } catch (err) {
      console.error('Cart fetch error:', err);
      setError('Failed to fetch cart');
      toast.error('Cart fetch failed');
      setLoading(false);
    }
  };

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (!token || quantity < 0) return;
    try {
      const { data } = await axios.put('https://cravecrafters-backend.onrender.com/api/cart/update', { productId, quantity }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setCart(data || { items: [] });
      toast.success('Cart updated');
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Update failed');
      fetchCart();
    }
  }, [token, navigate]);

  const clearCart = async () => {
    if (!token) return;
    try {
      await axios.delete('https://cravecrafters-backend.onrender.com/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setCart({ items: [] });
      toast.success('Cart cleared');
    } catch (err) {
      console.error('Clear error:', err);
      toast.error('Clear failed');
    }
  };

  const handleCheckoutSuccess = () => {
    toast.success('Checkout done');
    navigate('/orders');
    fetchCart();
  };

  const total = cart.items.reduce((sum, item) => sum + (item.productId?.price || 0) * item.quantity, 0);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Cart</h1>
      {cart.items.length ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <ul className="divide-y divide-gray-200">
            {cart.items.map(item => (
              <li key={item.productId?._id} className="py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <img src={item.productId?.image || 'https://picsum.photos/50'} alt={item.productId?.name} className="w-16 h-16 rounded" />
                  <div>
                    <h3 className="font-semibold">{item.productId?.name || 'Unknown'}</h3>
                    <p>₹{(item.productId?.price || 0).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => updateQuantity(item.productId?._id, item.quantity - 1)} disabled={item.quantity <= 1} className="bg-gray-200 p-2 rounded">-</button>
                  <span className="w-10 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId?._id, item.quantity + 1)} className="bg-gray-200 p-2 rounded">+</button>
                  <button onClick={() => updateQuantity(item.productId?._id, 0)} className="bg-red-500 text-white p-2 rounded">Remove</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 text-right">
            <p className="text-xl font-bold">Total: ₹{total.toFixed(2)}</p>
            <div className="mt-4 space-x-4">
              <button onClick={clearCart} className="bg-gray-500 text-white px-4 py-2 rounded">Clear</button>
              <Checkout onCheckoutSuccess={handleCheckoutSuccess} />
            </div>
          </div>
        </div>
      ) : <p className="text-center">Empty cart</p>}
    </div>
  );
}

export default Cart;       

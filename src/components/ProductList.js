import { useState, useEffect } from 'react';
import api from './api';
import { toast } from 'react-toastify';
import ProductCard from './ProductCard'; // Import ProductCard

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log('Fetching products');
      const res = await api.get('/api/products'); // No token required for public access
      console.log('Products response:', res);

      if (!Array.isArray(res.data)) {
        console.error('Expected array, got:', res.data);
        throw new Error('Invalid products data format');
      }

      console.log('Products fetched:', res.data);
      setProducts(res.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.message : 'Failed to load products');
      toast.error(err.response ? err.response.data.message : 'Failed to load products');
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!token) {
      toast.error('Please log in to add to cart');
      return;
    }

    try {
      console.log('Adding to cart:', productId);
      await api.post('/api/cart', { productId, quantity: 1 }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Product added to cart!');
    } catch (err) {
      console.error('Error adding to cart:', err.response ? err.response.data : err.message);
      toast.error(err.response ? err.response.data.message : 'Error adding to cart');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Products</h2>
      {products.length === 0 ? (
        <p className="text-center text-gray-600">No products found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => {
            if (!product._id) {
              console.error('Product without _id:', product);
              return null;
            }
            return (
              <ProductCard
                key={product._id}
                product={product}
                addToCart={() => handleAddToCart(product._id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductList;
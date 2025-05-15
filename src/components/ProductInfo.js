import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

axios.defaults.baseURL = 'http://localhost:5000';

const ProductInfo = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        console.log('Fetching product with ID:', id);
        const response = await axios.get(`/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Product response (including description):', response.data); // Log to verify description
        setProduct(response.data);
        setSelectedImage(response.data.images[0]?.url || response.data.image);
      } catch (err) {
        console.error('Error fetching product:', err.response ? JSON.stringify(err.response.data) : err.message);
        setError(err.response ? err.response.data.message : 'Failed to fetch product');
        toast.error(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, token]);

  const handleImageHover = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
    setIsZoomed(true);
  };

  const handleImageLeave = () => {
    setIsZoomed(false);
  };

  const handleThumbnailClick = (url) => {
    setSelectedImage(url);
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

  if (loading) return <p className="text-center text-gray-700">Loading...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;
  if (!product) return <p className="text-center text-gray-700">Product not found</p>;

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl p-8 flex flex-col md:flex-row gap-8">
        {/* Image Section */}
        <div className="md:w-1/2 relative">
          <div className="w-full h-96 overflow-hidden rounded-lg">
            <img
              src={selectedImage || product.image}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-300"
              onMouseMove={handleImageHover}
              onMouseLeave={handleImageLeave}
            />
            {isZoomed && (
              <div
                className="absolute w-80 h-80 bg-white/90 rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  backgroundImage: `url(${selectedImage || product.image})`,
                  backgroundSize: '400%',
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
          </div>
          {/* Thumbnails */}
          <div className="flex gap-2 mt-4">
            {product.images.map((img, index) => (
              <img
                key={index}
                src={img.url}
                alt={`${product.name} thumbnail ${index + 1}`}
                className="w-20 h-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-blue-500"
                onClick={() => handleThumbnailClick(img.url)}
              />
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 space-y-4">
          <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
          <p className="text-gray-600 text-lg">Category: {product.category?.name || 'No Category'}</p>
          <p className="text-2xl font-bold text-green-600">₹{product.price}</p>
          <p className="text-gray-700 break-words max-h-32 overflow-y-auto">{product.description}</p> {/* Improved styling */}
          <p className="text-sm text-gray-500">Stock: {product.stock} available</p>
          <button
            onClick={() => alert('Add to Cart clicked!')} // Replace with actual cart logic
            disabled={product.stock === 0}
            className={`w-full py-3 rounded-lg font-semibold ${
              product.stock === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
            }`}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
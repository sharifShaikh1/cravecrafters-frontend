import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProductCard({ product, addToCart }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (!product || !product._id) {
      console.error('Product or product._id is missing:', product);
      return;
    }
    console.log('Navigating to product ID:', product._id);
    navigate(`/product/${product._id}`); // Navigate to product info page
  };

  return (
    <div
      className="border rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer"
      onClick={handleCardClick} // Trigger navigation on click
    >
      <img
        src={product.image || 'frontend/asset/Screenshot 2025-03-12 175457.png'}
        alt={product.name || 'Product Image'}
        className="w-full h-48  rounded object-scale-down"
      />
      <h3 className="text-lg font-semibold mt-2">{product.name || 'No Name'}</h3>
      <p className="text-gray-600">{product.category?.name || 'No Category'}</p>
      <p className="text-xl font-bold text-green-600">₹{product.price || 0}</p>
      <p className="text-sm text-gray-500">{product.description || 'No Description'}</p>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent navigation on button click
          if (product && addToCart) {
            addToCart(product);
            console.log('Added to cart:', product);
          } else {
            console.error('addToCart or product is undefined');
          }
        }}
        disabled={product?.stock === 0 || !product}
        className={`mt-2 w-full py-2 rounded ${
          product?.stock === 0 || !product ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {product?.stock === 0 || !product ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
}

export default ProductCard;
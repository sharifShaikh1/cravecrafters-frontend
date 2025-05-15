import { useEffect } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';

function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const results = state?.results || [];
  const message = state?.message || '';

  // Redirect to home on page reload if no state
  useEffect(() => {
    if (!state) {
      navigate('/', { replace: true }); // Use replace to avoid adding to history
    }
  }, [state, navigate]);

  // Immediate redirect if no state on initial render
  if (!state) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto p-6 mt-20">
      <h1 className="text-2xl font-bold mb-4">Search Results</h1>
      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {results.map(product => (
            <Link
              to={`/product/${product._id}`}
              key={product._id}
              className="border rounded-lg p-4 shadow-md block"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <h2 className="text-xl font-semibold mt-2">{product.name}</h2>
              <p className="text-gray-600">Price: ₹{product.price}</p>
              <p className="text-gray-600">Stock: {product.stock}</p>
              <p className="text-gray-600">Category: {product.category?.name || 'N/A'}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-red-600">{message}</p>
      )}
    </div>
  );
}

export default Search;
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to decode JWT (no external library)
  const getTokenData = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user; // { id, role }
    } catch (err) {
      console.error('Error decoding token:', err.message);
      return null;
    }
  };

  const tokenData = getTokenData();
  const isLoggedIn = !!tokenData;
  const role = tokenData?.role;

  // Fetch products and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        console.log('No token, skipping fetch');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/products', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/categories', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        console.log('Products fetched:', productsResponse.data);
        console.log('Categories fetched:', categoriesResponse.data);
        setProducts(productsResponse.data || []);
        setCategories(categoriesResponse.data || []);
      } catch (err) {
        console.error('Error fetching data:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleSearch = (e) => {
    if (e.type === 'click' || (e.type === 'keydown' && e.key === 'Enter')) {
      e.preventDefault();
      if (!searchQuery.trim() || loading) return;

      const query = searchQuery.trim().toLowerCase();
      const firstWord = query.split(' ')[0];

      // Match products by first word or full name
      const matchedProductsByName = products.filter(product => {
        const productName = product.name.toLowerCase();
        return productName.startsWith(firstWord) || productName.includes(query);
      });

      // Match category and get all products in that category
      const matchedCategory = categories.find(category =>
        category.name.toLowerCase() === query
      );
      const matchedProductsByCategory = matchedCategory
        ? products.filter(product => product.category?._id.toString() === matchedCategory._id.toString())
        : [];

      // Match products by price (simple range or exact match)
      const matchedProductsByPrice = products.filter(product => {
        const price = product.price;
        if (query.includes('-')) {
          const [min, max] = query.split('-').map(Number);
          if (min && max && !isNaN(min) && !isNaN(max)) {
            return price >= min && price <= max;
          }
        } else {
          const exactPrice = parseFloat(query);
          if (!isNaN(exactPrice)) {
            return Math.abs(price - exactPrice) < 1; // Allow slight variation
          }
        }
        return false;
      });

      let searchResults = [];
      if (matchedProductsByName.length > 0) searchResults = [...searchResults, ...matchedProductsByName];
      if (matchedProductsByCategory.length > 0) searchResults = [...searchResults, ...matchedProductsByCategory];
      if (matchedProductsByPrice.length > 0) searchResults = [...searchResults, ...matchedProductsByPrice];

      // Remove duplicates
      searchResults = Array.from(new Map(searchResults.map(p => [p._id.toString(), p])).values());

      console.log('Search query:', query, 'Results:', searchResults);

      if (searchResults.length > 0) {
        navigate('/search', { state: { results: searchResults } });
      } else {
        navigate('/search', { state: { results: [], message: 'No product found' } });
      }
      setSearchQuery(''); // Clear input after search
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md fixed top-0 left-0 w-full z-10">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          CraveCrafters
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <input
            type="text"
            placeholder="Search products or price (e.g., 100-500)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="p-2 rounded text-black w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSearch}
            className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-200 transition"
            disabled={loading}
          >
            Search
          </button>
        </form>

        {/* Navigation Links */}
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <Link to="/cart" className="hover:underline">
            Cart
          </Link>
          {isLoggedIn ? (
            <>
              <Link to="/profile" className="hover:underline">
                Profile
              </Link>
              <Link to="/orders" className="hover:underline">
                Orders
              </Link>
              {role === 'admin' && (
                <Link to="/admin" className="hover:underline">
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/user/login" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
                Login
              </Link>
              <Link to="/user/register" className="hover:underline">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
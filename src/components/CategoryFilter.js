import { useState, useEffect } from 'react';
import api from './api';

function CategoryFilter({ setCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories for filter');
        const response = await api.get('/api/categories');
        console.log('Categories fetched for filter:', response.data);

        if (!Array.isArray(response.data)) {
          console.error('Expected array for categories, got:', response.data);
          throw new Error('Invalid categories data format');
        }

        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err.response ? err.response.data : err.message);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="mb-4">
      <label className="mr-2">Filter by Category:</label>
      <select
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">All</option>
        {categories.map((category) => (
          <option key={category._id} value={category._id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CategoryFilter;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminOrders from './AdminOrders';

axios.defaults.baseURL = 'https://cravecrafters-backend.onrender.com';

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    category: '',
    images: [],
  });
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showManageProducts, setShowManageProducts] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      console.log('Token initialized:', token);
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Fetching products');
      const response = await axios.get('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Products response:', response.data);
      let productsData = response.data;
      if (productsData.products && Array.isArray(productsData.products)) {
        productsData = productsData.products;
      }
      if (!Array.isArray(productsData)) {
        console.error('Expected array for products, got:', productsData);
        throw new Error('Invalid products data format');
      }
      console.log('Products fetched:', productsData);
      setProducts(productsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err.response ? JSON.stringify(err.response.data) : err.message);
      setError(err.response ? err.response.data.message || err.message : 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories with URL:', `${axios.defaults.baseURL}/api/categories`);
      const response = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Categories response:', response.data);
      if (!Array.isArray(response.data)) {
        console.error('Expected array for categories, got:', response.data);
        throw new Error('Invalid categories data format');
      }
      console.log('Categories fetched:', response.data);
      setCategories(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err.response ? JSON.stringify(err.response.data) : err.message);
      setError(err.response ? err.response.data.message || err.message : 'Failed to fetch categories');
      toast.error(`Category fetch failed: ${err.message}`);
    }
  };

  const handleProductInput = (e) => {
    const { name, value } = e.target;
    setProductForm({ ...productForm, [name]: value });
  };

  const handleImageInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const imagePromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then(newImages => {
      setProductForm(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
      console.log('Updated images array:', [...prev.images, ...newImages]);
    }).catch(err => console.error('Error converting images:', err));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting product:', productForm);
      const response = await axios.post('/api/products', {
        name: productForm.name,
        price: productForm.price,
        description: productForm.description,
        stock: productForm.stock,
        category: productForm.category,
        images: productForm.images,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Product created:', response.data);
      setProducts([...products, response.data]);
      setProductForm({ name: '', price: '', description: '', stock: '', category: '', images: [] });
      setError(null);
      toast.success('Product added successfully!');
      await fetchProducts();
      setShowAddProduct(false);
    } catch (err) {
      console.error('Error creating product:', err.response ? JSON.stringify(err.response.data) : err.message);
      setError(err.response ? err.response.data.message : 'Failed to create product');
      toast.error(`Product creation failed: ${err.message}`);
    }
  };

  const handleCategoryInput = (e) => {
    setCategoryForm({ name: e.target.value });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting category:', categoryForm);
      const response = await axios.post('/api/categories', categoryForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Category created:', response.data);
      setCategories([...categories, response.data]);
      setCategoryForm({ name: '' });
      setError(null);
      toast.success('Category added successfully!');
      await fetchCategories();
    } catch (err) {
      console.error('Error creating category:', err.response ? JSON.stringify(err.response.data) : err.message);
      setError(err.response ? err.response.data.message : 'Failed to create category');
      toast.error(`Category creation failed: ${err.message || 'Server error'}`);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        console.log('Deleting product:', id);
        await axios.delete(`/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Product deleted:', id);
        setProducts(products.filter((product) => product._id !== id));
        setError(null);
      } catch (err) {
        console.error('Error deleting product:', err.response ? JSON.stringify(err.response.data) : err.message);
        setError(err.response ? err.response.data.message : 'Failed to delete product');
      }
    }
  };

  const removeImage = (index) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleEditProduct = (product) => {
    setEditProduct(product);
    setProductForm({
      name: product.name,
      price: product.price,
      description: product.description,
      stock: product.stock || '', // Handle undefined case
      category: product.category?._id || '',
      images: product.images.map(img => img.url) || [],
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const newStock = parseInt(productForm.stock);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Stock must be a valid non-negative number');
      return;
    }
    try {
      console.log('Updating product with form data:', productForm);
      console.log('Editing product ID:', editProduct._id);
      const response = await axios.put(`/api/products/${editProduct._id}`, {
        name: productForm.name,
        price: productForm.price,
        description: productForm.description,
        stock: newStock,
        category: productForm.category,
        images: productForm.images,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Product updated response:', JSON.stringify(response.data, null, 2));
      setProducts(products.map(p => p._id === editProduct._id ? response.data : p));
      setEditProduct(null);
      setProductForm({ name: '', price: '', description: '', stock: '', category: '', images: [] });
      setError(null);
      toast.success('Product updated successfully!');
      await fetchProducts(); // Refresh products list
    } catch (err) {
      console.error('Error updating product:', err.response ? JSON.stringify(err.response.data, null, 2) : err.message);
      setError(err.response ? err.response.data.message : 'Failed to update product');
      toast.error(`Product update failed: ${err.message}`);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchCategories();
    } else {
      setError('No authentication token found');
    }
  }, [token]);

  return (
    <div className="container mx-auto p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 mb-12 text-center animate-pulse-slow">
        Admin Panel
      </h1>
      {error && <p className="text-red-600 text-center mb-8 bg-red-100/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-red-200">{error}</p>}
      {loading && <p className="text-center text-gray-700 bg-gray-200/80 backdrop-blur-sm p-4 rounded-xl shadow-lg">Loading...</p>}

      {!showAddProduct && !showManageProducts && !showAddCategory && !showAllOrders && (
        <div className="flex justify-center gap-8 mb-12">
          <button
            onClick={() => setShowAddProduct(true)}
            className="bg-gradient-to-br from-blue-500 to-blue-700 text-white px-10 py-4 rounded-xl shadow-2xl hover:shadow-3xl hover:from-blue-600 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          >
            Add Product
          </button>
          <button
            onClick={() => {
              setShowManageProducts(true);
              fetchProducts();
            }}
            className="bg-gradient-to-br from-green-500 to-green-700 text-white px-10 py-4 rounded-xl shadow-2xl hover:shadow-3xl hover:from-green-600 hover:to-green-800 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          >
            Manage Products
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            className="bg-gradient-to-br from-purple-500 to-purple-700 text-white px-10 py-4 rounded-xl shadow-2xl hover:shadow-3xl hover:from-purple-600 hover:to-purple-800 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          >
            Add Category
          </button>
          <button
            onClick={() => setShowAllOrders(true)}
            className="bg-gradient-to-br from-orange-500 to-orange-700 text-white px-10 py-4 rounded-xl shadow-2xl hover:shadow-3xl hover:from-orange-600 hover:to-orange-800 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          >
            Manage Orders
          </button>
        </div>
      )}

      {showAddProduct && (
        <div className="bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-gray-200/50 glow-border">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Add Product
          </h2>
          <form onSubmit={handleProductSubmit} className="space-y-8">
            <div>
              <label className="block text-xl text-gray-700 mb-3 font-semibold">Name:</label>
              <input
                type="text"
                name="name"
                value={productForm.name}
                onChange={handleProductInput}
                required
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-300"
              />
            </div>
            <div>
              <label className="block text-xl text-gray-700 mb-3 font-semibold">Price:</label>
              <input
                type="number"
                name="price"
                value={productForm.price}
                onChange={handleProductInput}
                required
                min="0"
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-300"
              />
            </div>
            <div>
              <label className="block text-xl text-gray-700 mb-3 font-semibold">Description:</label>
              <textarea
                name="description"
                value={productForm.description}
                onChange={handleProductInput}
                required
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-300 h-32"
              />
            </div>
            <div>
              <label className="block text-xl text-gray-700 mb-3 font-semibold">Stock:</label>
              <input
                type="number"
                name="stock"
                value={productForm.stock}
                onChange={handleProductInput}
                required
                min="0"
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-300"
              />
            </div>
            <div>
              <label className="block text-xl text-gray-700 mb-3 font-semibold">Category:</label>
              <select
                name="category"
                value={productForm.category}
                onChange={handleProductInput}
                required
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-300"
              >
                <option value="">Select Category</option>
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No categories available</option>
                )}
              </select>
              {categories.length === 0 && (
                <p className="text-red-500 mt-2">No categories found. Please add a category first.</p>
              )}
            </div>
            <div>
              <label className="block text-xl text-gray-700 mb-3 font-semibold">Images:</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageInput}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 transition duration-300"
              />
              {productForm.images.length > 0 && (
                <div className="mt-6 grid grid-cols-5 gap-6">
                  <p className="text-lg text-gray-700 col-span-5">Selected Images:</p>
                  {productForm.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${index}`}
                        className="w-24 h-24 object-cover rounded-xl shadow-lg hover:shadow-xl transition-transform duration-300 transform group-hover:scale-105 cursor-pointer border-2 border-transparent group-hover:border-blue-300"
                        onClick={() => setSelectedImage(img)}
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-all duration-300"
                      >
                        X
                      </button>
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 mt-4 col-span-5">
                    Note: Select multiple images at once using slide method, or click again to add more.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center mt-8">
              <button
                type="submit"
                className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl shadow-2xl hover:shadow-3xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              >
                Add Product
              </button>
              <button
                type="button"
                onClick={() => setShowAddProduct(false)}
                className="bg-gradient-to-br from-gray-500 to-gray-600 text-white px-8 py-3 rounded-xl shadow-2xl hover:shadow-3xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddCategory && (
        <div className="bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-gray-200/50 glow-border">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-transparent bg-clip-text">
            Add Category
          </h2>
          <form onSubmit={handleCategorySubmit} className="space-y-8">
            <div>
              <label className="block text-xl text-gray-700 mb-3 font-semibold">Name:</label>
              <input
                type="text"
                name="name"
                value={categoryForm.name}
                onChange={handleCategoryInput}
                required
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition duration-300"
              />
            </div>
            <div className="flex justify-between items-center mt-8">
              <button
                type="submit"
                className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-xl shadow-2xl hover:shadow-3xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              >
                Add Category
              </button>
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="bg-gradient-to-br from-gray-500 to-gray-600 text-white px-8 py-3 rounded-xl shadow-2xl hover:shadow-3xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showManageProducts && (
        <div className="bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-gray-200/50 glow-border">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 bg-gradient-to-r from-green-600 to-teal-600 text-transparent bg-clip-text">
            Manage Products
          </h2>
          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white/80 backdrop-blur-sm border-separate border-spacing-0 rounded-xl">
                <thead className="bg-gradient-to-r from-green-200 to-teal-200 sticky top-0">
                  <tr>
                    <th className="py-5 px-6 border-b-2 border-green-300 text-center text-xl font-bold text-gray-800">Name</th>
                    <th className="py-5 px-6 border-b-2 border-green-300 text-center text-xl font-bold text-gray-800">Price</th>
                    <th className="py-5 px-6 border-b-2 border-green-300 text-center text-xl font-bold text-gray-800">Description</th>
                    <th className="py-5 px-6 border-b-2 border-green-300 text-center text-xl font-bold text-gray-800">Stock</th>
                    <th className="py-5 px-6 border-b-2 border-green-300 text-center text-xl font-bold text-gray-800">Category</th>
                    <th className="py-5 px-6 border-b-2 border-green-300 text-center text-xl font-bold text-gray-800">Image</th>
                    <th className="py-5 px-6 border-b-2 border-green-300 text-center text-xl font-bold text-gray-800">Creation Date</th>
                    <th className="py-5 px-6 border-b-2 border-green-300 text-center text-xl font-bold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={product._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white transition-colors'}>
                      <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">{product.name}</td>
                      <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">{product.price}</td>
                      <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">{product.description}</td>
                      <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">{product.stock}</td>
                      <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">
                        {product.category ? product.category.name : 'N/A'}
                      </td>
                      <td className="py-4 px-6 border-b border-gray-200 text-center">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover mx-auto rounded-xl shadow-md hover:shadow-lg transition-transform duration-300 transform hover:scale-110"
                        />
                      </td>
                      <td className="py-4 px-6 border-b border-gray-200 text-center text-gray-800">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 border-b border-gray-200 text-center">
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:bg-red-600 transition-all duration-300 mr-3"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:bg-yellow-600 transition-all duration-300"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !loading && <p className="text-center text-gray-700 bg-gray-200/80 backdrop-blur-sm p-6 rounded-xl shadow-lg mt-6">No products found</p>
          )}
          <button
            type="button"
            onClick={() => setShowManageProducts(false)}
            className="bg-gradient-to-br from-gray-500 to-gray-600 text-white px-10 py-4 rounded-xl shadow-2xl hover:shadow-3xl hover:from-gray-600 hover:to-gray-700 mt-8 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          >
            Back
          </button>
        </div>
      )}

      {showAllOrders && (
        <div className="bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-gray-200/50 glow-border">
          <h2 className="text-4xl font-bold text-gray-800 mb-8 bg-gradient-to-r from-orange-600 to-yellow-600 text-transparent bg-clip-text">
            Manage Orders
          </h2>
          <AdminOrders />
          <button
            type="button"
            onClick={() => setShowAllOrders(false)}
            className="bg-gradient-to-br from-gray-500 to-gray-600 text-white px-10 py-4 rounded-xl shadow-2xl hover:shadow-3xl hover:from-gray-600 hover:to-gray-700 mt-8 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          >
            Back
          </button>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50 glow-border" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Enlarged" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-lg" />
            <button
              onClick={() => setSelectedImage(null)}
              className="mt-6 bg-gradient-to-br from-red-500 to-red-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {editProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-gray-200/50 max-h-[90vh] w-11/12 max-w-md overflow-y-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 bg-gradient-to-r from-yellow-600 to-green-600 text-transparent bg-clip-text text-center">
              Edit Product
            </h2>
            <form onSubmit={handleUpdateProduct} className="space-y-6">
              <div>
                <label className="block text-lg text-gray-700 mb-2 font-semibold">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductInput}
                  required
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition duration-300"
                />
              </div>
              <div>
                <label className="block text-lg text-gray-700 mb-2 font-semibold">Price:</label>
                <input
                  type="number"
                  name="price"
                  value={productForm.price}
                  onChange={handleProductInput}
                  required
                  min="0"
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition duration-300"
                />
              </div>
              <div>
                <label className="block text-lg text-gray-700 mb-2 font-semibold">Description:</label>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleProductInput}
                  required
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition duration-300 h-24"
                />
              </div>
              <div>
                <label className="block text-lg text-gray-700 mb-2 font-semibold">Stock:</label>
                <input
                  type="number"
                  name="stock"
                  value={productForm.stock}
                  onChange={handleProductInput}
                  required
                  min="0"
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition duration-300"
                />
              </div>
              <div>
                <label className="block text-lg text-gray-700 mb-2 font-semibold">Category:</label>
                <select
                  name="category"
                  value={productForm.category}
                  onChange={handleProductInput}
                  required
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition duration-300"
                >
                  <option value="">Select Category</option>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No categories available</option>
                  )}
                </select>
                {categories.length === 0 && (
                  <p className="text-red-500 mt-2">No categories found. Please add a category first.</p>
                )}
              </div>
              <div>
                <label className="block text-lg text-gray-700 mb-2 font-semibold">Images:</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageInput}
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-yellow-500 transition duration-300"
                />
                {productForm.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <p className="text-md text-gray-700 col-span-3">Selected Images:</p>
                    {productForm.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Preview ${index}`}
                          className="w-20 h-20 object-cover rounded-xl shadow-md hover:shadow-lg transition-transform duration-300 transform group-hover:scale-105 cursor-pointer border-2 border-transparent group-hover:border-yellow-300"
                          onClick={() => setSelectedImage(img)}
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-all duration-300"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-6">
                <button
                  type="submit"
                  className="bg-gradient-to-br from-yellow-500 to-green-600 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg hover:from-yellow-600 hover:to-green-700 transition-all duration-300"
                >
                  Update Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditProduct(null);
                    setProductForm({ name: '', price: '', description: '', stock: '', category: '', images: [] });
                  }}
                  className="bg-gradient-to-br from-gray-500 to-gray-600 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

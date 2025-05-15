import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProductList from './components/ProductList';
import Cart from './components/Cart';
import UserLogin from './components/UserLogin';
import UserRegister from './components/UserRegister';
import Profile from './components/Profile';
import Orders from './components/Orders';
import AdminPanel from './components/AdminPanel';
import ProductInfo from './components/ProductInfo';
import Search from './components/Search';
import Footer from './components/Footer'; // Import Footer component

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <div className="container mx-auto p-4 pt-20 pb-20 flex-1"> {/* pt-20 for navbar, pb-20 for footer, flex-1 for scrollable content */}
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/user/login" element={<UserLogin />} />
            <Route path="/user/register" element={<UserRegister />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/product/:id" element={<ProductInfo />} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
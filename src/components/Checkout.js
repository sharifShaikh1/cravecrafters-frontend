import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm() {
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [sessionId, setSessionId] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (token) {
        try {
          const { data } = await axios.get('https://cravecrafters-backend.onrender.com/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          });
          setProfile(data);
        } catch (err) {
          console.error('Profile fetch error:', err);
          toast.error('Failed to fetch profile');
        }
      }
    };
    fetchProfile();
  }, [token]);

  useEffect(() => {
    const handleSessionCheck = () => {
      const id = searchParams.get('session_id') || new URLSearchParams(location.search).get('session_id');
      console.log('Session check:', { id, url: location.href, token });
      if (id && token && !sessionId) {
        setSessionId(id);
        handlePaymentSuccess(id);
      }
    };

    handleSessionCheck();
    const interval = setInterval(handleSessionCheck, 1000);
    window.addEventListener('popstate', handleSessionCheck);

    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handleSessionCheck);
    };
  }, [searchParams, token, navigate, location, sessionId]);

  const handlePaymentSuccess = async (id) => {
    if (!id) return;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt}, calling /success with:`, id);
        const response = await axios.get(`https://cravecrafters-backend.onrender.com/api/payment/success?session_id=${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        console.log('Success response:', response.data);
        if (response.data.redirectUrl) {
          navigate(response.data.redirectUrl); // Redirect after success
          toast.success('Checkout and stock update successful!');
          break;
        } else {
          toast.error('No redirect URL');
        }
      } catch (err) {
        console.error(`Attempt ${attempt} failed:`, err.response?.data || err.message);
        toast.error(`Error: ${err.response?.data?.message || err.message}`);
        if (err.response?.status === 400 && err.response?.data?.message.includes('address')) {
          navigate('/update-profile');
          break;
        }
        if (attempt === 3) toast.error('Max retries, contact support');
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Login required');
      navigate('/login');
      return;
    }

    if (!profile || !profile.username || !profile.address?.street) {
      toast.error('Please update your profile with username and address before checking out.');
      navigate('/profile');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('https://cravecrafters-backend.onrender.com/api/payment/create-checkout-session', {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      if (!data.id) throw new Error('No session ID');
      const stripe = await stripePromise;
      const result = await stripe.redirectToCheckout({ sessionId: data.id });
      if (result.error) throw new Error(result.error.message);
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>
      <button
        type="submit"
        disabled={loading || !profile?.username || !profile?.address?.street}
        className={`w-full py-2 rounded ${loading || !profile?.username || !profile?.address?.street ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      {sessionId && !loading && <button onClick={() => handlePaymentSuccess(sessionId)} className="mt-2 w-full bg-green-500 text-white py-2 rounded">Retry Now</button>}
    </form>
  );
}

function Checkout() {
  return <Elements stripe={stripePromise}><CheckoutForm /></Elements>;
}

export default Checkout;

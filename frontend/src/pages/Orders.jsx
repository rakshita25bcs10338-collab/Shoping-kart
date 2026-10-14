import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import OrderCard from "../components/OrderCard";
import { getOrders } from "../services/orderService";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await getOrders();
      setOrders(res.data.orders);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>

        {loading && <p className="text-gray-600">Loading your orders...</p>}

        {!loading && error && (
          <div className="mt-6 text-center">
            <p className="text-lg font-semibold mb-2">Unable to load your orders.</p>
            <button onClick={loadOrders} className="bg-black text-white px-4 py-2 rounded">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-10 text-center">
            <p className="text-lg font-semibold mb-3">You have not placed any orders yet.</p>
            <Link to="/products" className="inline-block bg-black text-white px-4 py-2 rounded">
              Start Shopping
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
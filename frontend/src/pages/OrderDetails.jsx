import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getOrderById } from "../services/orderService";

function OrderDetails({ success = false }) {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getOrderById(id);
      setOrder(res.data.order);
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 404 || status === 400
          ? "Order not found."
          : "Unable to load this order."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const address = order?.shippingAddress;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        {loading && <p className="text-gray-600">Loading order...</p>}

        {!loading && error && (
          <div className="text-center mt-6">
            <p className="text-lg font-semibold mb-2">{error}</p>
            <button onClick={loadOrder} className="bg-black text-white px-4 py-2 rounded mr-2">
              Try Again
            </button>
            <Link to="/orders" className="underline">My Orders</Link>
          </div>
        )}

        {!loading && !error && order && (
          <>
            {success ? (
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">✅</div>
                <h1 className="text-2xl font-bold">Order Placed Successfully</h1>
                <p className="text-gray-600">Your order has been saved successfully.</p>
              </div>
            ) : (
              <h1 className="text-2xl font-bold mb-4">Order Details</h1>
            )}

            <div className="bg-white rounded-xl shadow p-5 space-y-4">
              <div className="flex justify-between flex-wrap gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Order ID</p>
                  <p className="font-semibold break-all">{order._id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-semibold">{order.status}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment</p>
                  <p className="font-semibold">{order.paymentStatus}</p>
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                {order.items.map((item) => (
                  <div key={item._id} className="flex gap-3 items-center">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        ₹{item.price.toLocaleString("en-IN")} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-3">
                <span>Total</span>
                <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="border-t pt-3 text-sm">
                <p className="text-gray-500 mb-1">Shipping to</p>
                <p className="font-semibold">{address.fullName} ({address.phone})</p>
                <p>{address.addressLine1}, {address.city}, {address.state} - {address.pincode}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-center">
              <Link to="/orders" className="bg-black text-white px-4 py-2 rounded">
                View My Orders
              </Link>
              <Link to="/products" className="border border-black px-4 py-2 rounded">
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OrderDetails;
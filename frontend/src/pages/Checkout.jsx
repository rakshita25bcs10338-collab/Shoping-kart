import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { createPaymentOrder, verifyPayment } from "../services/orderService";
import { loadRazorpayScript } from "../utils/loadRazorpay";

const FIELDS = [
  { name: "fullName", label: "Full Name", type: "text" },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "addressLine1", label: "Address", type: "text" },
  { name: "city", label: "City", type: "text" },
  { name: "state", label: "State", type: "text" },
  { name: "pincode", label: "Pincode", type: "text" },
];

const EMPTY_FORM = {
  fullName: "", phone: "", addressLine1: "", city: "", state: "", pincode: "",
};

const validate = (form) => {
  const errors = {};
  FIELDS.forEach(({ name, label }) => {
    if (!form[name].trim()) errors[name] = `${label} is required.`;
  });
  if (!errors.phone && !/^\d{10}$/.test(form.phone.trim())) {
    errors.phone = "Phone must be a valid 10-digit number.";
  }
  if (!errors.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
    errors.pincode = "Pincode must contain 6 digits.";
  }
  return errors;
};

function Checkout() {
  const { cartItems, loading, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (placing) return;
    setServerError("");

    // client-side validation: no backend call if this fails
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setPlacing(true);

    const shippingAddress = {};
    Object.keys(form).forEach((key) => {
      shippingAddress[key] = form[key].trim();
    });

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setServerError("Could not load the payment window. Check your internet and try again.");
        setPlacing(false);
        return;
      }

      // backend checks cart + stock, calculates the total, creates the Razorpay order
      const res = await createPaymentOrder(shippingAddress);
      const data = res.data;

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart Order",
        order_id: data.razorpayOrderId,

        // runs after the user pays. We do NOT trust it yet, the backend verifies it
        handler: async (response) => {
          try {
            await verifyPayment({
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart(); // backend cleared the cart, so clear the shared frontend state too
            navigate(`/order-success/${data.shopKartOrderId}`);
          } catch (err) {
            setServerError(
              err.response?.data?.message ||
                "Payment could not be verified. Your cart has not been cleared."
            );
            setPlacing(false);
          }
        },

        prefill: { name: shippingAddress.fullName, contact: shippingAddress.phone },

        // user closed the payment window without paying
        modal: { ondismiss: () => setPlacing(false) },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", () => {
        setServerError("Payment failed. Your cart has not been cleared. Please try again.");
        setPlacing(false);
      });

      razorpay.open();
    } catch (err) {
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>

        {loading && <p className="text-gray-600">Loading your cart...</p>}

        {!loading && cartItems.length === 0 && (
          <div className="mt-10 text-center">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="text-gray-600 mb-4">Add something before checking out.</p>
            <Link to="/products" className="inline-block bg-black text-white px-4 py-2 rounded">
              Browse Products
            </Link>
          </div>
        )}

        {!loading && cartItems.length > 0 && (
          <form onSubmit={handlePlaceOrder} noValidate className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-xl shadow p-5 space-y-4">
              <h2 className="text-xl font-bold">Shipping Details</h2>

              {FIELDS.map(({ name, label, type }) => (
                <div key={name}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type={type}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                  />
                  {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow p-5 h-fit space-y-2">
              <h2 className="text-xl font-bold mb-2">Order Summary</h2>

              {cartItems.map((item) => (
                <div key={item.product._id} className="flex justify-between text-sm">
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}

              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

              <button
                type="submit"
                disabled={placing}
                className="w-full bg-black text-white py-2 rounded mt-2 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {placing ? "Processing..." : "Place Order & Pay"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Checkout;
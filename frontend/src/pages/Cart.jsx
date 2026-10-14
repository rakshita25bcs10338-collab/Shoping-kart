import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";

function Cart() {
  const { cartItems, loading, error, refreshCart, cartCount, subtotal } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">My Cart</h1>

        {loading && <p className="text-gray-600">Loading your cart...</p>}

        {!loading && error && (
          <div className="mt-6 text-center">
            <p className="text-lg font-semibold mb-2">Unable to load your cart.</p>
            <button onClick={refreshCart} className="bg-black text-white px-4 py-2 rounded">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && cartItems.length === 0 && (
          <div className="mt-10 text-center">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="text-gray-600 mb-4">Looks like you haven't added anything yet.</p>
            <Link to="/products" className="inline-block bg-black text-white px-4 py-2 rounded">
              Browse Products
            </Link>
          </div>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}
            </div>

            <div className="bg-white rounded-xl shadow p-5 h-fit space-y-2">
              <h2 className="text-xl font-bold mb-2">Order Summary</h2>
              <div className="flex justify-between">
                <span>Items</span>
                <span>{cartCount}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <Link
                to="/checkout"
                className="block text-center w-full bg-black text-white py-2 rounded mt-3 hover:bg-gray-800"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
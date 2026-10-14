import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function Navbar() {
  const navigate = useNavigate();
  const { cartCount, clearCart } = useCart();

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");
    } finally {
      clearCart(); // so the next person who logs in doesn't see this cart count
      navigate("/login");
    }
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-white shadow-sm">
      <div className="flex items-center gap-6">
        <Link to="/home" className="font-bold text-lg">ShopKart</Link>
        <Link to="/home" className="text-gray-600 hover:text-black">Home</Link>
        <Link to="/products" className="text-gray-600 hover:text-black">Products</Link>
        <Link to="/wishlist" className="text-gray-600 hover:text-black">Wishlist</Link>
        <Link to="/cart" className="text-gray-600 hover:text-black">Cart ({cartCount})</Link>
        <Link to="/orders" className="text-gray-600 hover:text-black">Orders</Link>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </nav>
  );
}

export default Navbar;
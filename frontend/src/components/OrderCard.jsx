import { Link } from "react-router-dom";

function OrderCard({ order }) {
  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold">Order #{order._id.slice(-8)}</p>
          <p className="text-gray-500 text-sm">{date}</p>
        </div>
        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">
          {order.status}
        </span>
      </div>

      <div className="mt-3 text-sm text-gray-700 space-y-1">
        {order.items.map((item) => (
          <p key={item._id}>{item.name} × {item.quantity}</p>
        ))}
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="font-bold">Total: ₹{order.totalAmount.toLocaleString("en-IN")}</p>
        <Link
          to={`/orders/${order._id}`}
          className="bg-black text-white px-4 py-2 rounded text-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

export default OrderCard;
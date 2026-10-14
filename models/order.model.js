import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },

        // snapshot of what was bought, at the price it was bought for
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                name: { type: String, required: true },
                price: { type: Number, required: true },
                quantity: { type: Number, required: true },
                image: { type: String },
            },
        ],

        shippingAddress: {
            fullName: String,
            phone: String,
            addressLine1: String,
            city: String,
            state: String,
            pincode: String,
        },

        totalAmount: { type: Number, required: true },

        paymentStatus: {
            type: String,
            enum: ['PENDING', 'PAID', 'FAILED'],
            default: 'PENDING',
        },

        status: {
            type: String,
            enum: ['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'],
            default: 'PENDING_PAYMENT',
        },

        razorpayOrderId: String,
        razorpayPaymentId: String,
    },
    { timestamps: true }
)

const Order = mongoose.model('Order', orderSchema)

export default Order
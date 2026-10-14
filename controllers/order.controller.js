import crypto from 'crypto'
import razorpay from '../config/razorpay.js'
import Customer from '../models/customer.model.js'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'

const isValidId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)

// checks the shipping address on the server too (never trust the frontend alone)
const validateShipping = (address) => {
    if (!address || typeof address !== 'object') {
        return { error: 'Shipping address is required' }
    }

    const fields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode']
    const clean = {}

    for (const field of fields) {
        const value = typeof address[field] === 'string' ? address[field].trim() : ''
        if (!value) return { error: `${field} is required` }
        clean[field] = value
    }

    if (!/^\d{10}$/.test(clean.phone)) {
        return { error: 'Phone must be a valid 10-digit number' }
    }
    if (!/^\d{6}$/.test(clean.pincode)) {
        return { error: 'Pincode must contain 6 digits' }
    }

    return { address: clean }
}

// POST /orders/create-payment-order
export const createPaymentOrder = async (req, res) => {
    try {
        const { error, address } = validateShipping(req.body.shippingAddress)
        if (error) {
            return res.status(400).json({ success: false, message: error })
        }

        // load the cart with the LATEST product data (price, stock)
        const customer = await Customer.findById(req.user._id).populate('cart.product')

        if (customer.cart.length === 0) {
            return res.status(400).json({ success: false, message: 'Your cart is empty' })
        }

        const items = []
        let totalAmount = 0

        for (const cartItem of customer.cart) {
            const product = cartItem.product

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: 'A product in your cart is no longer available. Please remove it and try again.',
                })
            }

            if (cartItem.quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`,
                })
            }

            items.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                image: product.image,
            })

            // total is calculated by the server, never taken from the frontend
            totalAmount += product.price * cartItem.quantity
        }

        const order = await Order.create({
            user: req.user._id,
            items,
            shippingAddress: address,
            totalAmount,
        })

        let razorpayOrder
        try {
            razorpayOrder = await razorpay.orders.create({
                amount: Math.round(totalAmount * 100), // rupees -> paise
                currency: 'INR',
                receipt: order._id.toString(),
            })
        } catch (err) {
            console.log('Razorpay order creation failed:', err.error || err.message)
            await Order.findByIdAndDelete(order._id) // no half-made order left behind
            return res.status(502).json({
                success: false,
                message: 'Could not start the payment. Please try again.',
            })
        }

        order.razorpayOrderId = razorpayOrder.id
        await order.save()

        // the cart is NOT cleared here, only after the payment is verified
        res.status(201).json({
            success: true,
            shopKartOrderId: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID, // the Key ID is safe to share; the secret never leaves the server
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

// POST /orders/verify-payment
export const verifyPayment = async (req, res) => {
    try {
        const {
            shopKartOrderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body

        if (!isValidId(shopKartOrderId)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' })
        }
        if (!razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment details are missing' })
        }

        // the order must belong to the logged-in user
        const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id })
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' })
        }

        // already confirmed, so just return it (safe to call twice)
        if (order.paymentStatus === 'PAID') {
            return res.status(200).json({ success: true, message: 'Order already confirmed', order })
        }

        if (!order.razorpayOrderId) {
            return res.status(400).json({ success: false, message: 'No payment was started for this order' })
        }

        // the browser's order id must match the one we stored
        if (razorpay_order_id && razorpay_order_id !== order.razorpayOrderId) {
            return res.status(400).json({ success: false, message: 'Payment does not match this order' })
        }

        // signature = HMAC_SHA256(razorpayOrderId + "|" + paymentId) using the secret
        // we use the order id stored in OUR database, not the one sent by the browser
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(order.razorpayOrderId + '|' + razorpay_payment_id)
            .digest('hex')

        const expected = Buffer.from(expectedSignature)
        const received = Buffer.from(String(razorpay_signature))

        const signatureIsValid =
            expected.length === received.length && crypto.timingSafeEqual(expected, received)

        if (!signatureIsValid) {
            // order stays pending, cart stays untouched
            return res.status(400).json({ success: false, message: 'Invalid payment signature' })
        }

        order.paymentStatus = 'PAID'
        order.status = 'PLACED'
        order.razorpayPaymentId = razorpay_payment_id
        await order.save()

        // reduce stock for each purchased item (never below zero)
        for (const item of order.items) {
            await Product.updateOne(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } }
            )
        }

        // payment verified, so now the cart can be cleared
        await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } })

        res.status(200).json({ success: true, message: 'Payment verified, order placed', order })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

// GET /orders
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id, paymentStatus: 'PAID' })
            .sort({ createdAt: -1 })

        res.status(200).json({ success: true, count: orders.length, orders })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
}

// GET /orders/:id
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' })
        }

        // searching by BOTH id and user means nobody can open someone else's order
        const order = await Order.findOne({ _id: id, user: req.user._id })
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' })
        }

        res.status(200).json({ success: true, order })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' })
    }
}
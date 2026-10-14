import express from 'express'
import authMiddleware from '../middlewares/auth.middleware.js'
import {
    createPaymentOrder,
    verifyPayment,
    getMyOrders,
    getOrderById,
} from '../controllers/order.controller.js'

const router = express.Router()

router.use(authMiddleware) // every order route needs a logged-in user

router.post('/create-payment-order', createPaymentOrder)
router.post('/verify-payment', verifyPayment)
router.get('/', getMyOrders)
router.get('/:id', getOrderById)

export default router
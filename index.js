import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import customerRoutes from './routes/customer.routes.js'
import productRoutes from './routes/product.routes.js'
import wishlistRoutes from './routes/wishlist.routes.js'
import cartRoutes from './routes/cart.routes.js' 
import orderRoutes from './routes/order.routes.js'

dotenv.config()

const app = express()
const port = 8006

app.use(cors({
    origin: (origin, callback) => {
        console.log("Incoming origin:", origin)
        if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

mongoose.connect(process.env.dbUrl).then(() => {
    console.log("Connected to MongoDB")
}).catch((err) => {
    console.log("MongoDB connection error:", err)
})

app.get('/', (req, res) => {
    res.send('ShopKart server is running')
})

app.use('/customers', customerRoutes)
app.use('/products', productRoutes)
app.use('/wishlist', wishlistRoutes)
app.use('/cart', cartRoutes)    
app.use('/orders', orderRoutes)
app.listen(port, () => {
    console.log(`Server started at port ${port}`)
})
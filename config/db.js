import mongoose from "mongoose";

let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
    
    if (cached.conn) {
        return cached.conn
    } 

    if (!cached.promise) {
        // Use the same database as lib/db.js to avoid connection conflicts
        cached.promise = mongoose.connect(process.env.MONGODB_URI).then( mongoose => {
            return mongoose
        })
    } 

    cached.conn = await cached.promise
    return cached.conn
}

export default connectDB
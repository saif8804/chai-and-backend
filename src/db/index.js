import mongoose from "mongoose";
import {DB_NAME} from "../constant.js"

const connectDB = async() => {
     try {
      const connectionInstance =   await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      console.log(`\n MongoDB connected !! DB HOST :  ${connectionInstance.connection.host}`)
      process.exit(1)
     } catch (error) {
        console.log("MongoDB connection error:", error.message)
     }
}


export default connectDB;
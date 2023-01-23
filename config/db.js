import mongoose from 'mongoose';
import dotenv from 'dotenv';

const connectDB = async () => {

    dotenv.config();

    try {
        mongoose.set('strictQuery', false);
        const connection = await mongoose.connect(
            process.env.MONGO_URI,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );

        const url = `${connection.connection.host}:${connection.connection.port}`;
        console.log(`MongoDB conectado en: ${url}`);
    } catch (error) {
        console.error(`error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;
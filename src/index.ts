import express from 'express';
import userRoutes from './routes/userRoute';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/user', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Service running on port ${PORT}`);
});

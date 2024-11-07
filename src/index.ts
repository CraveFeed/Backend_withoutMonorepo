import express from 'express';
import userRoutes from './routes/userRoute';
import emailVerificationRoutes from './routes/emailVerification';

const app = express();
app.use(express.json());

app.use('/', emailVerificationRoutes);
app.use('/user', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Service running on port ${PORT}`);
});

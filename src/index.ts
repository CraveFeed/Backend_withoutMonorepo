import express from 'express';
import userRoutes from './routes/userRoute';
import emailVerificationRoutes from './routes/emailVerification';
import chatRoutes from './routes/chatRoutes';
import {initializeChatSocket} from "./loaders/webSockets/chatSocket";
import {authenticateUser} from "./middlewares/authMiddleware";

const app = express();
app.use(express.json());

app.use('/', emailVerificationRoutes);
app.use('/user', userRoutes);
app.use(authenticateUser);
app.use('/chat', chatRoutes);

initializeChatSocket(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Service running on port ${PORT}`);
});

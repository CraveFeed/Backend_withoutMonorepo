import express from 'express';
import authRoutes from './routes/authRoute';
import emailVerificationRoutes from './routes/emailVerification';
import businessRoutes from './routes/businessRoutes';
import {initializeChatSocket} from "./loaders/webSockets/chatSocket";
import {authenticateUser} from "./middlewares/authMiddleware";
import userRoutes from "./routes/userRoutes";
import {afterBusinessMiddleware} from "./middlewares/afterBusinessMiddleware";
import notificationRoutes from "./routes/notificationRoutes";
import publicRoutes from "./routes/publicRoutes";
import http from 'http';
import s3Routes from "./routes/s3Routes";
import {initializeKafkaConsumer} from "./loaders/kafka/consumerHandler";

const app = express();
const server = http.createServer(app);
app.use(express.json());

app.use('/email', emailVerificationRoutes)
app.use('/auth', authRoutes)
app.use('/public', publicRoutes)
app.use(authenticateUser);
app.use('/user', userRoutes);
app.use('/s3', s3Routes)
app.use('/notification', notificationRoutes);
app.use(afterBusinessMiddleware);
app.use('/restaurant', businessRoutes);

const wss = initializeChatSocket(server);
initializeKafkaConsumer(wss);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`API Service and WebSocket running on port ${PORT}`);
});
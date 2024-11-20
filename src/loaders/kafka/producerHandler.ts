import kafka from "./kafkaHandler";
import dotenv from "dotenv";
import { NotificationMessage } from "../../interfaces/chatMessage";

dotenv.config();

const producer = kafka.producer();
const kafka_topic = process.env.KAFKA_TOPIC as string;

export const produceNotification = async (notification: NotificationMessage) => {
    try {
        await producer.connect();
        await producer.send({
            topic: kafka_topic,
            messages: [{
                key: notification.receiverId,
                value: JSON.stringify(notification)
            }],
        });
    } catch (error) {
        console.error("Producer error:", error);
    } finally {
        await producer.disconnect();
    }
};

export default produceNotification;
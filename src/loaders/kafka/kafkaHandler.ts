import {Kafka} from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID as string,
    brokers: ['localhost:9092']
})

export default kafka;
import {Kafka} from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID as string,
    brokers: (process.env.KAFKA_BROKERS as string || 'localhost:9092').split(',')
});

export default kafka;
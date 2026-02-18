import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "joblensai",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer();
let isConnected = false;

export const sendMessage = async (topic: string, message: any) => {
  try {
    if (!isConnected) {
      await producer.connect();
      isConnected = true;
    }
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  } catch (error) {
    console.error("❌ Kafka send failed:", error);
    isConnected = false;
    throw error;
  }
};

export const createConsumer = (groupId: string) => {
  return kafka.consumer({ groupId });
};

export const KAFKA_TOPICS = {
  NOTIFICATION_EMAIL: "notification.email",
} as const;

export const disconnectProducer = async () => {
  try {
    if (isConnected) {
      await producer.disconnect();
      isConnected = false;
      console.log("Kafka disconnected successfully");
    }
  } catch (error) {
    console.error("❌ Kafka disconnect failed:", error);
    isConnected = false;
    throw error;
  }
};

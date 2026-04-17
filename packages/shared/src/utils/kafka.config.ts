import { Kafka } from "kafkajs";

// KAFKA_BROKERS — comma-separated list, e.g. "kafka.joblensai:9092"
// (ECS Cloud Map FQDN) or "kafka:9092" (Docker compose / local k8s).
export const kafka = new Kafka({
  clientId: "joblensai",
  brokers: (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
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
// Create topics before kafka starts, only required in dev env
export const ensureTopicExists = async (topic: string) => {
  const admin = kafka.admin();
  try {
    await admin.connect();
    const existingTopics = await admin.listTopics();
    if (existingTopics.includes(KAFKA_TOPICS.NOTIFICATION_EMAIL)) {
      await admin.disconnect();
      return;
    }

    await admin.createTopics({
      topics: [
        {
          topic,
          numPartitions: 1,
          replicationFactor: 1,
        },
      ],
    });

    await admin.disconnect();
    console.log("✅ Kafka topics created");
  } catch (error) {
    console.log("Error inside ensureTopicExists", error);
    await admin.disconnect();
  }
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

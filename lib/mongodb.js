import { MongoClient } from "mongodb";

const options = {};

function getClientPromise() {
  if (!global._mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set");
    }
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

export default getClientPromise;

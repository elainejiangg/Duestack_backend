#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env
/**
 * Script to clear all collections from the database
 * This will reset your database to a clean state
 */

import "jsr:@std/dotenv/load";
import { MongoClient } from "npm:mongodb";

async function clearDatabase() {
  const MONGODB_URL = Deno.env.get("MONGODB_URL");
  const DB_NAME = Deno.env.get("DB_NAME");

  if (!MONGODB_URL || !DB_NAME) {
    console.error("❌ Missing MONGODB_URL or DB_NAME in .env file");
    Deno.exit(1);
  }

  console.log("🔌 Connecting to MongoDB...");
  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(DB_NAME);

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Found ${collections.length} collections`);

    // Drop each collection
    for (const collection of collections) {
      console.log(`   Dropping: ${collection.name}...`);
      await db.collection(collection.name).drop();
    }

    console.log("\n✅ Database cleared successfully!");
    console.log(
      "\n🔄 Now restart your backend server and try registering again."
    );
  } catch (error) {
    console.error("❌ Error:", error);
    Deno.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

clearDatabase();

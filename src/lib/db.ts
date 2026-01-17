import mongoose from "mongoose";

interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI && process.env.NODE_ENV === "production") {
  console.warn("MONGODB_URI not defined - database features will be disabled");
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<mongoose.Mongoose | null> {
  if (!MONGODB_URI) {
    console.warn("No MONGODB_URI - skipping database connection");
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Project Schema
const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    productUrl: { type: String },
    manifest: { type: mongoose.Schema.Types.Mixed },
    chatHistory: [
      {
        role: { type: String, enum: ["user", "assistant", "system"] },
        content: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["idle", "generating", "ready", "error"],
      default: "idle",
    },
  },
  {
    timestamps: true,
  }
);

export const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

// Video Render Schema (for tracking render jobs)
const renderSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    status: {
      type: String,
      enum: ["queued", "rendering", "completed", "failed"],
      default: "queued",
    },
    outputUrl: { type: String },
    error: { type: String },
    progress: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Render =
  mongoose.models.Render || mongoose.model("Render", renderSchema);

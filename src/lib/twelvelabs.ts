import type { VideoIndex, VideoSegment } from "./types";

const TWELVELABS_API_KEY = process.env.TWELVELABS_API_KEY || "";
const TWELVELABS_API_URL = "https://api.twelvelabs.io/v1.2";

// Default index ID - create one in TwelveLabs dashboard
const DEFAULT_INDEX_ID = process.env.TWELVELABS_INDEX_ID || "";

interface TwelveLabsTask {
  _id: string;
  status: "pending" | "indexing" | "ready" | "failed";
  video_id?: string;
}

interface TwelveLabsSearchResult {
  data: Array<{
    start: number;
    end: number;
    confidence: number;
    text?: string;
    thumbnail_url?: string;
  }>;
}

interface TwelveLabsVideo {
  _id: string;
  metadata: {
    duration: number;
    filename: string;
  };
}

// Check if TwelveLabs is configured
export function isTwelveLabsConfigured(): boolean {
  return Boolean(TWELVELABS_API_KEY && DEFAULT_INDEX_ID);
}

// Index a video from URL
export async function indexVideo(videoUrl: string): Promise<{
  taskId: string;
  videoId?: string;
}> {
  if (!isTwelveLabsConfigured()) {
    throw new Error("TwelveLabs API not configured. Set TWELVELABS_API_KEY and TWELVELABS_INDEX_ID.");
  }

  const response = await fetch(`${TWELVELABS_API_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TWELVELABS_API_KEY,
    },
    body: JSON.stringify({
      index_id: DEFAULT_INDEX_ID,
      url: videoUrl,
      transcription: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to index video: ${error}`);
  }

  const data = await response.json();
  return {
    taskId: data._id,
    videoId: data.video_id,
  };
}

// Check indexing task status
export async function getTaskStatus(taskId: string): Promise<TwelveLabsTask> {
  if (!isTwelveLabsConfigured()) {
    throw new Error("TwelveLabs API not configured");
  }

  const response = await fetch(`${TWELVELABS_API_URL}/tasks/${taskId}`, {
    headers: {
      "x-api-key": TWELVELABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get task status: ${response.status}`);
  }

  return response.json();
}

// Wait for indexing to complete
export async function waitForIndexing(
  taskId: string,
  maxWaitMs: number = 300000,
  pollIntervalMs: number = 5000
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const task = await getTaskStatus(taskId);

    if (task.status === "ready" && task.video_id) {
      return task.video_id;
    }

    if (task.status === "failed") {
      throw new Error("Video indexing failed");
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("Indexing timeout exceeded");
}

// Search video for specific content
export async function searchVideo(
  videoId: string,
  query: string
): Promise<VideoSegment[]> {
  if (!isTwelveLabsConfigured()) {
    throw new Error("TwelveLabs API not configured");
  }

  const response = await fetch(`${TWELVELABS_API_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": TWELVELABS_API_KEY,
    },
    body: JSON.stringify({
      index_id: DEFAULT_INDEX_ID,
      query,
      search_options: ["visual", "conversation", "text_in_video"],
      filter: {
        id: [videoId],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Search failed: ${error}`);
  }

  const data: TwelveLabsSearchResult = await response.json();

  return data.data.map((result) => ({
    label: query,
    startTime: result.start,
    endTime: result.end,
    confidence: result.confidence,
    thumbnailUrl: result.thumbnail_url,
  }));
}

// Find multiple segments by labels
export async function findSegments(
  videoId: string,
  labels: string[]
): Promise<VideoSegment[]> {
  const allSegments: VideoSegment[] = [];

  for (const label of labels) {
    try {
      const segments = await searchVideo(videoId, label);
      // Take the highest confidence match for each label
      if (segments.length > 0) {
        const bestMatch = segments.reduce((best, current) =>
          (current.confidence || 0) > (best.confidence || 0) ? current : best
        );
        allSegments.push({
          ...bestMatch,
          label, // Override with our label
        });
      }
    } catch (error) {
      console.error(`Failed to find segment for "${label}":`, error);
    }
  }

  // Sort by start time
  return allSegments.sort((a, b) => a.startTime - b.startTime);
}

// Get video details
export async function getVideoDetails(videoId: string): Promise<TwelveLabsVideo> {
  if (!isTwelveLabsConfigured()) {
    throw new Error("TwelveLabs API not configured");
  }

  const response = await fetch(
    `${TWELVELABS_API_URL}/indexes/${DEFAULT_INDEX_ID}/videos/${videoId}`,
    {
      headers: {
        "x-api-key": TWELVELABS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get video details: ${response.status}`);
  }

  return response.json();
}

// Create a complete video index with segment detection
export async function createVideoIndex(
  videoUrl: string,
  segmentLabels: string[] = [
    "Product Close-up",
    "Unboxing",
    "Human Interaction",
    "Wide Shot",
    "Detail Shot",
    "Product in Use",
  ]
): Promise<VideoIndex> {
  // Start indexing
  const { taskId } = await indexVideo(videoUrl);

  // Wait for completion
  const videoId = await waitForIndexing(taskId);

  // Get video details
  const videoDetails = await getVideoDetails(videoId);

  // Find all segments
  const segments = await findSegments(videoId, segmentLabels);

  return {
    videoId,
    videoUrl,
    duration: videoDetails.metadata.duration,
    segments,
    indexed: true,
  };
}

// Mock implementation for development without API key
export function createMockVideoIndex(
  videoUrl: string,
  duration: number = 30
): VideoIndex {
  return {
    videoId: `mock_${Date.now()}`,
    videoUrl,
    duration,
    segments: [
      {
        label: "Product Close-up",
        startTime: 0,
        endTime: 5,
        confidence: 0.95,
      },
      {
        label: "Unboxing",
        startTime: 5,
        endTime: 12,
        confidence: 0.88,
      },
      {
        label: "Human Interaction",
        startTime: 12,
        endTime: 20,
        confidence: 0.92,
      },
      {
        label: "Wide Shot",
        startTime: 20,
        endTime: 25,
        confidence: 0.85,
      },
      {
        label: "Product in Use",
        startTime: 25,
        endTime: 30,
        confidence: 0.9,
      },
    ],
    indexed: true,
  };
}

// Smart search - find a segment by natural language query
export async function smartSearch(
  videoId: string,
  query: string
): Promise<VideoSegment | null> {
  try {
    const segments = await searchVideo(videoId, query);
    if (segments.length === 0) return null;

    // Return highest confidence match
    return segments.reduce((best, current) =>
      (current.confidence || 0) > (best.confidence || 0) ? current : best
    );
  } catch {
    return null;
  }
}

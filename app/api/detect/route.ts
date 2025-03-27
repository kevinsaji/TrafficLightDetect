/*
import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import os from "os"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Create a temporary directory for processing
    console.log("Check1")
    const tempDir = path.join(os.tmpdir(), uuidv4())
    const imagePath = path.join(tempDir, "input.jpg")
    console.log("Check2")

    // Save the uploaded image
    const buffer = Buffer.from(await image.arrayBuffer())
    await writeFile(imagePath, buffer)

    // Run the Python script
    const results = await runDetection(imagePath)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Detection error:", error)
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 })
  }
}

async function runDetection(imagePath: string): Promise<{ image: string; label: string }[]> {
  return new Promise((resolve, reject) => {
    // This is a mock implementation
    // In a real implementation, you would call your Python script with the image path

    // Mock results for demonstration
    setTimeout(() => {
      // Simulate detection results
      const mockResults = [
        {
          image: "/placeholder.svg?height=200&width=200",
          label: "Red",
        },
        {
          image: "/placeholder.svg?height=200&width=200",
          label: "Green",
        },
        {
          image: "/placeholder.svg?height=200&width=200",
          label: "Yellow",
        },
      ]

      resolve(mockResults)

      // In a real implementation, you would:
      // 1. Call your Python script with the image path
      // 2. Get the cropped images and their labels
      // 3. Convert the cropped images to base64 or save them temporarily
      // 4. Return the results
    }, 2000)
  })
}
*/
import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process";
import { writeFileSync } from "fs";
import path from "path";
import { tmpdir } from "os";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get("image") as File

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convert image to buffer directly without saving to a temp directory
    const buffer = Buffer.from(await image.arrayBuffer())

    // Run the Python script with the buffer
    const results = await runDetection(buffer)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Detection error:", error)
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 })
  }
}

async function runDetection(imageBuffer: Buffer): Promise<{ image: string; label: string }[]> {
  return new Promise((resolve, reject) => {
    const tempImagePath = path.join(tmpdir(), `input_image.png`);
    writeFileSync(tempImagePath, imageBuffer);

    const pythonProcess = spawn("python", ["scripts/detect_traffic_lights.py", tempImagePath]);

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python script error: ${errorOutput}`));
        return;
      }

      try {
        const parsedOutput = JSON.parse(output);
        if (parsedOutput.error) {
          reject(new Error(parsedOutput.error));
          return;
        }
        resolve(parsedOutput.results);
      } catch (err) {
        reject(new Error("Failed to parse script output"));
      }
    });
  });
}

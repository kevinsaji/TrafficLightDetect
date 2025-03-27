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

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process"
import path from "path"
import fs from "fs"

export async function POST() {
  try {
    // Check if the model file already exists
    const modelPath = path.join(process.cwd(), "best.pt")
    if (fs.existsSync(modelPath)) {
      return NextResponse.json({ message: "Model already exists" })
    }

    // Ensure the scripts directory exists
    const scriptsDir = path.join(process.cwd(), "scripts")
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true })
    }

    // Path to the Python script
    const scriptPath = path.join(process.cwd(), "scripts", "generate_model.py")

    // Make the script executable
    try {
      fs.chmodSync(scriptPath, "755")
    } catch (error) {
      console.warn("Could not make script executable:", error)
    }

    // Generate the model
    const result = await generateModel()

    return NextResponse.json({ message: "Model setup complete", result })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Failed to set up model" }, { status: 500 })
  }
}


async function generateModel(): Promise<string> {
  return new Promise((resolve, reject) => {
    // For development/testing, create a mock model file
    if (process.env.NODE_ENV === "development") {
      const mockModelPath = path.join(process.cwd(), "best.pt")

      // Create a simple binary file with random data
      const buffer = Buffer.alloc(1024 * 1024) // 1MB file
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256)
      }

      fs.writeFileSync(mockModelPath, buffer)
      resolve("Mock model created successfully")
      return
    }

    // Path to the Python script
    const scriptPath = path.join(process.cwd(), "scripts", "generate_model.py")

    // Run the Python script
    const pythonProcess = spawn("python", [scriptPath])

    let dataString = ""
    let errorString = ""

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString()
    })

    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString()
      console.error(`Python stderr: ${data}`)
    })

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`)
        console.error(`Error: ${errorString}`)
        reject(new Error(`Model generation failed with code ${code}: ${errorString}`))
        return
      }

      resolve(dataString || "Model generated successfully")
    })
  })
}


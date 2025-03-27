"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Loader2, Check, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import JSZip from "jszip"

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<
    | {
        image: string
        label: string
      }[]
    | null
  >(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [processed, setProcessed] = useState(false)

  const handleInputClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result as string)
        setResults(null)
        setError(null)
        setProcessed(false)
      }
      reader.readAsDataURL(file)

      // Process the image automatically
      processImage(file)
    }
  }

/*
  const processImage = async (imageFile: File) => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", imageFile)

      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Detection failed")
      }

      const data = await response.json()
      setResults(data.results)
      setProcessed(true)
    } catch (err) {
      setError("An error occurred during detection. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://127.0.0.1:5000/detect'  // Local Flask backend
  : '/api/detect';  // Netlify deployed backend
*/

const processImage = async (imageFile: File) => {
  setLoading(true)
  setError(null)

  try {
    const formData = new FormData()
    formData.append("image", imageFile)

    const response = await fetch("/api/detect", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Detection failed")
    }

    const data = await response.json()
    setResults(data.results)
    setProcessed(true)
  } catch (err) {
    setError("An error occurred during detection. Please try again.")
    console.error(err)
  } finally {
    setLoading(false)
  }
}

  const handleShowOutput = () => {
    if (processed && results) {
      setDialogOpen(true)
    }
  }

  const handleSaveResults = async () => {
    if (!results || results.length === 0) return

    try {
      // Create a new JSZip instance
      const zip = new JSZip()

      // Create a folder to store the images and labels
      const folder = zip.folder("traffic_light_detection")

      // Store each image with its label
      results.forEach((result, index) => {
        // Remove the data URL prefix to get the base64 data
        const base64Data = result.image.replace(/^data:image\/\w+;base64,/, '')
        
        // Convert base64 to binary
        const imageData = atob(base64Data)
        const ia = new Uint8Array(imageData.length)
        for (let i = 0; i < imageData.length; i++) {
          ia[i] = imageData.charCodeAt(i)
        }

        folder?.file(`traffic_light_${result.label.toLowerCase()}_${index + 1}.png`, ia, { base64: false })
      })

      const summary = results.map((result, index) => 
        `Image ${index + 1}: Label = ${result.label}`
      ).join('\n')
      folder?.file('detection_summary.txt', summary)

      const zipBlob = await zip.generateAsync({ type: 'blob' })

      const url = URL.createObjectURL(zipBlob)

      const link = document.createElement("a")
      link.href = url
      link.download = "traffic_light_detection_results.zip"

      document.body.appendChild(link)

      link.click()

      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Failed to save results:", err)
    }
  }

  return (
  <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#4a90e2] via-[#4a7ebb] to-[#2c3e50] dark:from-[#1e293b] dark:via-[#2c3e50] dark:to-[#3b4d61] transition-colors duration-300">
    <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="max-w-4xl w-full p-8 text-center border shadow-lg dark:shadow-xl bg-white/80 backdrop-blur-sm dark:bg-[#1f2937] transition-all duration-300 rounded-xl">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-[#0284c7] to-[#4f46e5] dark:from-[#38bdf8] dark:to-[#818cf8]">
            DEPARTMENT OF INFORMATION TECHNOLOGY
          </h1>
          <h2 className="text-2xl font-semibold text-[#0f172a] dark:text-[#f1f5f9]">
            NATIONAL INSTITUTE OF TECHNOLOGY KARNATAKA, SURATHKAL-575025
          </h2>

          <div className="pt-6">
            <h3 className="text-2xl font-semibold text-[#0f172a] dark:text-[#f1f5f9]">
              Information Assurance and Security (IT352) Course Project
            </h3>
            <h3 className="text-2xl font-semibold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-[#0369a1] to-[#4338ca] dark:from-[#0ea5e9] dark:to-[#6366f1]">
              Title "Traffic Light Detection and Classification"
            </h3>
          </div>

          <div className="pt-4">
            <p className="text-xl text-[#334155] dark:text-[#cbd5e1]">Carried out by</p>
            <p className="text-xl font-medium text-[#1e40af] dark:text-[#93c5fd]">Student Name (Roll Number)</p>
            <p className="text-xl font-medium text-[#1e40af] dark:text-[#93c5fd]">Student Name (Roll Number)</p>
            <p className="text-xl text-[#334155] dark:text-[#cbd5e1]">During Academic Session January – April 2025</p>
          </div>

          {file && (
            <div className="flex items-center justify-center gap-2 text-lg text-green-600 dark:text-green-400 font-medium">
              <Check className="h-5 w-5" />
              <span>File selected: {file.name}</span>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-lg text-blue-600 dark:text-blue-400 font-medium">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing image...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-lg font-medium">
              {error}
            </div>
          )}

          <div className="pt-10 flex flex-col items-center gap-4">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

            <Button
              className="w-96 h-14 text-xl bg-gradient-to-r from-[#0284c7] to-[#4f46e5] hover:from-[#0369a1] hover:to-[#4338ca] dark:from-[#0ea5e9] dark:to-[#6366f1] dark:hover:from-[#0284c7] dark:hover:to-[#4f46e5] text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 rounded-xl"
              onClick={handleInputClick}
              disabled={loading}
            >
              <Camera className="h-5 w-5" />
              Press here to Enter Input
            </Button>

            <Button
              className="w-96 h-14 text-xl bg-gradient-to-r from-[#0284c7] to-[#4f46e5] hover:from-[#0369a1] hover:to-[#4338ca] dark:from-[#0ea5e9] dark:to-[#6366f1] dark:hover:from-[#0284c7] dark:hover:to-[#4f46e5] text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              onClick={handleShowOutput}
              disabled={!processed || loading}
            >
              Press here to display output on Screen
            </Button>

            <Button
              className="w-96 h-14 text-xl bg-gradient-to-r from-[#0284c7] to-[#4f46e5] hover:from-[#0369a1] hover:to-[#4338ca] dark:from-[#0ea5e9] dark:to-[#6366f1] dark:hover:from-[#0284c7] dark:hover:to-[#4f46e5] text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              onClick={handleSaveResults}
              disabled={!processed || loading || !results || results.length === 0}
            >
              {saved ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Output Stored
                </>
              ) : (
                "Press here to store the output"
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl w-[90vw] bg-white dark:bg-[#1f2937] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#0284c7] to-[#4f46e5] dark:from-[#38bdf8] dark:to-[#818cf8]">
              Detection Results
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto p-4">
            {results && results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="border rounded-xl overflow-hidden shadow-md transition-all hover:shadow-lg"
                  >
                    <div className="relative h-64 w-full">
                      <Image
                        src={result.image || "/placeholder.svg"}
                        alt={`Traffic light ${index + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div
                      className={`p-4 text-center font-medium text-xl ${
                        result.label === "Green"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : result.label === "Red"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                      }`}
                    >
                      {result.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-xl text-[#64748b] dark:text-[#94a3b8]">
                No traffic lights detected
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="text-lg hover:bg-[#f1f5f9] dark:hover:bg-[#374151]"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}


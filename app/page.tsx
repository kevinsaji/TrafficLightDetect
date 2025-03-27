"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

        // Add image to the zip folder with label-based filename
        folder?.file(`traffic_light_${result.label.toLowerCase()}_${index + 1}.png`, ia, { base64: false })
      })

      // Create a text file with detection summary
      const summary = results.map((result, index) => 
        `Image ${index + 1}: Label = ${result.label}`
      ).join('\n')
      folder?.file('detection_summary.txt', summary)

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })

      // Create a URL for the blob
      const url = URL.createObjectURL(zipBlob)

      // Create a link element
      const link = document.createElement("a")
      link.href = url
      link.download = "traffic_light_detection_results.zip"

      // Append the link to the body
      document.body.appendChild(link)

      // Click the link to trigger the download
      link.click()

      // Clean up
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("Failed to save results:", err)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#f2f7e9]">
      <Card className="max-w-4xl w-full p-8 text-center bg-[#f2f7e9] border-0 shadow-none">
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-black">
            DEPARTMENT OF INFORMATION TECHNOLOGY
          </h1>
          <h2 className="text-2xl font-semibold text-black">
            NATIONAL INSTITUTE OF TECHNOLOGY KARNATAKA, SURATHKAL-575025
          </h2>

          <div className="pt-6">
            <h3 className="text-2xl font-semibold text-black">
              Information Assurance and Security (IT352) Course Project
            </h3>
            <h3 className="text-2xl font-semibold mt-2 text-black">
              Title "Traffic Light Detection and Classification"
            </h3>
          </div>

          <div className="pt-4">
            <p className="text-xl text-black">Carried out by</p>
            <p className="text-xl text-black">Kevin Saji Jacob (221IT038)</p>
            <p className="text-xl text-black">Sricharan Sridhar (221IT066)</p>
            <p className="text-xl text-black">During Academic Session January – April 2025</p>
          </div>

          {file && (
            <div className="flex items-center justify-center gap-2 text-lg text-green-700 font-medium">
              <Check className="h-5 w-5" />
              <span>File selected: {file.name}</span>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-lg text-blue-700 font-medium">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing image...</span>
            </div>
          )}

          {error && <div className="p-4 bg-red-50 text-red-700 rounded-md text-lg font-medium">{error}</div>}

          <div className="pt-10 flex flex-col items-center gap-4">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

            <Button
              className="w-96 h-14 text-xl bg-[#4a7ebb] hover:bg-[#3a6eab] text-white"
              onClick={handleInputClick}
              disabled={loading}
            >
              Press here to Enter Input
            </Button>

            <Button
              className="w-96 h-14 text-xl bg-[#4a7ebb] hover:bg-[#3a6eab] text-white"
              onClick={handleShowOutput}
              disabled={!processed || loading}
            >
              Press here to display output on Screen
            </Button>

            <Button
              className="w-96 h-14 text-xl bg-[#4a7ebb] hover:bg-[#3a6eab] text-white"
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
        <DialogContent className="max-w-4xl w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-black">Detection Results</DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto p-4">
            {results && results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-md overflow-hidden">
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
                          ? "bg-green-100 text-green-800"
                          : result.label === "Red"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {result.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-xl text-gray-700">
                No traffic lights detected
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-lg">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

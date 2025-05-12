"use server"

import { v2 as cloudinary } from "cloudinary"

// Server-side only configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Server actions for Cloudinary operations
export async function serverUploadImage(base64data: string) {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64data,
        {
          folder: "nexus-sphere",
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        },
      )
    })

    return result
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw new Error("Failed to upload image")
  }
}

export async function serverUploadAudio(base64data: string) {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64data,
        {
          folder: "nexus-sphere-audio",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        },
      )
    })

    return result
  } catch (error) {
    console.error("Error uploading audio to Cloudinary:", error)
    throw new Error("Failed to upload audio")
  }
}

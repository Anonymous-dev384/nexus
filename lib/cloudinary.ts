// Client-side file - no Cloudinary imports or configuration here
export const uploadImage = async (file: File): Promise<string> => {
  // Convert file to base64
  const base64data = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      const base64data = reader.result as string
      resolve(base64data)
    }
  })

  // Upload to Cloudinary via our secure API route
  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: base64data }),
    })

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`)
    }

    const data = await response.json()
    return data.secure_url
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error)
    throw error
  }
}

export const uploadAudio = async (file: File): Promise<string> => {
  // Convert file to base64
  const base64data = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      const base64data = reader.result as string
      resolve(base64data)
    }
  })

  // Upload to Cloudinary via our secure API route
  try {
    const response = await fetch("/api/upload-audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: base64data }),
    })

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`)
    }

    const data = await response.json()
    return data.secure_url
  } catch (error) {
    console.error("Error uploading audio to Cloudinary:", error)
    throw error
  }
}

"use client"

import { useState, useEffect } from "react"

export const useFeatures = () => {
  const [features, setFeatures] = useState([])

  useEffect(() => {
    // Replace this array with Supabase fetch later
    const mockFeatures = [
      { title: "Skill Assessment" },
      { title: "Career Pathways" },
      { title: "Interactive Learning" },
      { title: "Community Support" },
    ]

    // Simulate API call delay
    setTimeout(() => {
      setFeatures(mockFeatures)
    }, 100)
  }, [])

  return features
}

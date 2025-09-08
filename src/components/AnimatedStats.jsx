"use client"

import { useState, useEffect } from "react"
import { useStats } from "../hooks/useStats"

const AnimatedStats = () => {
  const stats = useStats()
  const [animatedValues, setAnimatedValues] = useState({})

  useEffect(() => {
    const animateCounters = () => {
      stats.forEach((stat) => {
        let startValue = 0
        const endValue = stat.value
        const duration = 2000 // 2 seconds
        const increment = endValue / (duration / 16) // 60fps

        const timer = setInterval(() => {
          startValue += increment
          if (startValue >= endValue) {
            startValue = endValue
            clearInterval(timer)
          }

          setAnimatedValues((prev) => ({
            ...prev,
            [stat.label]: Math.floor(startValue),
          }))
        }, 16)
      })
    }

    // Start animation after component mounts
    const timeout = setTimeout(animateCounters, 500)
    return () => clearTimeout(timeout)
  }, [stats])

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + "K+"
    }
    return num.toLocaleString() + "+"
  }

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-green-600 mb-2">
                {formatNumber(animatedValues[stat.label] || 0)}
              </div>
              <div className="text-lg text-gray-700 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AnimatedStats

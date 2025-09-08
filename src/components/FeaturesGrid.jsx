import { useFeatures } from "../hooks/useFeatures"

const FeaturesGrid = () => {
  const features = useFeatures()

  const getFeatureIcon = (title) => {
    switch (title) {
      case "Skill Assessment":
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case "Career Pathways":
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      case "Interactive Learning":
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        )
      case "Community Support":
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
    }
  }

  const getFeatureDescription = (title) => {
    switch (title) {
      case "Skill Assessment":
        return "Take comprehensive assessments to identify your current skills and areas for improvement."
      case "Career Pathways":
        return "Discover personalized career paths based on your skills, interests, and market demand."
      case "Interactive Learning":
        return "Engage with hands-on courses and projects designed to build real-world skills."
      case "Community Support":
        return "Connect with mentors, peers, and industry professionals in our supportive community."
      default:
        return "Enhance your professional journey with our comprehensive platform features."
    }
  }

  return (
    <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our comprehensive platform provides all the tools and resources you need to bridge your skills gap
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-green-50 rounded-lg mb-4 mx-auto">
                {getFeatureIcon(feature.title)}
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">{feature.title}</h3>

              <p className="text-gray-600 text-center leading-relaxed">{getFeatureDescription(feature.title)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesGrid

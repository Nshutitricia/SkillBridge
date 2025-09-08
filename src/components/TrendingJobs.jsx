import { useJobs } from "../hooks/useJobs"

const TrendingJobs = () => {
  const jobs = useJobs()

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Trending Career Paths</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore the most in-demand careers and discover the skills you need to succeed
          </p>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-6 min-w-max">
            {jobs.map((job, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 min-w-[280px] cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Hot</span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">
                  {job.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4">High demand • Remote friendly • Growing field</p>

                <button className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform duration-300">
                  Explore Path
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrendingJobs

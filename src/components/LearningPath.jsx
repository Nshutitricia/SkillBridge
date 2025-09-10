import React, { useState } from "react";

const LearningPath = () => {
    const [activeTab, setActiveTab] = useState('courses');
    const [selectedCareer, setSelectedCareer] = useState('hair-stylist');
    const [searchQuery, setSearchQuery] = useState('');
    const [chatMessages, setChatMessages] = useState([
        {
            type: 'ai',
            message: "Hi! I'm your AI learning assistant. I can help you find courses, suggest learning paths, or answer questions about skills development. What would you like to learn today?"
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const courseData = {
        'hair-stylist': [
            {
                title: 'Advanced Hair Coloring Techniques',
                description: 'Master professional coloring methods including balayage, ombre, and color correction techniques.',
                priority: 'High Priority',
                duration: '6 weeks',
                rating: '4.8',
                students: '2.3k',
                priorityColor: 'bg-green-500'
            },
            {
                title: 'Business Management for Beauty Professionals',
                description: 'Learn to manage your salon business, handle finances, and build a loyal customer base.',
                priority: 'Medium Priority',
                duration: '4 weeks',
                rating: '4.6',
                students: '1.8k',
                priorityColor: 'bg-green-400'
            },
            {
                title: 'Digital Marketing for Beauty Salons',
                description: 'Build your online presence, master social media marketing, and attract new clients digitally.',
                priority: 'High Priority',
                duration: '5 weeks',
                rating: '4.7',
                students: '3.1k',
                priorityColor: 'bg-green-500'
            },
            {
                title: 'Customer Service Excellence',
                description: 'Enhance your client relationships and create memorable experiences that drive repeat business.',
                priority: 'Supplementary',
                duration: '3 weeks',
                rating: '4.5',
                students: '1.2k',
                priorityColor: 'bg-green-300'
            }
        ],
        'web-developer': [
            {
                title: 'Full-Stack JavaScript Development',
                description: 'Master modern JavaScript, React, Node.js, and database integration for complete web applications.',
                priority: 'High Priority',
                duration: '12 weeks',
                rating: '4.9',
                students: '15.2k',
                priorityColor: 'bg-green-500'
            },
            {
                title: 'Advanced CSS & Responsive Design',
                description: 'Create stunning, mobile-first designs with modern CSS techniques and frameworks.',
                priority: 'High Priority',
                duration: '6 weeks',
                rating: '4.7',
                students: '8.9k',
                priorityColor: 'bg-green-500'
            },
            {
                title: 'DevOps for Developers',
                description: 'Learn deployment strategies, CI/CD pipelines, and cloud infrastructure management.',
                priority: 'Medium Priority',
                duration: '8 weeks',
                rating: '4.6',
                students: '5.4k',
                priorityColor: 'bg-green-400'
            },
            {
                title: 'API Design & Development',
                description: 'Build robust RESTful APIs and understand GraphQL for modern web applications.',
                priority: 'High Priority',
                duration: '7 weeks',
                rating: '4.8',
                students: '6.7k',
                priorityColor: 'bg-green-500'
            }
        ]
    };

    const suggestionTags = [
        'Organic Hair Products',
        'Wedding Hairstyles',
        'Salon Business',
        'Hair Cutting Techniques',
        'Color Theory',
        'Client Consultation'
    ];

    const handleSearch = (query) => {
        const results = [
            {
                title: `${query} Fundamentals`,
                description: `Learn the basics of ${query} with hands-on practice and expert guidance.`,
                rating: '4.7',
                duration: '4 weeks',
                level: 'Beginner'
            },
            {
                title: `Advanced ${query} Techniques`,
                description: `Master professional-level ${query} skills and advanced methodologies.`,
                rating: '4.9',
                duration: '8 weeks',
                level: 'Advanced'
            },
            {
                title: `${query} for Business`,
                description: `Apply ${query} knowledge to grow your business and increase profitability.`,
                rating: '4.6',
                duration: '6 weeks',
                level: 'Intermediate'
            }
        ];

        setSearchResults(results);
        addChatMessage(`I found ${results.length} courses related to "${query}". Here are the top recommendations based on your profile and learning goals.`, 'ai');
    };

    const addChatMessage = (message, type) => {
        setChatMessages(prev => [...prev, { type, message }]);
    };

    const handleChatSend = () => {
        if (chatInput.trim()) {
            addChatMessage(chatInput, 'user');
            
            setTimeout(() => {
                let aiResponse = "I understand you're looking for information about that topic. Let me search for relevant courses and resources for you.";
                
                if (chatInput.toLowerCase().includes('hair') || chatInput.toLowerCase().includes('salon')) {
                    aiResponse = "Great! I can help you find hair styling and salon management courses. Would you like me to show you courses on specific techniques like coloring, cutting, or business management?";
                } else if (chatInput.toLowerCase().includes('business') || chatInput.toLowerCase().includes('management')) {
                    aiResponse = "I'd be happy to help you find business and management courses. Are you looking for general business skills or something specific to your industry?";
                }
                
                addChatMessage(aiResponse, 'ai');
            }, 1000);
            
            setChatInput('');
        }
    };

    const CourseCard = ({ course }) => (
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4 border-green-500 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 to-green-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
                <div className={`absolute top-0 right-0 ${course.priorityColor} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                    {course.priority}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800 pr-20">{course.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{course.description}</p>
                <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                    <span>⏱️ {course.duration}</span>
                    <span>⭐ {course.rating} rating</span>
                    <span>👥 {course.students} students</span>
                </div>
                <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-full font-semibold hover:from-green-600 hover:to-green-700 transform hover:-translate-y-0.5 transition-all duration-300 hover:shadow-lg">
                    Start Learning
                </button>
            </div>
        </div>
    );

    const ChatMessage = ({ message, type }) => (
        <div className={`flex mb-4 animate-fade-in ${type === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                type === 'ai' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-green-500 to-green-600'
            } ${type === 'user' ? 'ml-3' : 'mr-3'}`}>
                {type === 'ai' ? '🤖' : '👤'}
            </div>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                type === 'ai' 
                    ? 'bg-white text-gray-800' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white'
            }`}>
                <p className="text-sm">{message}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent mb-4">
                        Learning Path
                    </h1>
                    <p className="text-gray-600 text-lg">Personalized courses and resources to master your target skills</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-white/70 backdrop-blur-sm rounded-2xl p-2 mb-8 max-w-2xl mx-auto shadow-lg">
                    <button
                        className={`flex-1 cursor-pointer py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                            activeTab === 'courses'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                        }`}
                        onClick={() => setActiveTab('courses')}
                    >
                     Recommended Courses
                    </button>
                    <button
                        className={`flex-1 cursor-pointer py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
                            activeTab === 'llm-search'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                        }`}
                        onClick={() => setActiveTab('llm-search')}
                    >
                         Smart Course Finder
                    </button>
                </div>

                {/* Courses Tab */}
                {activeTab === 'courses' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Career Path Selector */}
                        <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-2xl p-6 text-center">
                            <h3 className="text-xl font-semibold mb-4">Select Your Target Career Path</h3>
                            <select 
                                value={selectedCareer}
                                onChange={(e) => setSelectedCareer(e.target.value)}
                                className="px-6 py-3 border-2 border-green-300 rounded-full text-lg min-w-80 bg-white cursor-pointer focus:outline-none focus:ring-4 focus:ring-green-200 transition-all"
                            >
                                <option value="hair-stylist">Hair Stylist & Beauty Entrepreneur</option>
                                <option value="web-developer">Web Developer</option>
                                <option value="data-scientist">Data Scientist</option>
                                <option value="digital-marketer">Digital Marketer</option>
                                <option value="graphic-designer">Graphic Designer</option>
                            </select>
                        </div>

                        {/* Progress Section */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                            <h3 className="text-xl font-semibold mb-2">Your Learning Progress</h3>
                            <p className="text-gray-600 mb-4">Overall completion: 35%</p>
                            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '35%' }}></div>
                            </div>
                        </div>

                        {/* Course Grid */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">Recommended Courses for You</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {courseData[selectedCareer]?.map((course, index) => (
                                    <CourseCard key={index} course={course} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* LLM Search Tab */}
                {activeTab === 'llm-search' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800"> Smart Course Finder</h2>
                            <p className="text-gray-600 mb-6">Ask our AI assistant to find specific courses, skills, or learning resources tailored to your needs</p>
                            
                            {/* Search Input */}
                            <div className="relative max-w-2xl mx-auto mb-6">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                                    placeholder="Ask: 'Find courses on advanced braiding techniques' or 'What skills do I need for salon management?'"
                                    className="w-full px-6 py-4 pr-12 border-2 border-green-300 rounded-full text-lg bg-white focus:outline-none focus:ring-4 focus:ring-green-200 transition-all"
                                />
                                <button
                                    onClick={() => handleSearch(searchQuery)}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-green-500 to-green-600 text-white w-10 h-10 rounded-full hover:scale-110 transition-all duration-300"
                                >
                                    🔍
                                </button>
                            </div>

                            {/* Search Suggestions */}
                            <div className="text-left mb-6">
                                <h3 className="text-lg font-semibold mb-3">Popular Searches:</h3>
                                <div className="flex flex-wrap gap-3">
                                    {suggestionTags.map((tag, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setSearchQuery(tag);
                                                handleSearch(tag);
                                            }}
                                            className="px-4 py-2 bg-green-100 text-green-700 rounded-full hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white transform hover:-translate-y-1 transition-all duration-300"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                                <h3 className="text-xl font-semibold mb-4">Search Results</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {searchResults.map((result, index) => (
                                        <div key={index} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                            <h4 className="font-semibold text-lg mb-2">{result.title}</h4>
                                            <p className="text-gray-600 text-sm mb-4">{result.description}</p>
                                            <div className="flex justify-between text-xs text-gray-500 mb-4">
                                                <span>⏱️ {result.duration}</span>
                                                <span>⭐ {result.rating}</span>
                                                <span>📚 {result.level}</span>
                                            </div>
                                            <button className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-full text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300">
                                                Enroll Now
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chat Interface */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
                                <h3 className="font-semibold">Chat with AI Assistant</h3>
                            </div>
                            <div className="h-96 overflow-y-auto p-4 bg-gray-50">
                                {chatMessages.map((msg, index) => (
                                    <ChatMessage key={index} message={msg.message} type={msg.type} />
                                ))}
                            </div>
                            <div className="p-4 border-t bg-white flex gap-3">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                                    placeholder="Type your question or search query..."
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                />
                                <button
                                    onClick={handleChatSend}
                                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-semibold hover:from-green-600 hover:to-green-700 transform hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default LearningPath;

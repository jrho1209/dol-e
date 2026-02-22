import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 bg-amber-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6" style={{ fontFamily: 'var(--font-quicksand)' }}>
              Discover Authentic
              <span className="text-yellow-500">
                {' '}Daejeon
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              DOL-E: Your AI-powered local guide connecting foreign visitors with authentic restaurants,
              cafes, and hidden gems in Daejeon, South Korea.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all"
              >
                Start Chatting Free
              </Link>
              <Link
                href="/pricing"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-8 py-4 rounded-lg font-semibold text-lg border-2 border-gray-200 dark:border-gray-700 hover:border-yellow-500 transition-all"
              >
                View Pricing
              </Link>
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-yellow-500">15+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Local Places</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-500">AI</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Powered</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-teal-500">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Available</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'var(--font-quicksand)' }}>
                Why Choose DOL-E?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Powered by advanced AI and local expertise
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-800 hover:border-yellow-400 transition-all">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  AI-Powered Recommendations
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  RAG technology ensures accurate, data-grounded recommendations from our curated database of local businesses.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-800 hover:border-orange-500 transition-all">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Local Business Focus
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Prioritizes authentic local businesses over franchises, supporting Daejeon's small business community.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-800 hover:border-teal-500 transition-all">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Conversational Interface
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Chat naturally like talking to a local friend, not a search engine. Get personalized suggestions instantly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'var(--font-quicksand)' }}>
                Explore Daejeon
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Find the perfect place for any occasion
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl text-center hover:shadow-lg transition-all">
                <div className="text-4xl mb-3">🍜</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Restaurants</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Authentic local cuisine</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl text-center hover:shadow-lg transition-all">
                <div className="text-4xl mb-3">☕</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Cafes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cozy coffee spots</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl text-center hover:shadow-lg transition-all">
                <div className="text-4xl mb-3">🏨</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Accommodation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Comfortable stays</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl text-center hover:shadow-lg transition-all">
                <div className="text-4xl mb-3">🎡</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Attractions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Must-see places</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-yellow-500">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" style={{ fontFamily: 'var(--font-quicksand)' }}>
              Ready to Explore Daejeon?
            </h2>
            <p className="text-xl text-yellow-50 mb-8 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
              Start chatting with our AI guide for free. No credit card required.
            </p>
            <Link
              href="/chat"
              className="inline-block bg-white text-yellow-600 px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
            >
              Start Your Journey
            </Link>
          </div>
        </section>
      </main>
  );
}


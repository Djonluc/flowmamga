"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import Image from "next/image";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    genre: searchParams.get("genre") || "",
    status: searchParams.get("status") || "",
    sort: searchParams.get("sort") || "trending",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (query || filters.genre || filters.status) {
      performSearch();
    }
  }, [query, filters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        ...filters,
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setResults(data.comics || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Search Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Search Comics</h1>
          
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, description, or author..."
                className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-4 bg-neutral-900 hover:bg-neutral-800 border border-white/10 rounded-xl transition-colors flex items-center gap-2"
            >
              <Filter size={20} />
              Filters
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-neutral-900 rounded-xl p-6 border border-white/5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Sort By</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="trending">Trending</option>
                    <option value="popular">Most Popular</option>
                    <option value="newest">Newest</option>
                    <option value="updated">Recently Updated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Genre</label>
                  <input
                    type="text"
                    value={filters.genre}
                    onChange={(e) => handleFilterChange("genre", e.target.value)}
                    placeholder="Enter genre..."
                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={() => setFilters({ genre: "", status: "", sort: "trending" })}
                className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <X size={16} />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <div className="text-center py-12 text-neutral-400">Searching...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              {query ? "No results found" : "Start typing to search"}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-neutral-400">Found {results.length} results</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {results.map((comic) => (
                  <div
                    key={comic.id}
                    onClick={() => router.push(`/comic/${comic.slug}`)}
                    className="group cursor-pointer space-y-3"
                  >
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-900 border border-white/5 transition-transform group-hover:-translate-y-2">
                      {comic.coverImage ? (
                        <Image src={comic.coverImage} alt={comic.title} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs opacity-20">No Cover</div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold truncate group-hover:text-blue-400 transition-colors">{comic.title}</h3>
                      <p className="text-sm text-neutral-400">{comic.author.name}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                        <span>{comic._count.views} views</span>
                        <span>•</span>
                        <span>{comic._count.likes} likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

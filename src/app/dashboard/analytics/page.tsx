"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Eye, Heart, MessageCircle, BookOpen } from "lucide-react";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?period=${period}`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-neutral-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Creator Analytics</h1>
            <p className="text-neutral-400 mt-2">Track your performance and engagement</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-neutral-900 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="text-blue-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Comics</span>
            </div>
            <p className="text-3xl font-bold">{analytics.summary.totalComics}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Eye className="text-purple-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Views</span>
            </div>
            <p className="text-3xl font-bold">{analytics.summary.totalViews.toLocaleString()}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Heart className="text-pink-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Likes</span>
            </div>
            <p className="text-3xl font-bold">{analytics.summary.totalLikes.toLocaleString()}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <MessageCircle className="text-green-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Comments</span>
            </div>
            <p className="text-3xl font-bold">{analytics.summary.totalComments.toLocaleString()}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingUp className="text-orange-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Engagement</span>
            </div>
            <p className="text-3xl font-bold">{analytics.summary.engagementRate}%</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Views Over Time */}
          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold mb-4">Views Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.viewsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="viewedAt" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                <Line type="monotone" dataKey="_count" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Likes Over Time */}
          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold mb-4">Likes Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.likesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="createdAt" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                <Line type="monotone" dataKey="_count" stroke="#ec4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Comics */}
        <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
          <h2 className="text-xl font-bold mb-4">Top Performing Comics</h2>
          <div className="space-y-3">
            {analytics.topComics.map((comic: any, index: number) => (
              <div key={comic.id} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-neutral-600">#{index + 1}</span>
                  <div>
                    <h3 className="font-bold">{comic.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-neutral-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Eye size={14} /> {comic.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={14} /> {comic.likes.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={14} /> {comic.comments.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

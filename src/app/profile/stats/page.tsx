"use client";

import { useState, useEffect } from "react";
import { Flame, Clock, BookOpen, Target } from "lucide-react";

export default function ReadingStatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/reading/track");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-neutral-400">Loading stats...</div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Reading Stats</h1>
          <p className="text-neutral-400 mt-2">Track your reading journey</p>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-8 border border-orange-500/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Flame className="text-orange-400" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Reading Streak</h2>
              <p className="text-neutral-400 text-sm">Keep it going!</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-neutral-400 text-sm mb-1">Current Streak</p>
              <p className="text-5xl font-bold text-orange-400">{stats.currentStreak}</p>
              <p className="text-neutral-400 text-sm mt-1">days</p>
            </div>
            <div>
              <p className="text-neutral-400 text-sm mb-1">Longest Streak</p>
              <p className="text-5xl font-bold text-orange-400">{stats.longestStreak}</p>
              <p className="text-neutral-400 text-sm mt-1">days</p>
            </div>
          </div>

          {stats.lastReadAt && (
            <p className="text-sm text-neutral-400 mt-6">
              Last read: {new Date(stats.lastReadAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="text-blue-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Total Time</span>
            </div>
            <p className="text-3xl font-bold">{formatTime(stats.totalReadingTime)}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BookOpen className="text-purple-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Pages Read</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalPagesRead.toLocaleString()}</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Target className="text-green-400" size={24} />
              </div>
              <span className="text-sm text-neutral-400 font-medium">Sessions</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalSessions}</p>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5">
          <h2 className="text-xl font-bold mb-4">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.currentStreak >= 7 && (
              <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🔥</div>
                <p className="text-sm font-medium">Week Warrior</p>
                <p className="text-xs text-neutral-500">7 day streak</p>
              </div>
            )}
            {stats.currentStreak >= 30 && (
              <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⭐</div>
                <p className="text-sm font-medium">Monthly Master</p>
                <p className="text-xs text-neutral-500">30 day streak</p>
              </div>
            )}
            {stats.totalPagesRead >= 1000 && (
              <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">📚</div>
                <p className="text-sm font-medium">Page Turner</p>
                <p className="text-xs text-neutral-500">1000+ pages</p>
              </div>
            )}
            {stats.totalReadingTime >= 36000 && (
              <div className="bg-neutral-800/50 rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">⏰</div>
                <p className="text-sm font-medium">Time Traveler</p>
                <p className="text-xs text-neutral-500">10+ hours</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

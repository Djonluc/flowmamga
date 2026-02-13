"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Image as ImageIcon, Calendar, Lock } from "lucide-react";

export default function UploadComicPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [publishAt, setPublishAt] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // TODO: Implement actual upload logic with S3/Supabase
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("isDraft", String(isDraft));
      if (publishAt) formData.append("publishAt", publishAt);
      if (coverImage) formData.append("cover", coverImage);

      const response = await fetch("/api/comics", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        alert("Failed to upload comic");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Upload New Comic</h1>
          <p className="text-neutral-400 mt-2">Share your work with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cover Image Upload */}
          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5 space-y-4">
            <label className="block text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Cover Image
            </label>
            
            {coverPreview ? (
              <div className="relative w-full max-w-sm aspect-[3/4] rounded-xl overflow-hidden bg-neutral-800 border border-white/10 group">
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(null);
                    setCoverPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full max-w-sm aspect-[3/4] border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors bg-neutral-800/50">
                <ImageIcon size={48} className="text-neutral-600 mb-4" />
                <span className="text-sm text-neutral-400">Click to upload cover</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5 space-y-6">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Enter comic title"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="Describe your comic..."
              />
            </div>
          </div>

          {/* Publishing Options */}
          <div className="bg-neutral-900 rounded-2xl p-6 border border-white/5 space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">Publishing Options</h3>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDraft"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                className="w-5 h-5 rounded bg-neutral-800 border-white/10"
              />
              <label htmlFor="isDraft" className="flex items-center gap-2 cursor-pointer">
                <Lock size={16} className="text-neutral-400" />
                <span>Save as draft (not publicly visible)</span>
              </label>
            </div>

            {!isDraft && (
              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  Schedule Publish Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="bg-neutral-800 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-neutral-500 mt-2">Leave empty to publish immediately</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isUploading || !title}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              <Upload size={20} />
              {isUploading ? "Uploading..." : isDraft ? "Save Draft" : "Publish Comic"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

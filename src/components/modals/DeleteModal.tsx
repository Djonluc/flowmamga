"use client";

import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deleteType: "soft" | "hard") => void;
  title: string;
  itemName: string;
  type: "comic" | "chapter" | "folder";
}

export function DeleteModal({ isOpen, onClose, onConfirm, title, itemName, type }: DeleteModalProps) {
  const [deleteType, setDeleteType] = useState<"soft" | "hard">("soft");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(deleteType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <p className="text-neutral-300">
            Are you sure you want to delete <strong className="text-white">"{itemName}"</strong>?
          </p>

          {/* Delete Options */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800 transition-colors">
              <input
                type="radio"
                name="deleteType"
                value="soft"
                checked={deleteType === "soft"}
                onChange={() => setDeleteType("soft")}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-white">Remove from Library Only</p>
                <p className="text-sm text-neutral-400">
                  {type === "folder" 
                    ? "Removes folder index from database. Files remain untouched."
                    : "Hides from UI. File/data remains intact."}
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-lg cursor-pointer hover:bg-red-500/10 transition-colors">
              <input
                type="radio"
                name="deleteType"
                value="hard"
                checked={deleteType === "hard"}
                onChange={() => setDeleteType("hard")}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-red-400">Delete File From Disk</p>
                <p className="text-sm text-neutral-400">
                  {type === "folder"
                    ? "Permanently deletes all files in folder. This cannot be undone."
                    : "Permanently deletes file and all associated data. This cannot be undone."}
                </p>
              </div>
            </label>
          </div>

          {deleteType === "hard" && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400 font-medium">
                ⚠️ Warning: This action is permanent and cannot be undone!
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors font-medium ${
              deleteType === "hard"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {deleteType === "hard" ? "Delete Permanently" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

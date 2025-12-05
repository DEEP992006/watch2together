'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Image as ImageIcon, X } from 'lucide-react';
import { saveMemory, getMemories } from '@/app/actions/basic';
import { useUploadThing } from '@/lib/uploadthing';
import { format } from 'date-fns';

interface MemoryWallProps {
  username: string;
}

interface Memory {
  id: number;
  username: string;
  imageUrl: string;
  caption: string | null;
  createdAt: Date;
}

export default function MemoryWall({ username }: MemoryWallProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("imageUploader");

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    const result = await getMemories(50);
    if (result.success && result.memories) {
      setMemories(result.memories as Memory[]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      // Upload to UploadThing
      const uploadResult = await startUpload([selectedFile]);
      
      if (uploadResult && uploadResult[0]) {
        const imageUrl = uploadResult[0].url;

        // Optimistic update
        const newMemory: Memory = {
          id: Date.now(),
          username,
          imageUrl,
          caption: caption || null,
          createdAt: new Date(),
        };

        setMemories((prev) => [newMemory, ...prev]);

        // Save to database
        const result = await saveMemory(username, imageUrl, caption || undefined);
        
        if (result.success) {
          loadMemories(); // Reload to get actual data
        } else {
          console.error('Failed to save memory:', result.error);
          // Rollback on error
          setMemories((prev) => prev.filter((m) => m.id !== newMemory.id));
        }

        // Close modal and reset
        setShowUploadModal(false);
        setCaption('');
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Memory Wall</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Memory
        </motion.button>
      </div>

      {/* Memory Grid */}
      <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {memories.map((memory) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group rounded-lg overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow"
            >
              <img
                src={memory.imageUrl}
                alt={memory.caption || 'Memory'}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  {memory.caption && (
                    <p className="text-sm font-medium mb-1">{memory.caption}</p>
                  )}
                  <p className="text-xs opacity-90">{memory.username}</p>
                  <p className="text-xs opacity-75">
                    {format(new Date(memory.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !isUploading && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Add Memory</h3>
                <button
                  onClick={() => !isUploading && setShowUploadModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isUploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100"
                  />
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption (Optional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    disabled={isUploading}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-rose-500 focus:ring-4 focus:ring-rose-200 outline-none transition-all resize-none"
                    rows={3}
                  />
                </div>

                {/* Upload Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload Memory'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

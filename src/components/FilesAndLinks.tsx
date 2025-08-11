import React, { useState } from 'react';
import { Plus, Upload, Link2, File, ExternalLink, X } from 'lucide-react';
import { useFiles } from '../hooks/useFiles';

interface FilesAndLinksProps {
  projectId: string;
}

export default function FilesAndLinks({ projectId }: FilesAndLinksProps) {
  const { files, loading, error, addLink, uploadFile } = useFiles(projectId);
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkName.trim() || !linkUrl.trim()) return;
    
    setAdding(true);
    await addLink(linkName, linkUrl);
    setLinkName('');
    setLinkUrl('');
    setShowAddLink(false);
    setAdding(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    try {
      await uploadFile(file);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Files and Links</h2>
        <div className="text-gray-500">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Files and Links</h2>
        <div className="text-red-600">Error loading files: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Files and Links</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowAddLink(true)}
            className="flex items-center space-x-1 px-3 py-2 text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            <span>Add Link</span>
          </button>
          <label className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
            <input
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <Upload size={16} />
            <span>{uploading ? 'Uploading...' : 'Upload file'}</span>
          </label>
        </div>
      </div>
      
      {/* Drag and Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mb-4 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-purple-400 bg-purple-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload size={24} className={`mx-auto mb-2 ${dragOver ? 'text-purple-600' : 'text-gray-400'}`} />
        <p className={`text-sm ${dragOver ? 'text-purple-600' : 'text-gray-600'}`}>
          {uploading ? 'Uploading file...' : 'Drag and drop files here, or click Upload file button'}
        </p>
      </div>

      {showAddLink && (
        <form onSubmit={handleAddLink} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Link name"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {adding ? 'Adding...' : 'Add Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddLink(false)}
                className="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
      
      {files.length === 0 ? (
        <div className="text-gray-500 text-center py-4">No files or links yet</div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id}>
              {file.type === 'link' && file.url ? (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
                >
                  <Link2 size={20} className="text-purple-600" />
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium group-hover:text-purple-600 transition-colors">{file.name}</div>
                  </div>
                  <ExternalLink size={16} className="text-purple-600 group-hover:text-purple-700" />
                </a>
              ) : file.type === 'file' && file.url ? (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
                  download={file.name}
                >
                  <File size={20} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium group-hover:text-purple-600 transition-colors">{file.name}</div>
                    {file.size && (
                      <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                    )}
                  </div>
                  <ExternalLink size={16} className="text-purple-600 group-hover:text-purple-700" />
                </a>
              ) : (
                <div className="flex items-center space-x-3 p-3 rounded-lg">
                  <File size={20} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="text-gray-900 font-medium">{file.name}</div>
                    {file.type === 'file' && file.size && (
                      <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
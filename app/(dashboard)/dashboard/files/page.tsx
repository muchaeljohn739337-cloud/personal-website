'use client';

import {
  AlertCircle,
  Download,
  File,
  FileImage,
  FileText,
  Folder,
  HardDrive,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FileInfo {
  name: string;
  size: number;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  publicUrl: string;
}

interface StorageStatus {
  available: boolean;
  buckets: string[];
}

const bucketLabels: Record<string, { label: string; icon: typeof Folder; color: string }> = {
  'blog-images': { label: 'Blog Images', icon: FileImage, color: 'text-pink-500' },
  'user-avatars': { label: 'User Avatars', icon: FileImage, color: 'text-blue-500' },
  'workspace-assets': { label: 'Workspace Assets', icon: Folder, color: 'text-purple-500' },
  'ai-outputs': { label: 'AI Outputs', icon: FileText, color: 'text-green-500' },
  documents: { label: 'Documents', icon: File, color: 'text-orange-500' },
};

export default function FilesPage() {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/storage?action=status');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch storage status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = useCallback(async (bucket: string) => {
    setLoadingFiles(true);
    try {
      const res = await fetch(`/api/storage?action=list&bucket=${bucket}`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      fetchFiles(selectedBucket);
    }
  }, [selectedBucket, fetchFiles]);

  const handleUpload = async (fileList: FileList) => {
    if (!selectedBucket || fileList.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', selectedBucket);

        await fetch('/api/storage', {
          method: 'POST',
          body: formData,
        });
      }
      await fetchFiles(selectedBucket);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!selectedBucket || !confirm(`Delete ${fileName}?`)) return;

    try {
      await fetch(`/api/storage?bucket=${selectedBucket}&paths=${fileName}`, {
        method: 'DELETE',
      });
      await fetchFiles(selectedBucket);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return FileImage;
    if (contentType.includes('pdf') || contentType.includes('document')) return FileText;
    return File;
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!status?.available) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
            <HardDrive className="h-8 w-8 text-purple-500" />
            File Storage
          </h1>
        </div>
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardContent className="flex items-center gap-4 p-6">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                Storage Not Configured
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Add your Supabase credentials to enable file storage:
              </p>
              <code className="mt-2 block rounded bg-amber-100 p-2 text-xs dark:bg-amber-900/50">
                NEXT_PUBLIC_SUPABASE_URL=your-project-url
                <br />
                SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 dark:text-white">
            <HardDrive className="h-8 w-8 text-purple-500" />
            File Storage
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage your files across storage buckets
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Bucket Selector */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-500">Storage Buckets</h3>
          {status.buckets.map((bucket) => {
            const config = bucketLabels[bucket] || {
              label: bucket,
              icon: Folder,
              color: 'text-slate-500',
            };
            const Icon = config.icon;
            return (
              <button
                key={bucket}
                onClick={() => setSelectedBucket(bucket)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  selectedBucket === bucket
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                <Icon className={`h-5 w-5 ${config.color}`} />
                <span className="font-medium text-slate-900 dark:text-white">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* File List */}
        <div className="lg:col-span-3">
          {selectedBucket ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{bucketLabels[selectedBucket]?.label || selectedBucket}</CardTitle>
                    <CardDescription>{files.length} files</CardDescription>
                  </div>
                  <label className="cursor-pointer" aria-label="Upload files">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && handleUpload(e.target.files)}
                      disabled={uploading}
                      aria-label="Select files to upload"
                    />
                    <Button disabled={uploading} asChild>
                      <span>
                        {uploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Upload
                      </span>
                    </Button>
                  </label>
                </div>
              </CardHeader>
              <CardContent>
                {/* Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files) {
                      handleUpload(e.dataTransfer.files);
                    }
                  }}
                  className={`mb-4 rounded-lg border-2 border-dashed p-8 text-center transition-all ${
                    dragOver
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Upload className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-500">
                    Drag and drop files here, or click Upload
                  </p>
                </div>

                {/* File List */}
                {loadingFiles ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">No files in this bucket</div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => {
                      const Icon = getFileIcon(file.contentType);
                      return (
                        <div
                          key={file.name}
                          className="flex items-center justify-between rounded-lg border p-3 dark:border-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-slate-400" />
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {file.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatSize(file.size)} • {file.contentType}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={file.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Download className="h-4 w-4 text-slate-500" />
                            </a>
                            <button
                              onClick={() => handleDelete(file.name)}
                              className="rounded p-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <Folder className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="mt-4 text-slate-500">Select a bucket to view files</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Loader2, FileIcon, Upload, FolderPlus, Trash2 } from "lucide-react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { File as FileType } from "@/types/general/files";
import SearchBar from "../search-bar";
import { getOrgFiles, patchOrgFiles, postOrgFilesDelete, postOrgFiles, postOrgFilesUploader } from "@/api/orgs/files/files";
import { uploadFile } from "@/lib/uploaders_timbal";
import { toast } from "sonner";
import { formatSize } from "@/utils/miscelanea";
import FilesTable, { type FilesTableColumnKey } from "./components/files-table";
import FilesBreadcrumb, { type FilesBreadcrumbItem } from "./components/files-breadcrumb";
import FileEditModal from "./components/file-edit-modal";
import FileDeleteModal from "./components/file-delete-modal";
import FileCreateModal from "./components/file-create-modal";

interface FilesSectionProps {
    entity_id?: string | null;
    showSearch?: boolean;
    showUpload?: boolean;
    canUpload?: boolean;
    showCreateFolder?: boolean;
    showDelete?: boolean;
    showEdit?: boolean;
    showBreadcrumbs?: boolean;
    /** Columns to hide from the files table, accepts array or single string */
    hiddenColumns?: FilesTableColumnKey[] | FilesTableColumnKey;
    onPendingFilesChange?: (files: File[]) => void;
    onFilesChange?: (files: FileType[]) => void;
}

const FilesSection = ({ entity_id, canUpload = true, showSearch = true, showUpload = true, showCreateFolder = true, showDelete = true, showEdit = true, showBreadcrumbs = true, hiddenColumns, onPendingFilesChange, onFilesChange }: FilesSectionProps) => {
    const { t } = useTranslation();
    const { orgId } = useParams<{ orgId: string }>();
    const [files, setFiles] = useState<FileType[]>([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<FileType | null>(null);
    const [fileToEdit, setFileToEdit] = useState<FileType | null>(null);
    const [editFileName, setEditFileName] = useState("");
    const [folderName, setFolderName] = useState("");
    const [deletingFile, setDeletingFile] = useState(false);
    const [editingFile, setEditingFile] = useState(false);
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPath, setCurrentPath] = useState<string>("");
    const [breadcrumbs, setBreadcrumbs] = useState<FilesBreadcrumbItem[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const isReady = Boolean(entity_id);

    // Create unique input ID based on entity_id or fallback
    const fileInputId = `file-upload-input-${entity_id || 'pending'}`;

    // Fetch files function
    const fetchFiles = async (query: string = "", path: string = currentPath) => {
        if (!orgId || !entity_id) return;

        if (query) {
            setIsSearching(true);
        } else {
            setIsLoading(true);
        }

        try {
            const response = await getOrgFiles(orgId, entity_id, path, query);
            if (response.success && response.success.files) {
                setFiles(response.success.files);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("files.errorFetchingFiles") || "Error fetching files");
            }
        } catch (error) {
            toast.error(t("files.errorFetchingFiles") || "Error fetching files");
        } finally {
            setIsSearching(false);
            setIsLoading(false);
        }
    };

    // Initial load - only when entity_id is available
    useEffect(() => {
        if (entity_id) {
            fetchFiles();
        }
    }, [entity_id]);

    // Notify parent when files change
    useEffect(() => {
        onFilesChange?.(files);
    }, [files, onFilesChange]);

    // Upload pending files when entity_id becomes available
    useEffect(() => {
        if (entity_id && pendingFiles.length > 0) {
            const dataTransfer = new DataTransfer();
            pendingFiles.forEach(file => dataTransfer.items.add(file));
            handleFileUpload(dataTransfer.files);
            setPendingFiles([]);
            onPendingFilesChange?.([]);
        }
    }, [entity_id]);

    // Load more files
    const loadMoreFiles = async () => {
        if (!orgId || !entity_id || !nextPageToken || loadingMore || isLoading) return;

        setLoadingMore(true);
        try {
            const response = await getOrgFiles(orgId, entity_id, currentPath, searchQuery, nextPageToken);
            if (response.success && response.success.files) {
                setFiles(prev => [...prev, ...response.success.files]);
                setNextPageToken(response.success.next_page_token || null);
            } else {
                toast.error(t("files.errorFetchingFiles") || "Error fetching files");
            }
        } catch (error) {
            toast.error(t("files.errorFetchingFiles") || "Error fetching files");
        } finally {
            setLoadingMore(false);
            setIsLoading(false);
        }
    };

    // Handle edit confirmation
    const handleEditConfirm = (file: FileType) => {
        setFileToEdit(file);
        setEditFileName(file.name);
        setEditModalOpen(true);
    };

    // Handle edit execution
    const handleEditFile = async () => {
        if (!fileToEdit || !orgId || !editFileName.trim()) return;

        setEditingFile(true);
        try {
            const response = await patchOrgFiles(orgId, fileToEdit.id, { name: editFileName.trim() });
            if (response.success) {
                toast.success(t("files.fileUpdated", "File updated successfully"));
                // Update local state
                setFiles(prev => prev.map(f => f.id === fileToEdit.id ? { ...f, name: editFileName.trim() } : f));
                setEditModalOpen(false);
                setFileToEdit(null);
                setEditFileName("");
            } else {
                toast.error(t("files.errorUpdatingFile", "Error updating file"));
            }
        } catch (error) {
            toast.error(t("files.errorUpdatingFile", "Error updating file"));
        } finally {
            setEditingFile(false);
        }
    };

    // Handle delete confirmation
    const handleDeleteConfirm = (file: FileType) => {
        setFileToDelete(file);
        setDeleteModalOpen(true);
    };

    // Handle delete execution
    const handleDeleteFile = async () => {
        if (!fileToDelete || !orgId) return;

        setDeletingFile(true);
        try {
            const response = await postOrgFilesDelete(orgId, fileToDelete.id);
            if (response.success) {
                toast.success(t("files.fileDeleted", "File deleted successfully"));
                // Remove from local state
                setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
            } else {
                toast.error(t("files.errorDeletingFile", "Error deleting file"));
            }
        } catch (error) {
            toast.error(t("files.errorDeletingFile", "Error deleting file"));
        } finally {
            setDeletingFile(false);
            setDeleteModalOpen(false);
            setFileToDelete(null);
        }
    };

    // Handle create folder
    const handleCreateFolder = async () => {
        if (!orgId || !entity_id || !folderName.trim()) return;

        setCreatingFolder(true);
        try {
            const response = await postOrgFiles(orgId, {
                name: folderName.trim(),
                is_dir: true,
                path: currentPath !== "" ? currentPath : null,
                entity_id: entity_id
            });
            if (response.success) {
                toast.success(t("files.folderCreated", "Folder created successfully"));
                setCreateFolderModalOpen(false);
                setFolderName("");
                fetchFiles();
            } else {
                toast.error(t("files.errorCreatingFolder", "Error creating folder"));
            }
        } catch (error) {
            toast.error(t("files.errorCreatingFolder", "Error creating folder"));
        } finally {
            setCreatingFolder(false);
        }
    };

    // Handle file upload
    const handleFileUpload = async (selectedFiles: FileList) => {
        if (!canUpload) return;
        if (!orgId || !entity_id || selectedFiles.length === 0) return;

        setUploadingFiles(true);
        const fileArray = Array.from(selectedFiles);
        const uploadResults: { success: number; failed: number } = { success: 0, failed: 0 };

        try {
            // Process each file
            const uploadPromises = fileArray.map(async (file) => {
                try {
                    // Get uploader from server
                    console.log("Getting uploader for file:", file);
                    const uploaderResponse = await postOrgFilesUploader(orgId, {
                        name: file.name,
                        entity_id: entity_id,
                        content_type: file.type,
                        content_length: file.size
                    });

                    if (!uploaderResponse.success) {
                        throw new Error("Failed to get uploader");
                    }

                    const uploaderData = uploaderResponse.success.uploader;

                    // Upload file to S3 using Timbal
                    const contentUrl = await uploadFile(uploaderData, file, (progress: number) => {
                        setUploadProgress(prev => ({
                            ...prev,
                            [file.name]: progress
                        }));
                    });

                    if (!contentUrl) {
                        throw new Error("Failed to upload file to S3");
                    }

                    // Create file record on server
                    const fileResponse = await postOrgFiles(orgId, {
                        name: file.name,
                        is_dir: false,
                        path: currentPath !== "" ? currentPath : null,
                        entity_id: entity_id,
                        url: contentUrl,
                        content_length: file.size
                    });

                    if (fileResponse.success) {
                        uploadResults.success++;
                        setUploadProgress(prev => {
                            const newProgress = { ...prev };
                            delete newProgress[file.name];
                            return newProgress;
                        });
                        return { success: true, fileName: file.name };
                    } else {
                        throw new Error("Failed to create file record");
                    }
                } catch (error) {
                    uploadResults.failed++;
                    setUploadProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[file.name];
                        return newProgress;
                    });
                    console.error(`Failed to upload ${file.name}:`, error);
                    return { success: false, fileName: file.name, error };
                }
            });

            // Wait for all uploads to complete
            await Promise.all(uploadPromises);

            // Show results
            if (uploadResults.success > 0) {
                toast.success(t("files.uploadSuccess", `${uploadResults.success} file(s) uploaded successfully`));
                fetchFiles(); // Refresh the file list
            }

            if (uploadResults.failed > 0) {
                toast.error(t("files.uploadError", `${uploadResults.failed} file(s) failed to upload`));
            }

        } catch (error) {
            toast.error(t("files.uploadError", "Error uploading files"));
            console.error("Upload error:", error);
        } finally {
            setUploadingFiles(false);
            setUploadProgress({});
        }
    };

    // Handle file input change
    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            if (entity_id) {
                handleFileUpload(files);
            } else {
                // Queue files for later upload
                const newPendingFiles = [...pendingFiles, ...Array.from(files)];
                setPendingFiles(newPendingFiles);
                onPendingFilesChange?.(newPendingFiles);
            }
        }
        // Reset the input value to allow selecting the same files again
        event.target.value = '';
    };

    // Remove a pending file from the queue
    const removePendingFile = (index: number) => {
        const newPendingFiles = pendingFiles.filter((_, i) => i !== index);
        setPendingFiles(newPendingFiles);
        onPendingFilesChange?.(newPendingFiles);
    };

    // Handle folder navigation
    const handleFolderClick = (folder: FileType) => {
        if (!folder.is_dir) return;

        // Build the new path by appending folder ID to current path
        const newPath = currentPath ? `${currentPath}/${folder.id}` : folder.id;

        // Add folder to breadcrumbs
        const newBreadcrumb: FilesBreadcrumbItem = {
            id: folder.id,
            name: folder.name,
            path: newPath
        };

        setBreadcrumbs(prev => [...prev, newBreadcrumb]);
        setCurrentPath(newPath);

        // Fetch files for the new folder
        fetchFiles("", newPath);
    };

    // Handle breadcrumb navigation
    const handleBreadcrumbClick = (breadcrumb: FilesBreadcrumbItem) => {
        // Find the index of the clicked breadcrumb
        if (breadcrumb.id === "root" && breadcrumbs.length > 0) {
            setBreadcrumbs([]);
            setCurrentPath("");
            fetchFiles("", "");
            return;
        }

        const breadcrumbIndex = breadcrumbs.findIndex(b => b.id === breadcrumb.id);

        if (breadcrumbIndex !== -1) {
            // Remove all breadcrumbs after the clicked one
            const newBreadcrumbs = breadcrumbs.slice(0, breadcrumbIndex + 1);
            setBreadcrumbs(newBreadcrumbs);
            setCurrentPath(breadcrumb.path);
            // Fetch files for the selected path
            fetchFiles("", breadcrumb.path);
        }

    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                {showBreadcrumbs && (
                    <FilesBreadcrumb
                        breadcrumbs={breadcrumbs}
                        onBreadcrumbClick={handleBreadcrumbClick}
                        className="h-6 ml-1"
                    />
                )}
                <div className="flex gap-2 items-center justify-end">
                    {showSearch && <SearchBar
                        value={searchQuery}
                        className="w-full"
                        isLoading={isSearching}
                        onChange={(query) => setSearchQuery(query)}
                        onSearch={fetchFiles}
                        placeholder={t("files.searchPlaceholder", "Search files...")}
                        disabled={!isReady}
                    />}
                    {showCreateFolder && <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateFolderModalOpen(true)}
                        disabled={uploadingFiles || !isReady}
                        className="h-10"
                    >
                        <FolderPlus className="h-4 w-4" />
                        {t("files.createFolder", "Create Folder")}
                    </Button>}
                    {canUpload && showUpload && <Button
                        type="button"
                        onClick={() => document.getElementById(fileInputId)?.click()}
                        disabled={uploadingFiles}
                    >
                        {uploadingFiles ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t("files.uploading", "Uploading...")}
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                {t("files.uploadFile", "Upload Files")}
                            </>
                        )}
                    </Button>}
                    <input
                        id={fileInputId}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileInputChange}
                        accept="*/*"
                    />
                </div>
            </div>

            {/* Pending Files Queue and Dropzone (shown when entity_id not available) */}
            {!entity_id && (
                <div className="space-y-2 rounded-lg">
                    <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                        onClick={() => document.getElementById(fileInputId)?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                            const droppedFiles = e.dataTransfer.files;
                            if (droppedFiles && droppedFiles.length > 0) {
                                const newPendingFiles = [...pendingFiles, ...Array.from(droppedFiles)];
                                setPendingFiles(newPendingFiles);
                                onPendingFilesChange?.(newPendingFiles);
                            }
                        }}
                    >
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                {t("files.dropzoneText", "Drag and drop files here, or click to select")}
                            </p>
                        </div>
                    </div>

                    {pendingFiles.length > 0 && (
                        <div className="space-y-1">
                            {pendingFiles.map((file, index) => (
                                <div key={`${file.name}-${index}`} className="flex items-center justify-between text-sm bg-muted rounded-md p-2 px-4">
                                    <div className="flex items-center gap-2 truncate">
                                        <FileIcon className="h-4 w-4 text-gray-500 shrink-0" />
                                        <span className="truncate">{file.name}</span>
                                        <span className="text-muted-foreground text-xs shrink-0">
                                            ({formatSize(file.size)})
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 shrink-0"
                                        onClick={() => removePendingFile(index)}
                                    >
                                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upload Progress */}
            {uploadingFiles && Object.keys(uploadProgress).length > 0 && (
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium">{t("files.uploadProgress", "Upload Progress")}</h4>
                    {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="truncate max-w-[200px]">{fileName}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Files Table - only shown when entity_id exists */}
            {entity_id && (
                <FilesTable
                    files={files}
                    isLoading={isLoading}
                    searchQuery={searchQuery}
                    showEdit={showEdit}
                    showDelete={showDelete}
                    hiddenColumns={hiddenColumns}
                    onFolderClick={handleFolderClick}
                    onEdit={handleEditConfirm}
                    onDelete={handleDeleteConfirm}
                    emptyState={
                        canUpload &&
                        showUpload && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById(fileInputId)?.click()}
                                disabled={uploadingFiles}
                            >
                                {uploadingFiles ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t("files.uploading", "Uploading...")}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        {t("files.uploadFile", "Upload File")}
                                    </>
                                )}
                            </Button>
                        )
                    }
                />
            )}

            {/* Load More Button */}
            {nextPageToken && (
                <div className="flex justify-center mt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={loadMoreFiles}
                        disabled={loadingMore}
                        className="min-w-32"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.loading", "Loading...")}
                            </>
                        ) : (
                            t("common.loadMore", "Load More")
                        )}
                    </Button>
                </div>
            )}

            <FileEditModal
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                    if (!open) {
                        setFileToEdit(null);
                        setEditFileName("");
                    }
                }}
                file={fileToEdit}
                fileName={editFileName}
                onFileNameChange={setEditFileName}
                onSave={handleEditFile}
                isSaving={editingFile}
            />

            <FileCreateModal
                open={createFolderModalOpen}
                onOpenChange={(open) => {
                    setCreateFolderModalOpen(open);
                    if (!open) setFolderName("");
                }}
                folderName={folderName}
                onFolderNameChange={setFolderName}
                onCreate={handleCreateFolder}
                isCreating={creatingFolder}
            />

            <FileDeleteModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) setFileToDelete(null);
                }}
                file={fileToDelete}
                onConfirm={handleDeleteFile}
                isDeleting={deletingFile}
            />
        </div>
    );
};

export default FilesSection;
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Upload, X, GripVertical } from 'lucide-react';

import { ItemPhoto } from '@/types/items/items';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface GalleryPhotosItemsProps {
    existingPhotos?: ItemPhoto[];
    onChange?: (photos: PhotoItem[]) => void;
    onReorder?: (photos: PhotoItem[]) => void;
    onDelete?: (photoId: string) => void;
}

export interface PhotoItem {
    id?: string; // ID for existing photos
    file?: File; // File for new photos
    url: string;
    name: string;
    order: number;
    position?: number; // Position from API
}

const SortablePhotoCard: React.FC<{
    photo: PhotoItem;
    onRemove: () => void;
}> = ({ photo, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: photo.url });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group aspect-square rounded-lg overflow-hidden border-2 border-border bg-muted",
                isDragging && "opacity-50 z-50"
            )}
        >
            {/* Image */}
            <img
                src={photo.url}
                alt={photo.name}
                className="min-w-20 min-h-20 !w-20 !h-20 object-cover"
                loading="lazy"
            />

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-1"
            >
                <GripVertical className="h-4 w-4 text-white" />
            </div>

            {/* Remove Button */}
            <Button
                onClick={onRemove}
                size="icon"
                className="w-4 h-4 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90"
            >
                <X className="!h-3 !w-3 text-white" />
            </Button>
        </div>
    );
};

const GalleryPhotosItems: React.FC<GalleryPhotosItemsProps> = ({
    existingPhotos = [],
    onChange,
    onReorder,
    onDelete,
}) => {
    const [photos, setPhotos] = useState<PhotoItem[]>([]);

    // Initialize photos from existing photos
    useEffect(() => {
        if (existingPhotos && existingPhotos.length > 0) {
            const sortedPhotos = [...existingPhotos]
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((photo, index) => ({
                    id: photo.id,
                    url: photo.url,
                    name: photo.name,
                    order: index,
                    position: photo.position ?? undefined,
                }));
            setPhotos(sortedPhotos);
        } else {
            setPhotos([]);
        }
    }, [existingPhotos]);

    // Notify parent when photos change
    useEffect(() => {
        if (onChange) {
            onChange(photos);
        }
    }, [photos]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle file drop/selection
    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        // Create PhotoItems from files
        const newPhotos: PhotoItem[] = acceptedFiles.map((file, index) => ({
            file,
            url: URL.createObjectURL(file), // Temporary URL for preview
            name: file.name,
            order: photos.length + index,
        }));

        setPhotos(prev => [...prev, ...newPhotos]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
        },
        multiple: true,
    });

    // Handle drag end for reordering
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = photos.findIndex(p => p.url === active.id);
        const newIndex = photos.findIndex(p => p.url === over.id);

        const reorderedPhotos = arrayMove(photos, oldIndex, newIndex).map((photo, index) => ({
            ...photo,
            order: index,
            position: index,
        }));

        setPhotos(reorderedPhotos);
        
        // Notify parent about reordering
        if (onReorder) {
            onReorder(reorderedPhotos);
        }
    };

    // Handle photo removal
    const handleRemovePhoto = (photoUrl: string) => {
        const photo = photos.find(p => p.url === photoUrl);

        // If it's an existing photo with an ID, notify parent for deletion
        if (photo?.id && onDelete) {
            onDelete(photo.id);
        }

        // Revoke object URL if it was created locally
        if (photo?.file && photo.url.startsWith('blob:')) {
            URL.revokeObjectURL(photo.url);
        }

        const remainingPhotos = photos
            .filter(p => p.url !== photoUrl)
            .map((photo, index) => ({
                ...photo,
                order: index,
                position: index,
            }));

        setPhotos(remainingPhotos);
    };

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            photos.forEach(photo => {
                if (photo.file && photo.url.startsWith('blob:')) {
                    URL.revokeObjectURL(photo.url);
                }
            });
        };
    }, []);

    return (
        <div className="space-y-4">
            {photos.length === 0 ? (
                /* Dropzone - Full size when no photos */
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
                        isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                        "min-h-[170px] flex items-center justify-center"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div className="rounded-full bg-muted p-3">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        {isDragActive ? (
                            <p className="text-sm font-medium">Drop the images here</p>
                        ) : (
                            <>
                                <p className="text-sm font-medium">
                                    Drag & drop images here, or click to select
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Supports: PNG, JPG, JPEG, GIF, WebP, SVG
                                </p>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                /* Photos Gallery with Add Button */
                <div className="flex max-h-[200px] overflow-y-auto">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={photos.map(p => p.url)}
                            strategy={rectSortingStrategy}
                        >
                            <div className="flex flex-wrap gap-4 max-h-[400px] overflow-y-auto p-1">
                                {/* Add Photo Button - Always at position 0 */}
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "relative group aspect-square !w-20 !h-20 rounded-lg overflow-hidden border-2 border-dashed cursor-pointer transition-colors flex items-center justify-center",
                                        isDragActive
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                </div>

                                {/* Existing Photos */}
                                {photos.map((photo) => (
                                    <SortablePhotoCard
                                        key={photo.url}
                                        photo={photo}
                                        onRemove={() => handleRemovePhoto(photo.url)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
};

export default GalleryPhotosItems;

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { getColorFromString } from '@/utils/miscelanea';

interface Photo {
    id?: string;
    url: string;
    name?: string;
}

interface PhotoViewerModalProps {
    photos: Photo[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
    itemName?: string;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
    photos,
    initialIndex,
    isOpen,
    onClose,
    itemName = '',
}) => {
    const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

    React.useEffect(() => {
        if (!carouselApi) return;

        const handleSelect = () => {
            setCurrentIndex(carouselApi.selectedScrollSnap());
        };

        carouselApi.on('select', handleSelect);
        return () => {
            carouselApi.off('select', handleSelect);
        };
    }, [carouselApi]);

    React.useEffect(() => {
        if (carouselApi && isOpen) {
            carouselApi.scrollTo(initialIndex, true);
        }
    }, [carouselApi, initialIndex, isOpen]);

    React.useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-[90vw] w-auto p-0 bg-background border"
                showCloseButton={false}
                onKeyDown={handleKeyDown}
            >
                <div className="relative flex flex-col items-center justify-center w-full">
                    {/* Close Button */}
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    {/* Main Carousel */}
                    <div className="w-full pt-16 pb-8 px-16">
                        <Carousel
                            className="w-full group"
                            setApi={setCarouselApi}
                        >
                            <CarouselContent>
                                {photos.map((photo, index) => (
                                    <CarouselItem key={photo.id || index}>
                                        <div className="flex justify-center items-center h-full">
                                            <img
                                                src={photo.url}
                                                alt={photo.name || `${itemName} - ${index + 1}`}
                                                className="max-w-full max-h-[60vh] w-auto h-auto object-contain"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {photos.length > 1 && (
                                <>
                                    <CarouselPrevious className="-left-12 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0" />
                                    <CarouselNext className="-right-12 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0" />
                                </>
                            )}
                        </Carousel>
                    </div>

                    {/* Thumbnail Navigator */}
                    {photos.length > 1 && (
                        <div className="w-full px-8 pb-6 border-t border-border bg-muted/30">
                            <div className="flex gap-2 max-w-full mx-auto overflow-x-auto py-4 justify-center">
                                {photos.map((photo, index) => (
                                    <button
                                        key={photo.id || index}
                                        onClick={() => carouselApi?.scrollTo(index)}
                                        className={cn(
                                            "shrink-0 rounded-lg border-2 transition-all hover:border-primary/50",
                                            currentIndex === index
                                                ? "border-primary shadow-md"
                                                : "border-transparent hover:shadow"
                                        )}
                                    >
                                        <Avatar className="h-12 w-12 rounded-md">
                                            <AvatarImage
                                                src={photo.url}
                                                alt={photo.name || `${itemName} thumbnail ${index + 1}`}
                                                className="object-cover"
                                            />
                                            <AvatarFallback
                                                className="rounded-md text-sm font-bold text-white"
                                                style={{ backgroundColor: getColorFromString(itemName) }}
                                            >
                                                {itemName.slice(0, 1).toUpperCase() || "-"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

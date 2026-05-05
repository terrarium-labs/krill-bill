import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate, useParams } from 'react-router-dom';
import { useItem } from '@/app/items/contexts/ItemContext';
import { formatDecimal, formatMeasure } from '@/utils/miscelanea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getColorFromString } from '@/utils/miscelanea';
import { IconInfoItem, IconLabel } from '@/app/components/custom-labels';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { PhotoViewerModal } from '@/components/ui/photo-viewer-modal';
import { ItemHierarchy } from '@/types/general/taxonomy';
import CurrencyLabel from '@/app/components/labels/currency-label';
import DateLabel from '@/app/components/labels/date-label';

interface ItemInfoCardProps {
    showActions?: boolean;
    onEdit?: () => void;
}

export const ItemInfoCard: React.FC<ItemInfoCardProps> = ({ onEdit }) => {
    const { t } = useTranslation();
    const { item } = useItem();
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

    useEffect(() => {
        if (!carouselApi) return;

        const handleSelect = () => {
            setCurrentIndex(carouselApi.selectedScrollSnap());
        };

        carouselApi.on('select', handleSelect);
        return () => {
            carouselApi.off('select', handleSelect);
        };
    }, [carouselApi]);

    // Algorithm to order itemHierarchy by parent-child relationships
    const orderHierarchyByParent = (hierarchyArray: ItemHierarchy[]): ItemHierarchy[] => {
        if (!hierarchyArray || hierarchyArray.length === 0) return [];

        const ordered: ItemHierarchy[] = [];
        const remaining = [...hierarchyArray];

        // Helper function to find and add children recursively
        const addItemAndChildren = (parentId: string | null) => {
            // Find all items with the specified parent
            const items = remaining.filter(item =>
                parentId === null
                    ? item.parent === null
                    : item.parent?.id === parentId
            );

            // Add each item and recursively add its children
            items.forEach(item => {
                const index = remaining.indexOf(item);
                if (index > -1) {
                    remaining.splice(index, 1);
                    ordered.push(item);
                    // Recursively add children of this item
                    addItemAndChildren(item.id);
                }
            });
        };

        // Start with root items (parent === null)
        addItemAndChildren(null);

        // Handle any remaining items (in case of orphaned or circular references)
        while (remaining.length > 0) {
            const item = remaining.shift();
            if (item) ordered.push(item);
        }

        return ordered;
    };

    const getOrderedHierarchy = () => {
        if (!item.item_hierarchy || item.item_hierarchy.length === 0) return [];
        return orderHierarchyByParent(item.item_hierarchy);
    };

    const getCustomSections = () => {
        return item.sections?.filter((section: any) => section.fields?.some((field: any) => field.value)) || [];
    };

    const handleOpenPhotoModal = (index: number) => {
        setSelectedPhotoIndex(index);
        setIsPhotoModalOpen(true);
    };

    if (!item) {
        return null;
    }

    return (
        <Card className="w-full shadow-none">
            <CardHeader>
                <CardTitle>{t('items.info', 'Item Information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Item Photo Carousel */}
                {item.photos && item.photos.length > 0 && (
                    <div className="flex flex-col gap-4 pb-2">
                        {/* Main Carousel */}
                        <div className="flex justify-center items-center">
                            <Carousel
                                className="w-full max-w-72 group"
                                setApi={setCarouselApi}
                            >
                                <CarouselContent>
                                    {item.photos.map((photo, index) => (
                                        <CarouselItem key={photo.id || index}>
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => handleOpenPhotoModal(index)}
                                                    className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg transition-transform hover:scale-105"
                                                >
                                                    <Avatar className="h-32 w-32 rounded-lg cursor-pointer">
                                                        <AvatarImage src={photo.url} alt={`${item.name} - ${index + 1}`} className="object-cover" />
                                                        <AvatarFallback className="rounded-lg text-4xl font-bold text-white" style={{ backgroundColor: getColorFromString(item.name) }}>
                                                            {item.name.slice(0, 1).toUpperCase() || "-"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </button>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {item.photos.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-0 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0" />
                                        <CarouselNext className="right-0 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0" />
                                    </>
                                )}
                            </Carousel>
                        </div>

                        {/* Miniatures Gallery */}
                        {item.photos.length > 1 && (
                            <div className="flex gap-2 max-w-[224px] mx-auto overflow-x-auto pb-1">
                                {item.photos.map((photo, index) => (
                                    <button
                                        key={photo.id || index}
                                        onClick={() => {
                                            carouselApi?.scrollTo(index);
                                            handleOpenPhotoModal(index);
                                        }}
                                        className={cn(
                                            "shrink-0 rounded-lg border-2 transition-all hover:border-primary/50",
                                            currentIndex === index
                                                ? "border-primary shadow-md"
                                                : "border-transparent hover:shadow"
                                        )}
                                    >
                                        <Avatar className="h-12 w-12 rounded-md">
                                            <AvatarImage src={photo.url} alt={`${item.name} thumbnail ${index + 1}`} className="object-cover" />
                                            <AvatarFallback className="rounded-md text-xs font-bold text-white" style={{ backgroundColor: getColorFromString(item.name) }}>
                                                {item.name.slice(0, 1).toUpperCase() || "-"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Photo Viewer Modal */}
                {item.photos && item.photos.length > 0 && (
                    <PhotoViewerModal
                        photos={item.photos}
                        initialIndex={selectedPhotoIndex}
                        isOpen={isPhotoModalOpen}
                        onClose={() => setIsPhotoModalOpen(false)}
                        itemName={item.name}
                    />
                )}

                {/* Inventory & Cost Information Section */}
                {(item.pmc !== null && item.pmc !== undefined) ||
                    item.is_pmc_fixed ||
                    (item.cost_calc_days !== null && item.cost_calc_days !== undefined) ||
                    (item.total_stock !== null && item.total_stock !== undefined) ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {item.pmc !== null && item.pmc !== undefined && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <IconInfoItem
                                                    icon={"dollar-sign"}
                                                    label={item.is_pmc_fixed ? t('items.pmc', 'Fixed Cost (PMC)') : t('items.pmc', 'Calc. Cost (PMC)')}
                                                    children={<CurrencyLabel data={item.pmc} />}
                                                    onEmptyClick={onEdit}
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {item.is_pmc_fixed
                                                ? t('items.fixedPrice', 'Fixed price')
                                                : item.cost_calc_days
                                                    ? `${t('items.calculatedOver', 'Calculated over')} ${item.cost_calc_days} ${t('items.days', 'days')}`
                                                    : t('items.calculated', 'Calculated')}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            {item.sell_price !== null && item.sell_price !== undefined && (
                                <IconInfoItem
                                    icon={"dollar-sign"}
                                    label={t('items.sellPrice', 'Sell Price')}
                                    children={<CurrencyLabel data={item.sell_price?.price_quantity || 0} />
                                        + (item.sell_price?.billing_type === "recurring" && item.sell_price?.billing_period
                                            ? `/${t(`common.billingPeriod.${item.sell_price.billing_period}`, item.sell_price.billing_period)}`
                                            : "")
                                    }
                                    onEmptyClick={onEdit}
                                />
                            )}
                            {item.sell_price?.margin !== null && item.sell_price?.margin !== undefined && (
                                <IconInfoItem
                                    icon={"percent"}
                                    label={t('items.margin', 'Margin')}
                                    children={<div className="text-sm font-medium">{formatDecimal(item.sell_price?.margin || 0)} %</div>}
                                    onEmptyClick={onEdit}
                                />
                            )}

                            {item.total_stock !== null && item.total_stock !== undefined && (
                                <IconInfoItem
                                    icon={"package"}
                                    label={t('items.totalStock', 'Total Stock')}
                                    value={`${item.total_stock} ${formatMeasure(item.measure) || 'units'}`}
                                    onEmptyClick={onEdit}
                                />
                            )}
                        </div>
                    </>
                ) : null}

                <div className="pt-4 border-t border-border space-y-4">
                    <p className="text-xs text-muted-foreground font-semibold mb-3">
                        {t('items.generalInfo', 'General Information')}
                    </p>

                    {/* Name - Always shown */}
                    <IconInfoItem
                        icon={"package"}
                        label={t('items.name', 'Name')}
                        value={item.name}
                        onEmptyClick={onEdit}
                    />

                    {/* Item Code */}
                    <IconInfoItem
                        icon={"hash"}
                        label={t('items.itemCode', 'Item Code')}
                        value={item.item_code}
                        copyable
                        onEmptyClick={onEdit}
                    />

                    {/* Barcode */}
                    <IconInfoItem
                        icon={"barcode"}
                        label={t('items.barcode', 'Barcode')}
                        value={item.barcode}
                        copyable
                        onEmptyClick={onEdit}
                    />

                    {/* Description */}
                    <IconInfoItem
                        icon={"file-text"}
                        label={t('items.description', 'Description')}
                        value={item.description}
                        onEmptyClick={onEdit}
                    />

                    {/* Measure */}
                    <IconInfoItem
                        icon={"ruler"}
                        label={t('items.measure', 'Measure')}
                        value={formatMeasure(item.measure)}
                        onEmptyClick={onEdit}
                    />
                </div>

                {/* Categorization Section */}
                {getOrderedHierarchy().length > 0 && (
                    <div className="pt-4 border-t border-border space-y-4">
                        <p className="text-xs text-muted-foreground font-semibold mb-3">
                            {t('items.categorization', 'Categorization')}
                        </p>
                        <div className="flex items-center flex-wrap gap-2">
                            {getOrderedHierarchy().map((hierarchyItem, index) => (
                                <React.Fragment key={hierarchyItem.id}>
                                    <IconLabel
                                        icon={hierarchyItem.icon}
                                        text={hierarchyItem.name}
                                        color={hierarchyItem.color}
                                        showEmptyColor={false}
                                        textClassName="font-normal"
                                    />
                                    {index < getOrderedHierarchy().length - 1 && (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}





                {/* Custom Sections */}
                {getCustomSections().map((section: any) => {
                    const visibleFields = section.fields?.filter((field: any) => field.value) || [];
                    if (visibleFields.length === 0) return null;

                    return (
                        <div key={section.id} className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground font-semibold">
                                    {section.title}
                                </p>
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/${orgId}/admin/fields/items`)}>
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                {visibleFields.map((field: any) => (
                                    <div key={field.id}>
                                        <p className="text-xs text-muted-foreground">
                                            {field.name}
                                        </p>
                                        <p className="text-sm font-normal text-foreground">
                                            {field.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {/* Timestamps */}
                {(item.created_at || item.updated_at) && (
                    <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                        <div className="flex justify-between">
                            {item.created_at && (
                                <span>
                                    {t('common.created', 'Created')}: <DateLabel data={item.created_at} options={{ hide: ['seconds'] }} />
                                </span>
                            )}
                            {item.updated_at && (
                                <span>
                                    {t('common.updated', 'Updated')}: <DateLabel data={item.updated_at} options={{ hide: ['seconds'] }} />
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card >
    );
};

export default ItemInfoCard;


import React, { useState, useEffect, useRef } from "react";
import { Plus, FolderPlus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { InvoiceItem } from "@/types/invoices/invoices";
import { useInvoice } from "../../contexts/InvoiceContext";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    DragOverlay,
    pointerWithin,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import { getHeaderChildren } from "@/utils/miscelanea";
import InvoiceTotalsSection from "./invoice-totals-section";
import { InvoiceHeaderRow } from "./invoice-header-row";
import { InvoiceItemRow } from "./invoice-item-row";
import { useDroppable } from "@dnd-kit/core";
import {
    InvoiceItemsColumnLayoutProvider,
    InvoiceItemsResizableTh,
    InvoiceItemsTh,
} from "@/app/components/invoice-items-table/invoice-items-column-layout";

// Root drop zone component
const RootDropZone: React.FC<{ isOver: boolean; t: any }> = ({ isOver, t }) => {
    const { setNodeRef } = useDroppable({
        id: 'root-zone',
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "h-16 m-2 border-2 border-dashed rounded-lg flex items-center justify-center transition-all",
                isOver
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20"
                    : "border-muted-foreground/30 bg-muted/10"
            )}
        >
            <span className={cn(
                "text-sm transition-colors",
                isOver ? "text-blue-600 dark:text-blue-400 font-medium" : "text-muted-foreground"
            )}>
                {isOver
                    ? t("invoices.dropToMoveToRoot", "Drop here to move to root level")
                    : t("invoices.dragHereToMoveToRoot", "Drag here to move to root level")}
            </span>
        </div>
    );
};

const InvoiceItemsSection: React.FC = () => {
    const { t } = useTranslation();
    const {
        invoice,
        addLine,
        reorderLines,
        updateLine,
        saveInvoice
    } = useInvoice();
    const [hasInitialized, setHasInitialized] = useState(false);
    const [activeTab, setActiveTab] = useState("items");
    const [accordionValue, setAccordionValue] = useState<string | undefined>(undefined);
    const [collapsedHeaders, setCollapsedHeaders] = useState<Set<string>>(new Set());
    const seenHeadersRef = useRef<Set<string>>(new Set());
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<InvoiceItem | null>(null);

    // Use invoice data from context
    const invoiceItems = invoice.lines;
    const showItemDiscount = invoice.item_discount_enabled;
    const globalDiscountPercent = invoice.discount;

    // Separate headers and regular items
    const headerLines = invoiceItems.filter(item => item.is_header);
    const regularItems = invoiceItems.filter(item => !item.is_header);

    // Get only top-level headers (headers without parents)
    const topLevelHeaders = headerLines.filter(header => !header.parent);

    // Use calculations from context

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px of movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Initialize component
    useEffect(() => {
        setHasInitialized(true);
    }, []);

    // Set accordion: collapsed if no global discount and item discount disabled, otherwise expanded
    useEffect(() => {
        if (hasInitialized) {
            // Collapse if global discount is 0/null and item discount is disabled
            if ((globalDiscountPercent === 0 || globalDiscountPercent === null) && !showItemDiscount) {
                setAccordionValue(undefined);
            }
            // Otherwise, expand
            else {
                setAccordionValue("discount");
            }
        }
    }, [hasInitialized, globalDiscountPercent, showItemDiscount]);

    const toggleHeaderCollapse = (headerId: string) => {
        setCollapsedHeaders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(headerId)) {
                newSet.delete(headerId);
            } else {
                newSet.add(headerId);
            }
            return newSet;
        });
    };

    // Initialize new headers as collapsed by default
    useEffect(() => {
        if (headerLines.length > 0) {
            const newCollapsed: string[] = [];

            headerLines.forEach(h => {
                const headerId = h.id || `temp-${h.order}`;

                // If this is a new header we haven't seen before, collapse it by default
                if (!seenHeadersRef.current.has(headerId)) {
                    newCollapsed.push(headerId);
                    seenHeadersRef.current.add(headerId);
                }
            });

            // Only update if there are new headers
            if (newCollapsed.length > 0) {
                setCollapsedHeaders(prev => new Set([...prev, ...newCollapsed]));
            }
        }
    }, [headerLines]);

    const addHeaderLine = () => {
        if (!invoice) return;
        const newHeader: InvoiceItem = {
            id: null,
            parent: null,
            is_header: true,
            item: null,
            name: t("invoices.newHeaderName", "New header"),
            description: "",
            quantity: null,
            price: null,
            order: invoice.lines.length,
            discount: null,
            taxes: null,
            cost_price: null,
            type: null,
            is_indirect_cost: null,
            is_visible: true,
        };
        saveInvoice({ lines: [...invoice.lines, newHeader] });
    };

    // Recursive function to render headers and their children (including nested headers)
    const renderHeaderWithChildren = (header: InvoiceItem, nestingLevel: number = 0): React.ReactNode => {
        const children = getHeaderChildren(header, invoiceItems);
        const headerId = header.id || `temp-${header.order}`;
        const isCollapsed = collapsedHeaders.has(headerId);

        // Check if this header is being dragged over
        const isDropTarget = activeId && overId === headerId && activeId !== headerId;

        // Separate child headers and child items
        const childHeaders = children.filter(c => c.is_header);
        const childItems = children.filter(c => !c.is_header);

        return (
            <React.Fragment key={header.id || `line-${header.order}`}>
                <InvoiceHeaderRow
                    headerLine={header}
                    showDiscount={showItemDiscount}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => toggleHeaderCollapse(headerId)}
                    childrenCount={children.length}
                    availableHeaders={headerLines}
                    nestingLevel={nestingLevel}
                    isDropTarget={isDropTarget || false}
                />
                {!isCollapsed && (
                    <>
                        {/* Render nested headers recursively */}
                        {childHeaders.map((childHeader) =>
                            renderHeaderWithChildren(childHeader, nestingLevel + 1)
                        )}
                        {/* Render regular items */}
                        {childItems.map((child) => (
                            <InvoiceItemRow
                                key={child.id || `line-${child.order}`}
                                invoiceItem={child}
                                showDiscount={showItemDiscount}
                                isChild={true}
                                activeTab={activeTab}
                                nestingLevel={nestingLevel + 1}
                            />
                        ))}
                    </>
                )}
            </React.Fragment>
        );
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        const draggedItem = invoiceItems.find(item => {
            const itemId = item.id || `line-${item.order}`;
            return itemId === event.active.id;
        });
        setActiveItem(draggedItem || null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        setOverId(event.over?.id as string | null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);
        setOverId(null);
        setActiveItem(null);

        if (!over || active.id === over.id) return;

        // Handle dropping on root zone
        if (over.id === 'root-zone') {
            const draggedItem = invoiceItems.find(item => {
                const itemId = item.id || `line-${item.order}`;
                return itemId === active.id;
            });

            if (draggedItem && draggedItem.parent) {
                updateLine(draggedItem.order, "parent", null);
            }
            return;
        }

        // Handle dropping on a header to assign parent
        const targetHeader = headerLines.find(h => {
            const headerId = h.id || `line-${h.order}`;
            return headerId === over.id;
        });

        if (targetHeader) {
            const draggedItem = invoiceItems.find(item => {
                const itemId = item.id || `line-${item.order}`;
                return itemId === active.id;
            });

            if (draggedItem) {
                // Prevent circular references: a header cannot be moved into itself or its descendants
                if (draggedItem.is_header) {
                    const targetHeaderId = targetHeader.id || `temp-${targetHeader.order}`;
                    const draggedHeaderId = draggedItem.id || `temp-${draggedItem.order}`;

                    // Check if target is the dragged item itself
                    if (targetHeaderId === draggedHeaderId) {
                        return;
                    }

                    // Check if target is a descendant of the dragged header
                    const isDescendant = (headerId: string, potentialAncestorId: string): boolean => {
                        const header = invoiceItems.find(item => {
                            const itemId = item.id || `temp-${item.order}`;
                            return itemId === headerId;
                        });

                        if (!header || !header.parent) return false;

                        const parentId = header.parent.id || `temp-${header.parent.id}`;
                        if (parentId === potentialAncestorId) return true;

                        return isDescendant(parentId, potentialAncestorId);
                    };

                    if (isDescendant(targetHeaderId, draggedHeaderId)) {
                        return;
                    }
                }

                // Assign this item to the header
                const parentId = targetHeader.id || `temp-${targetHeader.order}`;
                updateLine(draggedItem.order, "parent", {
                    id: parentId,
                    name: targetHeader.name
                });
                return;
            }
        }

        // Default behavior: reorder items (only if not dropping on a header)
        const oldIndex = invoiceItems.findIndex((item) => {
            const itemId = item.id || `line-${item.order}`;
            return itemId === active.id;
        });
        const newIndex = invoiceItems.findIndex((item) => {
            const itemId = item.id || `line-${item.order}`;
            return itemId === over.id;
        });

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const reorderedItems = arrayMove(invoiceItems, oldIndex, newIndex);
            reorderLines(reorderedItems);
        }
    };

    // Ensure at least one line exists after initialization
    useEffect(() => {
        if (hasInitialized && invoiceItems.length === 0) {
            addLine();
        }
    }, [hasInitialized, invoiceItems.length, addLine]);

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t("invoices.items", "Invoice Items")}</h3>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="flex items-center gap-2 border-none rounded-md" activeClassName='border-none rounded-md'>
                            <TabsTrigger className="py" value="items">Articulos</TabsTrigger>
                            <TabsTrigger className="py-0" value="group">Partidas</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <InvoiceItemsColumnLayoutProvider
                    variant="purchase"
                    showDiscount={showItemDiscount}
                >
                <DndContext
                    sensors={sensors}
                    collisionDetection={pointerWithin}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >

                    <div className="min-w-0 w-full overflow-x-auto">
                    <Table className="table-fixed w-max min-w-full">
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <InvoiceItemsTh col="grip" className="w-8 p-1" />
                                <InvoiceItemsResizableTh col="concept">
                                    {t("invoices.concept", "Concepto")}
                                </InvoiceItemsResizableTh>
                                <InvoiceItemsResizableTh col="description">
                                    {t("invoices.description", "Descripción")}
                                </InvoiceItemsResizableTh>
                                <InvoiceItemsResizableTh col="quantity">
                                    {t("invoices.quantity", "Cantidad")}
                                </InvoiceItemsResizableTh>
                                <InvoiceItemsResizableTh col="price">
                                    {t("invoices.price", "Precio")}
                                </InvoiceItemsResizableTh>
                                {showItemDiscount && (
                                    <InvoiceItemsResizableTh col="discount">
                                        {t("invoices.discount", "Dto. %")}
                                    </InvoiceItemsResizableTh>
                                )}
                                <InvoiceItemsResizableTh col="taxes">
                                    {t("invoices.taxes", "Impuestos")}
                                </InvoiceItemsResizableTh>
                                <InvoiceItemsResizableTh col="total">
                                    {t("invoices.total", "Total")}
                                </InvoiceItemsResizableTh>
                                <InvoiceItemsTh col="actions" className="w-8 p-1" />
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {activeTab === "items" ? (
                                <SortableContext
                                    items={regularItems.map(item => item.id || `line-${item.order}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {regularItems.length > 0 ? (
                                        regularItems.map((invoiceItem) => (
                                            <InvoiceItemRow
                                                key={invoiceItem.id || `line-${invoiceItem.order}`}
                                                invoiceItem={invoiceItem}
                                                showDiscount={showItemDiscount}
                                                activeTab={activeTab}
                                            />
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={showItemDiscount ? 9 : 8} className="h-32 text-center text-muted-foreground text-sm">
                                                {t("invoices.noItems", "No items yet. Click 'Añadir línea' to get started.")}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </SortableContext>
                            ) : (
                                <>

                                    {topLevelHeaders.length > 0 ? (
                                        <>
                                            {/* Render top-level headers recursively (they will render their nested children) */}
                                            {topLevelHeaders.map((header) => renderHeaderWithChildren(header, 0))}
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={showItemDiscount ? 9 : 8} className="h-32 text-center text-muted-foreground text-sm">
                                                {t("invoices.noHeaders", "No partidas yet. Click 'Añadir partida' to get started.")}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {/* Show items without parent */}
                                    {regularItems.filter(item => !item.parent).length > 0 && (
                                        <>
                                            <TableRow className="bg-muted/20">
                                                <TableCell colSpan={showItemDiscount ? 9 : 8} className="h-8 text-xs text-muted-foreground italic px-4">
                                                    {t("invoices.unassignedItems", "Items sin partida")}
                                                </TableCell>
                                            </TableRow>
                                            {regularItems.filter(item => !item.parent).map((item) => (
                                                <InvoiceItemRow
                                                    key={item.id || `line-${item.order}`}
                                                    invoiceItem={item}
                                                    showDiscount={showItemDiscount}
                                                    activeTab={activeTab}
                                                />
                                            ))}
                                        </>
                                    )}
                                    {/* Root drop zone - shown when dragging an item with a parent */}
                                    {activeId && (
                                        <TableRow>
                                            <TableCell colSpan={showItemDiscount ? 9 : 8} className="p-0">
                                                <RootDropZone
                                                    isOver={overId === 'root-zone'}
                                                    t={t}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )}


                                </>
                            )}
                        </TableBody>
                    </Table>
                    </div>

                    {/* Drag Overlay - shows the item following the cursor */}
                    <DragOverlay dropAnimation={null}>
                        {activeItem ? (
                            <div className="opacity-90 shadow-2xl">
                                <Table>
                                    <TableBody>
                                        {activeItem.is_header ? (
                                            <InvoiceHeaderRow
                                                headerLine={activeItem}
                                                showDiscount={showItemDiscount}
                                                isCollapsed={false}
                                                onToggleCollapse={() => { }}
                                                childrenCount={0}
                                                availableHeaders={headerLines}
                                                nestingLevel={0}
                                            />
                                        ) : (
                                            <InvoiceItemRow
                                                invoiceItem={activeItem}
                                                showDiscount={showItemDiscount}
                                                isChild={false}
                                                activeTab={activeTab}
                                            />
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
                </InvoiceItemsColumnLayoutProvider>

                {/* Add Line Button and Discount/Totals Section */}
                <div className="flex justify-between items-start gap-4 flex-wrap">
                    {/* Left side - Add Line Buttons */}
                    <div className="flex gap-2">
                        {activeTab === "items" ? (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={addLine}
                            >
                                <Plus className="h-4 w-4" />
                                {t("invoices.addLine", "Añadir línea")}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={addHeaderLine}
                                >
                                    <FolderPlus className="h-4 w-4" />
                                    {t("invoices.addPartida", "Añadir partida")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={addLine}
                                >
                                    <Plus className="h-4 w-4" />
                                    {t("invoices.addLine", "Añadir línea")}
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Right side - Discount Accordion and Totals */}
                    {invoiceItems.length > 0 && (
                        <InvoiceTotalsSection
                            accordionValue={accordionValue}
                            onAccordionValueChange={setAccordionValue}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default InvoiceItemsSection;

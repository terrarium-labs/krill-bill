import { DeleteModal } from "@/app/components/modals/delete-modal";

interface DeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    itemName?: string;
    itemDescription?: string;
    onConfirm: () => void;
    isDeleting: boolean;
}

const DeleteDialog = ({
    open,
    onOpenChange,
    title,
    description,
    itemName,
    itemDescription,
    onConfirm,
    isDeleting,
}: DeleteDialogProps) => {
    return (
        <DeleteModal
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={
                <>
                    {description}
                    {itemName && (
                        <div className="mt-2 p-2 bg-muted rounded">
                            <strong>{itemName}</strong>
                            {itemDescription && ` ${itemDescription}`}
                        </div>
                    )}
                </>
            }
            onConfirm={onConfirm}
            isDeleting={isDeleting}
        />
    );
};

export default DeleteDialog;

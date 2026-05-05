import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface FilesBreadcrumbItem {
    id: string;
    name: string;
    path: string;
}

export interface FilesBreadcrumbProps {
    breadcrumbs: FilesBreadcrumbItem[];
    onBreadcrumbClick: (breadcrumb: FilesBreadcrumbItem) => void;
    className?: string;
}

export const FilesBreadcrumb = ({
    breadcrumbs,
    onBreadcrumbClick,
    className,
}: FilesBreadcrumbProps) => {
    const rootBreadcrumb: FilesBreadcrumbItem = { id: "root", name: "Files", path: "" };

    return (
        <Breadcrumb className={className}>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink
                        onClick={() => onBreadcrumbClick(rootBreadcrumb)}
                        className="cursor-pointer"
                    >
                        Files
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
                {breadcrumbs.length <= 3 ? (
                    breadcrumbs.map((breadcrumb, index) => (
                        <div key={breadcrumb.id} className="flex gap-2 justify-center items-center">
                            <BreadcrumbItem>
                                {index === breadcrumbs.length - 1 ? (
                                    <BreadcrumbPage>{breadcrumb.name}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink
                                        onClick={() => onBreadcrumbClick(breadcrumb)}
                                        className="cursor-pointer"
                                    >
                                        {breadcrumb.name}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                        </div>
                    ))
                ) : (
                    <>
                        <BreadcrumbItem>
                            <BreadcrumbLink
                                onClick={() => onBreadcrumbClick(breadcrumbs[0])}
                                className="cursor-pointer"
                            >
                                {breadcrumbs[0].name}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex h-5 w-5 items-center justify-center">
                                    <BreadcrumbEllipsis className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {breadcrumbs.slice(1, -1).map((breadcrumb) => (
                                        <DropdownMenuItem
                                            key={breadcrumb.id}
                                            onClick={() => onBreadcrumbClick(breadcrumb)}
                                            className="cursor-pointer"
                                        >
                                            {breadcrumb.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{breadcrumbs[breadcrumbs.length - 1].name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
};

export default FilesBreadcrumb;

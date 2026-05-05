import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";

export interface WebSearchResult {
    title: string;
    url: string;
    page_age?: string | null;
    type: string;
}

interface WebSearchSourcesProps {
    results: WebSearchResult[];
}

const getDomain = (url: string) => {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return url;
    }
};

const getFaviconUrl = (url: string) => {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return "";
    }
};

const WebSearchSources = ({ results }: WebSearchSourcesProps) => {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();

    if (!results || results.length === 0) return null;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center w-fit gap-2 px-3 py-1.5 mt-1 mb-1 rounded-full border border-border hover:bg-muted/50 transition-colors text-xs cursor-pointer"
            >
                <div className="flex -space-x-1.5">
                    {results.slice(0, 5).map((result, i) => (
                        <img
                            key={i}
                            src={getFaviconUrl(result.url)}
                            alt=""
                            className="w-4 h-4 rounded-full border-2 border-background bg-muted"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                            }}
                        />
                    ))}
                </div>
                <span className="font-normal text-xs">
                    {results.length} {t("chat.sources", "fuentes")}
                </span>
            </button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="right" className="p-0 sm:max-w-md gap-0">
                    <SheetHeader className="px-5 border-b border-border py-4">
                        <SheetTitle className="text-sm">
                            {results.length} {t("chat.sources", "fuentes")}
                        </SheetTitle>
                        <SheetDescription className="text-xs">
                            {t("chat.sources_subtitle", "Fuentes de la búsqueda web")}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto">
                        {results.map((result, i) => (
                            <a
                                key={i}
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors group border-b border-border last:border-b-0"
                            >
                                <img
                                    src={getFaviconUrl(result.url)}
                                    alt=""
                                    className="w-5 h-5 mt-0.5 rounded-sm shrink-0"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                />
                                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                    <span className="text-[11px] text-muted-foreground leading-tight">
                                        {getDomain(result.url)}
                                    </span>
                                    <span className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                                        {result.title}
                                    </span>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 mt-1 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
                            </a>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default WebSearchSources;

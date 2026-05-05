import { useState } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useSaleInvoice } from "../../contexts/SaleInvoiceContext";
import { useOrg } from "@/app/contexts/OrgContext";
import InvoicePdfDocument, { type PdfDisplayMode } from "./invoice-pdf-document";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/shadcn-io/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const InvoicePdfViewer = () => {
    const { t } = useTranslation();
    const { invoice, calculations } = useSaleInvoice();
    const { org } = useOrg();
    const [displayMode, setDisplayMode] = useState<PdfDisplayMode>("lines");
    const [partidaLevels, setPartidaLevels] = useState(1);

    if (!org) return null;

    const documentProps = { invoice, org, calculations, displayMode, partidaLevels };
    const fileName = `${invoice.invoice_number || "draft-invoice"}.pdf`;

    return (
        <div className="flex flex-col h-[calc(100vh-8.5rem)]">
            <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <Tabs value={displayMode} onValueChange={(v) => setDisplayMode(v as PdfDisplayMode)}>
                        <TabsList className="flex items-center gap-2 border-none rounded-md" activeClassName='border-none rounded-md'>
                            <TabsTrigger className="py" value="lines">Lines</TabsTrigger>
                            <TabsTrigger className="py-0" value="partidas">Partidas</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {displayMode === "partidas" && (
                        <div className="flex items-center gap-1.5">
                            <Label htmlFor="partida-levels" className="text-xs text-muted-foreground whitespace-nowrap">
                                {t("invoices.pdf.levels", "Levels")}:
                            </Label>
                            <Input
                                id="partida-levels"
                                type="number"
                                min={1}
                                value={partidaLevels}
                                onChange={(e) => setPartidaLevels(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 h-7 text-xs"
                            />
                        </div>
                    )}
                </div>

                <PDFDownloadLink
                    document={<InvoicePdfDocument {...documentProps} />}
                    fileName={fileName}
                >
                    {({ loading }) => (
                        <Button size="sm" variant="outline" disabled={loading}>
                            {loading ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            {t("invoices.downloadPdf", "Download PDF")}
                        </Button>
                    )}
                </PDFDownloadLink>
            </div>

            {/* PDF Preview */}
            <ScrollArea className="flex-1 rounded-md border border-border overflow-hidden">
                <PDFViewer
                    width="100%"
                    height="100%"
                    style={{ border: "none", minHeight: "calc(100vh - 12rem)" }}
                >
                    <InvoicePdfDocument {...documentProps} />
                </PDFViewer>
            </ScrollArea>
        </div>
    );
};

export default InvoicePdfViewer;

import React, { useState, useEffect } from "react";
import { CreditCard, Building2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { getPaymentsMethods } from "@/api/clients/payment-methods/payment-methods";
import { ClientPaymentMethod } from "@/types/clients/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useClient } from "@/app/dashboard/contexts/DashboardClientContext";
import Tag from "@/app/components/tag/tag";

const ClientPaymentMethodsCard: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<ClientPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { client } = useClient();
  const { t } = useTranslation();
  const { orgId } = useParams<{ orgId: string; clientId: string }>();

  const loadPaymentMethods = async (pageToken: string | null = null, append = false) => {
    if (!orgId || !client.id) return;
    setIsLoading(true);
    try {
      const response = await getPaymentsMethods(orgId, client.id, pageToken);
      if (response.success) {
        const newPaymentMethods = response.success.payment_methods || [];
        setPaymentMethods(append ? [...paymentMethods, ...newPaymentMethods] : newPaymentMethods);
        setNextPageToken(response.success.next_page_token || null);
      } else {
        toast.error(t("clients.errorLoadingPaymentMethods", "Failed to load payment methods"));
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
      toast.error(t("clients.errorLoadingPaymentMethods", "Failed to load payment methods"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const handleCopyIban = async (paymentMethod: ClientPaymentMethod) => {
    if (!paymentMethod.iban) {
      toast.error(t("clients.noIbanToCopy", "No IBAN available to copy"));
      return;
    }
    try {
      await navigator.clipboard.writeText(paymentMethod.iban);
      setCopiedId(paymentMethod.id);
      toast.success(t("clients.ibanCopied", "IBAN copied to clipboard"));
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Error copying IBAN:", error);
      toast.error(t("clients.errorCopyingIban", "Failed to copy IBAN"));
    }
  };

  return (
    <>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("clients.paymentMethods", "Payment Methods")}</CardTitle>
        </CardHeader>
        <CardContent className="py-0 px-4">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-4">
              <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-md font-medium text-muted-foreground">{t("clients.noPaymentMethods", "No payment methods yet")}</h3>
              <p className="text-muted-foreground mb-4 text-xs">{t("clients.noPaymentMethodsDescription", "No payment methods on file")}</p>
            </div>
          ) : (
            <div>
              {paymentMethods.map((paymentMethod, index) => (
                <div key={paymentMethod.id}>
                  <div className="hover:bg-accent/50 transition-colors p-2 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleCopyIban(paymentMethod)}
                      >
                        <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex flex-col items-start gap-0 min-w-0 flex-1">
                          <div className="flex items-center gap-2 w-full">
                            <h4 className="font-medium text-sm truncate">{paymentMethod.bank}</h4>
                            {paymentMethod.is_default && <Tag text={t("clients.default", "Default")} color="yellow" />}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">{paymentMethod.iban}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleCopyIban(paymentMethod)}
                      >
                        {copiedId === paymentMethod.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {index < paymentMethods.length - 1 && <Separator />}
                </div>
              ))}
              {nextPageToken && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => loadPaymentMethods(nextPageToken, true)} disabled={isLoading}>
                    {isLoading ? t("common.loading", "Loading...") : t("common.loadMore", "Load More")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ClientPaymentMethodsCard;

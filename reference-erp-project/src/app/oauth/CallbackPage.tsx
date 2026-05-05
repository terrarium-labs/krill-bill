import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { postOauth } from "@/api/oauth/oauth";
import { useTranslation } from "react-i18next";

type Status = "loading" | "success" | "error";

const CallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const response = await postOauth({
          code: searchParams.get("code") ?? "",
          state: searchParams.get("state") || "",
          error: searchParams.get("error") || "",
        });
        if (response.error) {
          throw new Error(response.error);
        }
        setStatus("success");
        if (response.success?.redirect_url) {
          window.location.href = response.success.redirect_url;
        }
      } catch (err) {
        console.error("Error handling callback:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
        setTimeout(() => {
          const lastOrgId = localStorage.getItem("last-org-id");
          if (lastOrgId) {
            navigate(`/${lastOrgId}/profile/integrations`);
          } else {
            navigate("/orgs");
          }
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[400px] shadow-none">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" && t("oauth.connecting", "Connecting...") }
            {status === "success" && t("oauth.connected", "Connected!")}
            {status === "error" && t("oauth.connectionFailed", "Connection Failed")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-muted-foreground text-center">{error}</p>
              <p className="text-xs text-muted-foreground">{t("oauth.redirectingToHome", "Redirecting to home...")}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CallbackPage;

import { createContext, useContext, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { getOrg } from "@/api/orgs/orgs";
import { getMeOrgs } from "@/api/me/me";
import { Org } from "@/types/general/org";

interface OrgContextType {
  org: Org;
  setOrg: (org: any | null) => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const OrgProvider = ({ children }: { children: React.ReactNode }) => {
  const { orgId } = useParams<{ orgId: string }>();
  const [org, setOrg] = useState<any | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  const fetchOrg = async (targetOrgId: string) => {
    try {
      const response = await getOrg(targetOrgId);
      if (response.success) {
        setOrg(response.success.org);
        // Guardar el orgId en localStorage para futuras sesiones
        localStorage.setItem("last-org-id", targetOrgId);
      } else {
        toast.error("Error al obtener la organización");
        navigate("/orgs");
      }
    } catch (error) {
      toast.error("Error al obtener la organización");
      navigate("/orgs");
    } finally {
      setIsInitializing(false);
    }
  };

  const initializeOrg = async () => {
    // Si ya hay orgId en la URL, usarlo directamente
    if (orgId) {
      await fetchOrg(orgId);
      return;
    }

    // Si no hay orgId, intentar obtener el último usado desde localStorage
    const lastOrgId = localStorage.getItem("last-org-id");
    if (lastOrgId) {
      // Verificar que la organización aún existe y el usuario tiene acceso
      try {
        const response = await getOrg(lastOrgId);
        if (response.success) {
          navigate(`/${lastOrgId}`, { replace: true });
          return;
        }
      } catch (error) {
        // Si falla, continuar con el flujo normal
        localStorage.removeItem("last-org-id");
      }
    }

    // Si no hay orgId guardado o falló, obtener la primera organización del usuario
    try {
      const response = await getMeOrgs("", null);
      if (response.success && response.success.orgs.length > 0) {
        const firstOrg = response.success.orgs[0];
        navigate(`/${firstOrg.id}`, { replace: true });
      } else {
        // Si no tiene organizaciones, ir a la página de organizaciones
        navigate("/orgs", { replace: true });
        setIsInitializing(false);
      }
    } catch (error) {
      toast.error("Error al obtener las organizaciones");
      navigate("/orgs", { replace: true });
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initializeOrg();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  if (isInitializing || !org) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <OrgContext.Provider value={{ org, setOrg }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error("useOrg must be used within an OrgContext");
  }
  return context;
};

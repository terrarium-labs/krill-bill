import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, Trash, Loader2, Save } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getColorFromString } from "@/utils/miscelanea";
import { uploadFile } from "@/utils/aws";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getOrg, patchOrg } from "@/api/orgs/orgs";

const CompanyLogoSection = () => {
  const { t } = useTranslation();

  const { orgId } = useParams<{ orgId: string }>();
  const [org, setOrg] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);


  useEffect(() => {
    const fetchOrg = async () => {
      const response = await getOrg(orgId || "");
      setOrg(response.success.org);
      setIsLoading(false);
    };
    fetchOrg();
  }, [orgId, getOrg]);

  // Subir nuevo logo y guardar inmediatamente
  const handleLogoSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }

    setUploading(true);
    try {
      // 1. Crear payload para obtener URL de upload
      const photoData = {
        name: file.name,
        content_type: file.type,
        content_length: file.size,
      };

      const payload = {
        name: org?.name || "",
        description: org?.description || "",
        photo: photoData,
      };

      console.log("📤 DATOS PARA OBTENER URL:", payload);
      const resp = await patchOrg(orgId || "", payload);

      if (resp?.success?.uploader) {
        const uploadResp = resp.success.uploader;

        console.log("🚀 Iniciando subida a S3...");
        const logoUrl = await uploadFile(
          uploadResp,
          file,
          (progress: number) => {
            console.log(`📊 Progreso: ${progress}%`);
          }
        );
        console.log("✅ Archivo subido, URL resultante:", logoUrl);

        // 2. Actualizar la organización con la URL final
        const finalPayload = {
          name: org?.name || "",
          description: org?.description || "",
          photo_url: uploadResp.content_url, // Usar la URL del content_url del uploader
        };

        console.log("📤 ACTUALIZANDO CON URL FINAL:", finalPayload);
        const finalResp = await patchOrg(orgId || "", finalPayload);

        if (finalResp?.success) {
          // Refrescar datos de la organización
          const response = await getOrg(orgId || "");
          setOrg(response.success.org);

          toast.success("Logo actualizado correctamente");
        } else {
          console.error("❌ Error en actualización final:", finalResp.error);
          toast.error("Error al guardar el logo");
        }
      } else {
        console.error("❌ No se encontró 'uploader' en la respuesta");
        toast.error("Error al obtener URL de subida");
      }
    } catch (e: any) {
      console.error("💥 ERROR COMPLETO:", e);
      toast.error(e.message || "Error al subir logo");
    }
    setUploading(false);

    // Limpiar input
    event.target.value = "";
  };

  // Eliminar logo
  const handleDelete = async () => {
    if (!org.photo_url || !window.confirm("¿Eliminar logo de la empresa?"))
      return;

    setUploading(true);
    try {
      const payload: any = { photo: null };
      if (org?.name) payload.name = org.name;
      if (org?.description) payload.description = org.description;

      await patchOrg(orgId || "", payload);

      // Refrescar datos de la organización
      const response = await getOrg(orgId || "");
      setOrg(response.success.org);

      toast.success("Logo eliminado correctamente");
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast.error("Error al eliminar logo");
    }
    setUploading(false);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const payload = {
        name: org.name,
        description: org.description,
      };

      const resp = await patchOrg(orgId || "", payload);
      if (resp.success) {
        console.log("🚀 RESPUESTA DEL PATCH:", resp);

        // Refrescar datos de la organización
        const response = await getOrg(orgId || "");
        setOrg(response.success.org);

        toast.success("Información actualizada correctamente");
      } else {
        console.error("Error updating org:", resp.error);
        const errorMessage = resp.error?.detail?.[0]?.msg || resp.error?.message || "Error al actualizar la información";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating org:", error);
      toast.error("Error al actualizar la información");
    }
    setUpdating(false);
  };

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin" />;
  }

  return (
    <>
      <section
        id="company-logo"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Separator className="col-span-3" />
        <div className="col-span-1">
          <p>{t("settings.company_logo", "Company logo")}</p>
          <p className="text-sm text-muted-foreground">
            {t("settings.company_logo_description", "Update your company logo")}
          </p>
        </div>
        <div className="col-span-1 flex items-center gap-6">
          <Avatar className="h-20 w-20 min-h-20 min-w-20 rounded-lg">
            <AvatarImage
              src={org.photo_url}
              alt={org.name}
            />
            <AvatarFallback
              style={{
                backgroundColor: getColorFromString(org.name),
              }}
              className="text-primary-foreground font-semibold rounded-lg"
            >
              {org.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
       

          {/* Botón para subir/cambiar logo */}
          <label className="cursor-pointer">
            <Button
              variant="outline"
              className="rounded-lg"
              disabled={uploading}
              asChild
            >
              <div>
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {t("common.upload", "Upload")}
              </div>
            </Button>
            <input
              type="file"
              className="hidden"
              onChange={handleLogoSelect}
              accept="image/*"
              disabled={uploading}
            />
          </label>

          {/* Botón para eliminar logo */}
          <Button
            variant="outline"
            className="rounded-lg text-destructive"
            onClick={handleDelete}
            disabled={uploading || !org.photo_url}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash className="w-4 h-4" />
            )}
            {t("common.delete", "Delete")}
          </Button>
        </div>
      </section>
      <section
        id="company-name"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Separator className="col-span-3" />
        <div className="col-span-1">
          <p>{t("settings.company_name", "Company name")}</p>
          <p className="text-sm text-muted-foreground">
            {t(
              "settings.company_name_description",
              "Update your company name and description"
            )}
          </p>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <Input
            type="text"
            value={org.name}
            onChange={(e) => setOrg({ ...org, name: e.target.value })}
            placeholder={t("settings.company_name", "Company name")}
          />

          <Textarea
            value={org.description || ""}
            onChange={(e) => setOrg({ ...org, description: e.target.value })}
            placeholder={t(
              "settings.company_description",
              "Company description"
            )}
          />
        </div>
        <div className="flex justify-end col-span-3">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={handleUpdate}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t("common.update", "Update")}
          </Button>
        </div>
      </section>
    </>
  );
};

export default CompanyLogoSection;

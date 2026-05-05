import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { IconInfoItem } from "@/app/components/custom-labels";
import ColorLabel from "@/app/components/labels/color-label";
import { useOnCallGroup } from "@/app/on-call/contexts/OnCallGroupContext";

interface OnCallGroupInfoCardProps {
  onEdit?: () => void;
}

const OnCallGroupInfoCard = ({ onEdit }: OnCallGroupInfoCardProps) => {
  const { t } = useTranslation();
  const { group } = useOnCallGroup();

  return (
    <Card className="w-full shadow-none">
      <CardHeader>
        <CardTitle>{t("on-call.groups.info", "Group Information")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <IconInfoItem
          icon="tag"
          label={t("on-call.groups.columns.name", "Name")}
          value={group.name}
          onEmptyClick={onEdit}
        />

        <IconInfoItem
          icon="palette"
          label={t("on-call.groups.columns.color", "Color")}
          onEmptyClick={onEdit}
        >
          <ColorLabel data={group.color ?? ""} />
        </IconInfoItem>

        <div className="pt-4 border-t border-border">
          <IconInfoItem
            icon="file-text"
            label={t("on-call.groups.columns.description", "Description")}
            value={group.description ?? undefined}
            onEmptyClick={onEdit}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default OnCallGroupInfoCard;

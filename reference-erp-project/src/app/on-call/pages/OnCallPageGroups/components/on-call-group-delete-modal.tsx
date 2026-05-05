import { useTranslation } from "react-i18next";
import { DeleteModal } from "@/app/components/modals/delete-modal";
import { OnCallGroup } from "@/types/field-service/on-call/groups";

interface OnCallGroupDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: OnCallGroup | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

const OnCallGroupDeleteModal = ({
  open,
  onOpenChange,
  group,
  onConfirm,
  isDeleting,
}: OnCallGroupDeleteModalProps) => {
  const { t } = useTranslation();

  return (
    <DeleteModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("on-call.groups.deleteGroup", "Delete group")}
      description={t(
        "on-call.groups.deleteGroupDescription",
        "Are you sure you want to delete '{{name}}'? This action cannot be undone.",
        { name: group?.name ?? "" }
      )}
      onConfirm={onConfirm}
      isDeleting={isDeleting}
    />
  );
};

export default OnCallGroupDeleteModal;
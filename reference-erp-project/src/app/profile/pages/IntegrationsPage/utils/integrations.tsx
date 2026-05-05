import { Integration } from "@/types/miscelanea";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

export const useIntegrations = (): Integration[] => {
  const { t } = useTranslation();

  return [
    {
      id: "google_mail",
      name: t("integrations.gmail", "Gmail"),
      description: t("integrations.gmailDescription", "Connect Gmail to send and receive emails"),
      icon: <Icon icon="logos:google-gmail" className="h-5 w-5" />,
      iconBg: "bg-red-50",
    },
    {
      id: "google_calendar",
      name: t("integrations.googleCalendar", "Google Calendar"),
      description: t("integrations.googleCalendarDescription", "Sync your Google Calendar events"),
      icon: <Icon icon="logos:google-calendar" className="h-5 w-5" />,
      iconBg: "bg-blue-50",
    },
    {
      id: "outlook",
      name: t("integrations.outlook", "Microsoft Outlook"),
      description: t("integrations.outlookDescription", "Connect Outlook for email and calendar"),
      icon: <Icon icon="vscode-icons:file-type-outlook" className="h-5 w-5" />,
      iconBg: "bg-blue-50",
    },
  ];
};
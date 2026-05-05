import { LogOut, Moon, Languages, Check, Key, Link2 } from "lucide-react";

import { UserAvatar } from "./user-avatar";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { supportedLanguages } from "@/lib/language";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

interface UserDropdownContentProps {
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  showApiKeys?: boolean;
  showLanguageSelector?: boolean;
  disableProfileClick?: boolean;
  onLogout: () => void;
  onGoToProfile?: () => void;
  onGoToApiKeys?: () => void;
  onGoToIntegrations?: () => void;
  className?: string;
}

export function UserDropdownContent({
  side = "bottom",
  align = "end",
  sideOffset = 4,
  showApiKeys = true,
  disableProfileClick = false,
  onLogout,
  onGoToProfile,
  onGoToApiKeys,
  onGoToIntegrations,
  className,
}: UserDropdownContentProps) {
  const { theme, setTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    toast.success(t("common.success"));
  };

  const renderFlag = (flag: string) => {
    if (flag.startsWith("emojione:")) {
      return <Icon icon={flag} width={16} height={16} />;
    }
    return (
      <img
        src={flag}
        alt="flag"
        className="rounded-full object-cover h-4 w-4"
        width={16}
        height={16}
      />
    );
  };

  const { user } = useUser();

  return (
    <DropdownMenuContent
      className={`w-56 rounded-lg ${className || ""}`}
      side={side}
      align={align}
      sideOffset={sideOffset}
    >
      <DropdownMenuItem
        className={`p-0 font-normal ${disableProfileClick
            ? "cursor-default focus:bg-transparent"
            : "cursor-pointer focus:bg-accent"
          }`}
        onClick={disableProfileClick ? undefined : onGoToProfile}
      >
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm w-full">
          <UserAvatar src={user.photo_url} name={user.first_name + " " + user.last_name} size="md" />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.first_name + " " + user.last_name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      </DropdownMenuItem>


      <DropdownMenuGroup>
        {showApiKeys && onGoToApiKeys && (
          <DropdownMenuItem className="cursor-pointer" onClick={onGoToApiKeys}>
            <Key />
            {t("profile.manageApiKeys", "API Keys")}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem className="cursor-pointer" onClick={onGoToIntegrations}>
          <Link2 />
          {t("profile.manageIntegrations", "Integrations")}
        </DropdownMenuItem>

        <DropdownMenuItem>
          <div className="flex items-center gap-2 justify-between w-full">
            <div className="flex items-center gap-2">
              <Moon />
              {t("common.darkMode", "Dark Mode")}
            </div>
            <Switch
              checked={theme === "dark"}
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={() => {
                setTheme(theme === "dark" ? "light" : "dark");
              }}
            />
          </div>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span>{t("common.language", "Language")}</span>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {supportedLanguages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className="gap-2 cursor-pointer"
              >
                {renderFlag(language.flag)}
                <span>{t(`languages.${language.code}`)}</span>
                {language.code === i18n.language && (
                  <div className="ml-auto">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuGroup>


      <DropdownMenuItem variant="destructive" onClick={onLogout}>
        <LogOut />
        {t("common.logOut", "Log Out")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}

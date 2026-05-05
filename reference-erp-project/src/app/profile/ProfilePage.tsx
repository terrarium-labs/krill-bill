import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { supportedLanguages } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getColorFromString } from "@/utils/miscelanea";
import PageHeader from "@/app/components/page-header";
import { PhoneInput } from "@/app/components/forms-elements/phone-input";
import { patchMe } from "@/api/me/me";

// ---------------------------------------------------------------------------
// Profile form
// ---------------------------------------------------------------------------

const profileFormSchema = (t: ReturnType<typeof useTranslation>["t"]) =>
  z.object({
    first_name: z
      .string()
      .min(1, t("validation.firstNameRequired", "First name is required"))
      .min(2, t("validation.firstNameMinLength", "First name must be at least 2 characters"))
      .max(50, t("validation.firstNameMaxLength", "First name must be less than 50 characters"))
      .trim(),
    last_name: z
      .string()
      .min(1, t("validation.lastNameRequired", "Last name is required"))
      .min(2, t("validation.lastNameMinLength", "Last name must be at least 2 characters"))
      .max(50, t("validation.lastNameMaxLength", "Last name must be less than 50 characters"))
      .trim(),
    phone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (value) => {
          if (!value || value === "") return true;
          return /^\+\d{7,15}$/.test(value);
        },
        t("validation.phoneInvalid", "Please enter a valid phone number")
      ),
    lang: z.string().min(1, t("validation.languageRequired", "Language is required")),
  });

// ---------------------------------------------------------------------------
// ProfilePage
// ---------------------------------------------------------------------------

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useUser();

  const schema = profileFormSchema(t);
  type ProfileFormValues = z.infer<typeof schema>;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      lang: i18n.language,
    },
  });

  const { isSubmitting } = form.formState;

  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        lang: user.lang || i18n.language,
      });
    }
  }, [user, i18n.language, form]);

  const handleLanguageChange = (value: string) => {
    form.setValue("lang", value);
    if (value !== i18n.language) {
      i18n.changeLanguage(value);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const newUser = { ...user, ...values };
      const resp = await patchMe(newUser);
      if (resp.success) {
        setUser({ ...newUser });
      } else {
        toast.error(t("profile.userUpdateError", "Error updating user"));
      }
      toast.success(t("profile.userUpdateSuccess", "Profile updated successfully"));
    } catch {
      toast.error(t("profile.userUpdateError", "Error updating user"));
    }
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

  return (
    <div className="flex flex-col gap-4">
      {!user ? (
        <div className="flex items-center justify-center h-72">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <PageHeader
            title={t("profile.title", "Profile")}
            description={t("profile.description", "Update your profile information")}
            showBackButton
            docs={{ slug: "pd_mod_profile" }}
            action={
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={form.handleSubmit(onSubmit)}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("profile.updating", "Updating")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t("profile.saveChanges", "Save changes")}
                  </>
                )}
              </Button>
            }
          />

          <Form {...form}>
            <div className="flex flex-col gap-4">
              <PageHeader
                className="mt-8 mb-6 max-w-md mx-auto"
                title={`${user?.first_name} ${user?.last_name}`}
                description={user?.email || ""}
                beforeTextChildren={
                  <Avatar className="h-14 w-14 rounded-full">
                    <AvatarImage
                      src={user?.photo_url}
                      alt={user?.first_name || "User"}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                    <AvatarFallback
                      className="h-14 w-14 rounded-full text-2xl font-bold text-white"
                      style={{
                        backgroundColor: getColorFromString(
                          user?.first_name || "User"
                        ),
                      }}
                    >
                      {user?.first_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                }
                showBackButton={false}
              />

              <div className="grid grid-cols-1 gap-4 w-full max-w-md mx-auto">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.first_name", "First Name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("profile.first_namePlaceholder", "First name")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.last_name", "Last Name")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("profile.last_namePlaceholder", "Last name")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="space-y-2">
                          <FormLabel>{t("common.email", "Email")}</FormLabel>
                          <Input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="opacity-50 relative"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t("profile.emailTooltip", "To change your email, please contact support")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <PhoneInput
                  form={form}
                  name="phone"
                  label={t("common.phone", "Phone")}
                  placeholder={t("profile.phonePlaceholder", "Enter phone number")}
                />

                <FormField
                  control={form.control}
                  name="lang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.language", "Language")}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleLanguageChange(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="cursor-pointer w-full">
                            <SelectValue
                              placeholder={t("profile.languagePlaceholder", "Select language")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {supportedLanguages.map((language) => (
                            <SelectItem key={language.code} value={language.code}>
                              <div className="flex items-center gap-2">
                                {renderFlag(language.flag)}
                                {t(`languages.${language.code}`)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Form>
        </>
      )}
    </div>
  );
};

export default ProfilePage;

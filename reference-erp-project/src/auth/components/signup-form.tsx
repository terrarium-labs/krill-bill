import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@iconify/react"
import { useTranslation, Trans } from 'react-i18next'
import { useState, FormEvent } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router'

export function SignUpForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const { t } = useTranslation();
    const { signUp, loginWithGoogle, loginWithMicrosoft, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error(t('auth.passwordsDontMatch', "Passwords don't match"));
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await signUp(email, password);
            if (error) {
                toast.error(error.message || 'Failed to create account');
            } else {
                toast.success(t('auth.accountCreated', "Account created successfully"));
                navigate('/');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setIsGoogleLoading(true);
        try {
            const { error } = await loginWithGoogle();
            if (error) {
                toast.error(error.message || 'Failed to sign up with Google');
            }
        } catch (error) {
            toast.error('An unexpected error occurred with Google sign up');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleMicrosoftSignUp = async () => {
        setIsMicrosoftLoading(true);
        try {
            const { error } = await loginWithMicrosoft();
            if (error) {
                toast.error(error.message || 'Failed to sign up with Microsoft');
            }
        } catch (error) {
            toast.error('An unexpected error occurred with Microsoft sign up');
        } finally {
            setIsMicrosoftLoading(false);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">{t('auth.createAccountTitle', "Create account")}</h1>
                                <p className="text-muted-foreground text-balance">
                                    {t('auth.createAccountSubtitle', "Create your account to continue")}
                                </p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full cursor-pointer"
                                    onClick={handleGoogleSignUp}
                                    disabled={loading || isSubmitting || isGoogleLoading || isMicrosoftLoading}
                                >
                                    {isGoogleLoading ? (
                                        <Icon icon="lucide:loader-2" className="animate-spin" width={18} />
                                    ) : (
                                        <Icon icon="flat-color-icons:google" width={26} />
                                    )}
                                    <span>{isGoogleLoading ? t('common.loading') : t('auth.signUpWithGoogle', "Sign up with Google")}</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="w-full cursor-pointer"
                                    onClick={handleMicrosoftSignUp}
                                    disabled={loading || isSubmitting || isGoogleLoading || isMicrosoftLoading}
                                >
                                    {isMicrosoftLoading ? (
                                        <Icon icon="lucide:loader-2" className="animate-spin" width={18} />
                                    ) : (
                                        <Icon icon="logos:microsoft-icon" width={18} />
                                    )}
                                    <span>{isMicrosoftLoading ? t('common.loading') : t('auth.signUpWithMicrosoft', "Sign up with Microsoft")}</span>
                                </Button>
                            </div>
                            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                                <span className="bg-card text-muted-foreground relative z-10 px-2">
                                    {t('auth.orContinueWithEmail', "Or continue with email")}
                                </span>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="email">{t('auth.email', "Email")}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t('auth.emailPlaceholder', "Email")}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading || isSubmitting}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="password">{t('auth.password', "Password")}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading || isSubmitting}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="confirmPassword">{t('auth.confirmPassword', "Confirm password")}</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder={t('auth.confirmPasswordPlaceholder', "Confirm password")}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading || isSubmitting}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full cursor-pointer"
                                disabled={loading || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Icon icon="lucide:loader-2" className="animate-spin" />
                                        {t('common.loading', "Loading")}
                                    </>
                                ) : (
                                    t('auth.register', "Register")
                                )}
                            </Button>
                            <div className="text-center text-sm">
                                {t('auth.alreadyHaveAccount', "Already have an account?")}{" "}
                                <Link to="/" className="underline underline-offset-4 hover:text-primary">
                                    {t('auth.login', "Login")}
                                </Link>
                            </div>
                        </div>
                    </form>
                    <div className="bg-muted relative hidden md:block">
                        <img
                            src="/auth.jpeg"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover brightness-80"
                        />
                    </div>
                </CardContent>
            </Card>
            <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
                <Trans
                    i18nKey="auth.agreementText"
                    defaults="By continuing, you agree to our {{termsLink}} and {{privacyLink}}"
                    components={{
                        termsLink: <a href="#" />,
                        privacyLink: <a href="#" />
                    }}
                    values={{
                        termsLink: t('auth.termsOfService', "Terms of service"),
                        privacyLink: t('auth.privacyPolicy', "Privacy policy")
                    }}
                />
            </div>
        </div>
    )
} 
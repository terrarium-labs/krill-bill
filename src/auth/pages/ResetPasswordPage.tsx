import { ResetPasswordForm } from "@/auth/components/reset-password-form"

const ResetPasswordPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="w-full max-w-4xl px-4">
                <ResetPasswordForm />
            </div>
        </div>
    )
}

export default ResetPasswordPage 
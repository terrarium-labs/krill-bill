import { LoginForm } from "@/auth/components/login-form"

const LogInPages = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="w-full max-w-4xl px-4">
                <LoginForm />
            </div>
        </div>
    )
}

export default LogInPages
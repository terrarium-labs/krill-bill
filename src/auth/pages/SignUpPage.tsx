import { SignUpForm } from "@/auth/components/signup-form"

const SignUpPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="w-full max-w-4xl px-4">
                <SignUpForm />
            </div>
        </div>
    )
}

export default SignUpPage 
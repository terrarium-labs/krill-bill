import { Calendar } from "lucide-react";
import confetti from "canvas-confetti";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/utils/miscelanea";
import { EmployeeAvatar } from "@/app/components/avatars/employee-avatar";
import Employee from "@/types/employees/employees";

interface BirthdayFeedCardProps {
    birthday: Employee;
}

export const BirthdayFeedCard = ({ birthday }: BirthdayFeedCardProps) => {

    const handleCardClick = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) =>
            Math.random() * (max - min) + min;

        const interval = window.setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);
    };

    return (
        <Card
            className="overflow-visible py-0 shadow-none border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={handleCardClick}
        >

            <div className="flex items-center gap-3 p-3">

                {/* Content */}
                <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                    {/* Avatar */}
                    <EmployeeAvatar employee={birthday} showJobTitle={true} />
                    {/* Date - Right Aligned */}
                    <div className="flex items-center gap-2 text-sm shrink-0">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{formatDate(birthday.date_of_birth, { showTime: false, showYear: false })}</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default BirthdayFeedCard;


import type { LucideIcon } from "lucide-react";
import {
    AlignLeft,
    Building2,
    Cake,
    Calendar,
    CircleChevronDown,
    CircleDot,
    IdCard,
    Image as ImageIcon,
    Landmark,
    Mail,
    Mailbox,
    MapPin,
    Phone,
    Signature,
    SquareCheck,
    User,
    UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SignaturitFieldType } from "@/types/general/signing-requests";

const SIGNATURIT_FIELD_TYPE_ICONS: Record<SignaturitFieldType, LucideIcon> = {
    signature: Signature,
    name: User,
    surname: UserRound,
    date: Calendar,
    city: MapPin,
    textArea: AlignLeft,
    Company: Building2,
    checkbox: SquareCheck,
    radio: CircleDot,
    image: ImageIcon,
    dropdown: CircleChevronDown,
    email: Mail,
    phone: Phone,
    zip: Mailbox,
    dni: IdCard,
    age: Cake,
    iban: Landmark,
};

export function SignaturitFieldTypeIcon({
    type,
    className,
}: {
    type: SignaturitFieldType;
    className?: string;
}) {
    const Icon = SIGNATURIT_FIELD_TYPE_ICONS[type];
    return <Icon className={cn("shrink-0", className)} aria-hidden />;
}

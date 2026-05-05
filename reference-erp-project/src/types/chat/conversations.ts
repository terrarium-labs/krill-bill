import { Employee } from "@/types/employees/employees";

export interface CharlesConversation {
    group_id: string;
    employee: Employee;
    last_message_sent_at: string;
    last_message_status: string;
    number_of_messages: number;
    conversation_cost: number;
    created_at: string;
    updated_at: string;
}

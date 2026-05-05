export interface Invitation {
    id: string;
    email: string;
    last_sent_at: string;
    created_at: string;
}

export interface InvitationsResponse {
    invitations: Invitation[];
    next_page_token?: string;
}

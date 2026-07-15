export interface ContributionTrendItem {
  date: string;
  total: string;
}

export interface ContributionTrendResponse {
  status: string;
  data: ContributionTrendItem[];
}

export type InvitationStatus = "pending" | "accepted" | "expired";

export interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  roleId: number;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationsPagination {
  limit: number;
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface InvitationsResponse {
  status: string;
  data: {
    invitations: Invitation[];
    pagination: InvitationsPagination;
  };
}

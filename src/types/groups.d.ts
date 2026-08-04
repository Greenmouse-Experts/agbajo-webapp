export interface GroupManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Group {
  id: string;
  groupName: string;
  contributionAmount: string | number;
  frequency: string;
  frequencyAmount: number;
  minMembers: number;
  maxMembers?: number;
  startDate: string;
  type: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  planId: string;
  managers: GroupManager[];
}

export interface GroupDetail {
  id: string;
  groupName: string;
  contributionAmount: string | number;
  frequency: string;
  frequencyAmount: number;
  minMembers: number;
  maxMembers?: number;
  startDate: string;
  type: string;
  createdAt: string;
  createdBy: string;
  managers: GroupManager[];
}

export interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Plan {
  id: string;
  name: string;
  contributionAmount: string;
  frequency: string;
  frequencyAmount: number;
}

export type ContributionFrequency = "daily" | "weekly" | "monthly";
export type MemberStatus = "active" | "pending" | "suspended" | "removed";

export interface MyGroup {
  id: string;
  group_name: string;
  manager: string;
  contribution_amount: number;
  frequency: ContributionFrequency;
  min_members: number;
  current_cycle: number;
  member_status: MemberStatus;
}

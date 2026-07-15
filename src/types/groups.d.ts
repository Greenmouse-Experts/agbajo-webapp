export interface Group {
  id: string;
  groupName: string;
  contributionAmount: number;
  frequency: string;
  frequencyAmount: number;
  maxMembers: number;
  startDate: string;
  type: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  planId: string;
  managers: GroupManager[];
}
export interface GroupManager {
  id: string;
  userId: string;
  groupId: string;
  role: string;
  createdAt: string;
  email: string;
  firstName: string;
  lastName: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  contributionAmount: string;
  frequency: string;
  frequencyAmount: number;
}

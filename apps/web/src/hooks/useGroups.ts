import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

/* ─── Types ─── */

export interface GroupMember {
  id: string;
  name: string;
  initial: string;
  color: string;
}

export interface GroupData {
  id: string;
  name: string;
  category: string;
  totalExpense: number;
  memberCount: number;
  members: GroupMember[];
  lastActivity: string;
  userBalance: number; // positive = owed to you, negative = you owe
  inviteCode?: string;
}

interface GroupsApiResponse {
  message: string;
  groups: GroupData[];
}

export interface GroupExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  paidBy: string;
  date: string;
}

export interface GroupBalance {
  memberId: string;
  name: string;
  balance: number;
}

export interface GroupSettlement {
  from: string;
  to: string;
  amount: number;
}

export interface GroupActivity {
  id: string;
  type: "expense" | "settlement" | "info";
  user: string;
  action: string;
  target?: string;
  timestamp: string;
}

export interface GroupDetailsData extends GroupData {
  expenses: GroupExpense[];
  balances: GroupBalance[];
  settlements: GroupSettlement[];
  activity: GroupActivity[];
}

interface CreateGroupPayload {
  name: string;
  description?: string;
  category: string;
}

/* ─── Fetch all groups for the authenticated user ─── */

async function fetchGroups(): Promise<GroupData[]> {
  const { data } = await apiClient.get<GroupsApiResponse>("/groups");
  return data.groups;
}

export function useGroups() {
  return useQuery<GroupData[]>({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    staleTime: 1000 * 60 * 2, // Consider data fresh for 2 minutes
    retry: 2,
  });
}

/* ─── Fetch single group details ─── */

async function fetchGroupById(id: string): Promise<GroupDetailsData> {
  const { data } = await apiClient.get<{
    message: string;
    group: GroupDetailsData;
  }>(`/groups/${id}`);
  return data.group;
}

export function useGroup(id: string | undefined) {
  return useQuery<GroupDetailsData>({
    queryKey: ["group", id],
    queryFn: () => fetchGroupById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });
}

/* ─── Create a new group ─── */

async function createGroup(payload: CreateGroupPayload) {
  const { data } = await apiClient.post("/groups", payload);
  return data;
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      // Invalidate the groups query to refetch the list after creation
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

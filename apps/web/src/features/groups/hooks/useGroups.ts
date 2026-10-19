import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/apiClient";
import type { CreateSettlementInput, ExpensePayments, ExpenseSplit } from "@fettl/shared";
export interface GroupMember {
  id: string;
  name: string;
  avatarUrl: string | null;
  initial: string;
  color: string;
}
import { toast } from "sonner";
import { groupKeys } from "./queryKeys";

/* ─── View Models ─── */

export interface GroupData {
  id: string;
  name: string;
  category: string;
  memberCount: number;
  totalExpense: number;
  members: GroupMember[];
  lastActivity: string;
  userBalance: number;
}

export interface GroupExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  splitMethod: string;
  paidBy: string;
  paidById: string;
  paidByAvatar?: string | null;
  date: string;
  notes?: string | null;
  receiptUrl?: string | null;
  splitCount: number;
  splits: (ExpenseSplit & {
    percentage?: number | null;
    shares?: number | null;
  })[];
}

export interface GroupBalance {
  memberId: string;
  name: string;
  balance: number;
}

export interface GroupSettlement {
  from: string;
  fromId: string;
  fromVpa: string | null;
  to: string;
  toId: string;
  toVpa: string | null;
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
  inviteCode: string;
  hasOlderExpenses: boolean;
  expenses: GroupExpense[];
  balances: GroupBalance[];
  settlements: GroupSettlement[];
  pendingPayments: {
    id: string;
    payerId: string;
    receiverId: string;
    amount: number;
    note: string | null;
    expenseTitle?: string | null;
  }[];
  activity: GroupActivity[];
}

interface GroupsApiResponse {
  message: string;
  groups: GroupData[];
}

export interface ContactData {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
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
    queryKey: groupKeys.all,
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
    queryKey: groupKeys.detail(id!),
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
    onError: () => toast.error("Couldn't create the group. Please try again."),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
  });
}

/* ─── Join a group ─── */

async function joinGroup(inviteCode: string) {
  const { data } = await apiClient.post("/groups/join", { inviteCode });
  return data;
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinGroup,
    onSuccess: () => {
      // Invalidate to fetch the newly joined group
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
    onError: () => {
      toast.error("Couldn't join the group. Please check the code.");
    },
  });
}

/* ─── Fetch Group Contacts ─── */

async function fetchGroupContacts(groupId: string): Promise<ContactData[]> {
  const { data } = await apiClient.get<{
    message: string;
    contacts: ContactData[];
  }>(`/groups/${groupId}/contacts`);
  return data.contacts;
}

export function useGroupContacts(groupId: string | undefined) {
  return useQuery<ContactData[]>({
    queryKey: groupKeys.contacts(groupId!),
    queryFn: () => fetchGroupContacts(groupId!),
    enabled: !!groupId,
  });
}

/* ─── Add Member Directly ─── */

async function addMemberDirectly({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {
  const { data } = await apiClient.post(`/groups/${groupId}/members`, {
    userId,
  });
  return data;
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMemberDirectly,
    onSuccess: (_, variables) => {
      // Refetch the group details and contacts after adding a member
      queryClient.invalidateQueries({
        queryKey: groupKeys.detail(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: groupKeys.contacts(variables.groupId),
      });
    },
    onError: () => {
      toast.error("Couldn't add member. Try again.");
    },
  });
}

/* ─── Add Member By Email ─── */

async function addMemberByEmail({
  groupId,
  email,
}: {
  groupId: string;
  email: string;
}) {
  const { data } = await apiClient.post(`/groups/${groupId}/members/email`, {
    email,
  });
  return data;
}

export function useAddMemberByEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMemberByEmail,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: groupKeys.detail(variables.groupId),
      });
      queryClient.invalidateQueries({
        queryKey: groupKeys.contacts(variables.groupId),
      });
    },
    onError: () => {
      toast.error("Couldn't add member by email. Try again.");
    },
  });
}

/* ─── Leave Group ─── */

async function leaveGroup(groupId: string) {
  const { data } = await apiClient.post(`/groups/${groupId}/leave`);
  return data;
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.all });
    },
    onError: () => {
      toast.error("Couldn't leave the group. Try again.");
    },
  });
}

/* ─── Mark as Paid (Manual Settlement) ─── */

type MarkAsPaidPayload = CreateSettlementInput & { groupId: string };

async function markAsPaid({ groupId, ...body }: MarkAsPaidPayload) {
  const { data } = await apiClient.post(`/groups/${groupId}/settlements`, body);
  return data;
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsPaid,
    onSettled: () => queryClient.invalidateQueries({ queryKey: groupKeys.all }),
  });
}

export function useExpensePayments(groupId: string, expenseId: string) {
  return useQuery({
    queryKey: [...groupKeys.detail(groupId), "expense-payments", expenseId],
    queryFn: async () => {
      const { data } = await apiClient.get<ExpensePayments>(
        `/groups/${groupId}/settlements/expenses/${expenseId}`,
      );
      return data;
    },
    refetchOnMount: "always",
  });
}

export function useReviewPayment(groupId: string) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "CONFIRMED" | "REJECTED";
    }) => apiClient.patch(`/groups/${groupId}/settlements/${id}`, { status }),
    onSuccess: () => toast.success("Payment reviewed"),
    onError: () =>
      toast.error("Couldn't review this payment. Check the current balances."),
    onSettled: () =>
      Promise.all([
        cache.invalidateQueries({ queryKey: groupKeys.all }),
        cache.invalidateQueries({ queryKey: ["analytics"] }),
      ]),
  });
}

export function useExpensePages(group: GroupDetailsData) {
  type Page = Pick<GroupDetailsData, "expenses" | "hasOlderExpenses">;
  return useInfiniteQuery({
    queryKey: [...groupKeys.detail(group.id), "expenses"],
    initialPageParam: "",
    initialData: {
      pages: [
        { expenses: group.expenses, hasOlderExpenses: group.hasOlderExpenses },
      ],
      pageParams: [""],
    },
    queryFn: async ({ pageParam }) =>
      (
        await apiClient.get<Page>(`/groups/${group.id}/expenses`, {
          params: { cursor: pageParam || undefined },
        })
      ).data,
    getNextPageParam: (last) =>
      last.hasOlderExpenses ? last.expenses.at(-1)?.id : undefined,
  });
}

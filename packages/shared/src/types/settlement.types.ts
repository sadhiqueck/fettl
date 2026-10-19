export type SettlementStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED'

export interface ExpensePayments {
  availableAmount: number
  receiverVpa: string | null
  payments: {
    id: string
    payerId: string
    name: string
    amount: number
    status: SettlementStatus
    note: string | null
  }[]
}

export interface Settlement {
  id: string
  payer: { id: string; name: string; avatarUrl: string | null }
  receiver: { id: string; name: string; avatarUrl: string | null }
  amount: number
  status: SettlementStatus
  note: string | null
  createdAt: string
}

export interface OptimizedSettlement {
  fromUserId: string
  fromName: string
  toUserId: string
  toName: string
  amount: number
}

export interface BalanceSummary {
  userId: string
  name: string
  avatarUrl: string | null
  netBalance: number
}

export interface GroupBalances {
  groupId: string
  summary: BalanceSummary[]
  optimizedSettlements: OptimizedSettlement[]
}

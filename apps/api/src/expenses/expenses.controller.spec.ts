import { ExpensesController } from './expenses.controller';
import type { ExpensesService } from './expenses.service';
import type { ChatGateway } from '../chat/chat.gateway';

it('broadcasts a deletion only after the group ledger accepts it', async () => {
  const emit = jest.fn();
  const service = {
    deleteExpense: jest.fn().mockRejectedValue(new Error('Expense not found')),
  };
  const gateway = { server: { to: () => ({ emit }) } };
  const controller = new ExpensesController(
    service as unknown as ExpensesService,
    gateway as unknown as ChatGateway,
  );
  await expect(
    controller.deleteExpense('group', 'expense', 'payer'),
  ).rejects.toThrow();
  expect(service.deleteExpense).toHaveBeenCalledWith(
    'payer',
    'group',
    'expense',
  );
  expect(emit).not.toHaveBeenCalled();
});

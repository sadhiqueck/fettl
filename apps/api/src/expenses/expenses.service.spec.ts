import { balanceChanges } from './expenses.service';

describe('expense ledger', () => {
  it('credits a payer who covered the entire bill for others', () => {
    const changes = balanceChanges({
      paidById: 'a',
      amount: 101,
      splits: [
        { userId: 'b', amount: 51 },
        { userId: 'c', amount: 50 },
      ],
    });
    expect(Object.fromEntries(changes)).toEqual({ a: 101, b: -51, c: -50 });
  });

  it('subtracts the payer’s own share exactly once', () => {
    const changes = balanceChanges({
      paidById: 'a',
      amount: 101,
      splits: [
        { userId: 'a', amount: 51 },
        { userId: 'b', amount: 50 },
      ],
    });
    expect(Object.fromEntries(changes)).toEqual({ a: 50, b: -50 });
  });
});

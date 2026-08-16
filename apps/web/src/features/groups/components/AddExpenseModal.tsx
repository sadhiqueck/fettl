import { useState, type FormEvent } from "react";
import {
  allocatePaise,
  createExpenseSchema,
  type CreateExpenseInput,
} from "@fettl/shared";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useUserProfile } from "@/shared/hooks/useUser";
import { useUpload } from "@/shared/hooks/useUpload";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { formatCurrency } from "@/shared/lib/format";
import { useAddExpense } from "../hooks/useExpense";
import { useUpdateExpense } from "../hooks/useExpenseActions";
import type { GroupMember, GroupExpense } from "../hooks/useGroups";

type Method = CreateExpenseInput["splitMethod"];
const methods: Record<Method, string> = {
  EQUAL: "Equally",
  EXACT: "Exact amounts",
  PERCENTAGE: "By percentage",
  SHARES: "By shares",
  ITEMIZED: "By item",
};
const categories = createExpenseSchema.shape.category.removeDefault().options;
const cents = (input: string) => Math.round(Number(input) * 100);
const blankItem = () => ({
  id: crypto.randomUUID(),
  name: "",
  price: "",
  people: [] as string[],
});
type Item = ReturnType<typeof blankItem>;
type Props = {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  members: GroupMember[];
  expense?: GroupExpense;
};

function splitExpense(
  method: Method,
  amount: number,
  people: string[],
  values: Record<string, string>,
  items: Item[],
  extras: number,
) {
  if (method === "ITEMIZED") {
    const amounts = new Map<string, number>();
    for (const item of items) {
      const price = cents(item.price);
      if (!(price > 0) || !item.people.length)
        throw new Error("Set a price and choose participants for every item.");
      const parts = allocatePaise(
        price,
        item.people.map(() => 1),
      );
      item.people.forEach((id, index) =>
        amounts.set(id, (amounts.get(id) ?? 0) + parts[index]),
      );
    }
    if (!amounts.size || extras < 0)
      throw new Error("Add at least one item with a positive price.");
    const extraParts = allocatePaise(extras, [...amounts.values()]);
    return [...amounts].map(([userId, part], index) => ({
      userId,
      amount: part + extraParts[index],
    }));
  }
  if (!people.length) throw new Error("Choose at least one participant.");
  const inputs = people.map((id) => Number(values[id] || 0));
  if (inputs.some((value) => !Number.isFinite(value) || value < 0))
    throw new Error("Enter a valid value for each participant.");
  if (method === "EXACT") {
    const parts = people.map((userId) => ({
      userId,
      amount: cents(values[userId] || "0"),
    }));
    if (parts.reduce((sum, s) => sum + s.amount, 0) !== amount)
      throw new Error("The individual amounts must add up to the bill.");
    return parts;
  }
  const weights =
    method === "EQUAL"
      ? people.map(() => 1)
      : method === "PERCENTAGE"
        ? inputs.map((v) => Math.round(v * 100))
        : inputs;
  if (method === "PERCENTAGE" && weights.reduce((a, b) => a + b, 0) !== 10000)
    throw new Error("Percentages must total 100%.");
  if (
    method === "SHARES" &&
    weights.some((v) => !Number.isSafeInteger(v) || v < 1)
  )
    throw new Error("Enter at least one whole share for each participant.");
  const parts = allocatePaise(amount, weights);
  return people.map((userId, i) => ({
    userId,
    amount: parts[i],
    ...(method === "PERCENTAGE"
      ? { percentage: weights[i] / 100 }
      : method === "SHARES"
        ? { shares: weights[i] }
        : {}),
  }));
}

export function AddExpenseModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  members,
  expense,
}: Props) {
  const { data: me } = useUserProfile();
  const add = useAddExpense(groupId);
  const update = useUpdateExpense(groupId);
  const upload = useUpload(groupId);
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [payer, setPayer] = useState(expense?.paidById ?? me?.id ?? "");
  const [category, setCategory] = useState(expense?.category ?? "OTHER");
  const [date, setDate] = useState(
    format(expense ? new Date(expense.date) : new Date(), "yyyy-MM-dd"),
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [receipt, setReceipt] = useState(expense?.receiptUrl ?? "");
  // Historical itemized receipts retain each member's final amount, including tax and tip.
  const [method, setMethod] = useState<Method>(expense ? "EXACT" : "EQUAL");
  const [people, setPeople] = useState(
    expense?.splits.map((s) => s.userId) ?? members.map((m) => m.id),
  );
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(
      expense?.splits.map((s) => [s.userId, String(s.amount)]) ?? [],
    ),
  );
  const [items, setItems] = useState<Item[]>(() => [blankItem()]);
  const [tax, setTax] = useState("");
  const [tip, setTip] = useState("");
  const [error, setError] = useState("");
  const busy = add.isPending || update.isPending || upload.isUploading;
  const extras = cents(tax) + cents(tip);
  const total =
    method === "ITEMIZED"
      ? items.reduce((sum, item) => sum + cents(item.price), extras)
      : cents(amount);
  let parts: CreateExpenseInput["splits"] = [];
  let splitError = "";
  try {
    parts = splitExpense(method, total, people, values, items, extras);
  } catch (err) {
    splitError = err instanceof Error ? err.message : "Check your split.";
  }
  function patchItem(id: string, changes: Partial<Item>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (splitError) {
      setError(splitError);
      return;
    }
    const timestamp =
      expense && date === format(new Date(expense.date), "yyyy-MM-dd")
        ? expense.date
        : new Date(date + "T12:00:00").toISOString();
    const result = createExpenseSchema.safeParse({
      title,
      amount: total,
      paidById: payer,
      splits: parts,
      splitMethod: method,
      date: timestamp,
      category,
      notes: notes.trim(),
      receiptUrl: receipt || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (expense) {
      const moneyChanged =
        method !== "EXACT" ||
        total !== Math.round(expense.amount * 100) ||
        payer !== expense.paidById ||
        parts.length !== expense.splits.length ||
        parts.some(
          (p) =>
            !expense.splits.some(
              (s) =>
                s.userId === p.userId &&
                Math.round(s.amount * 100) === p.amount,
            ),
        );
      const data = moneyChanged
        ? result.data
        : {
            title: result.data.title,
            category: result.data.category,
            date: timestamp,
            notes: notes.trim(),
          };
      update.mutate(
        {
          expenseId: expense.id,
          data: { ...data, receiptUrl: receipt || null },
        },
        { onSuccess: onClose },
      );
    } else add.mutate(result.data, { onSuccess: onClose });
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>{groupName}</DialogDescription>
        </DialogHeader>
        <form className="expense-editor" onSubmit={submit}>
          <label>
            What was it for?
            <Input
              required
              maxLength={100}
              value={title}
              placeholder="Dinner, groceries, train tickets…"
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <div className="editor-pair">
            <label>
              Amount (₹)
              <Input
                required
                type="number"
                min=".01"
                max="21474836.47"
                step=".01"
                readOnly={method === "ITEMIZED"}
                value={
                  method === "ITEMIZED" ? (total / 100).toFixed(2) : amount
                }
                placeholder="0.00"
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              Paid by
              <select value={payer} onChange={(e) => setPayer(e.target.value)}>
                {members.map((m) => (
                  <option value={m.id} key={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend>Split the bill</legend>
            <label>
              Split method
              <select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value as Method);
                  setValues({});
                  setError("");
                }}
              >
                {Object.entries(methods).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {method !== "ITEMIZED" ? (
              <div className="editor-members">
                {members.map((m) => (
                  <div key={m.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={people.includes(m.id)}
                        onChange={(e) =>
                          setPeople(
                            e.target.checked
                              ? [...people, m.id]
                              : people.filter((id) => id !== m.id),
                          )
                        }
                      />
                      {m.name}
                    </label>
                    {people.includes(m.id) &&
                      (method === "EQUAL" ? (
                        <span>
                          {formatCurrency(
                            (parts.find((s) => s.userId === m.id)?.amount ??
                              0) / 100,
                          )}
                        </span>
                      ) : (
                        <Input
                          aria-label={`${m.name}, ${methods[method]}`}
                          type="number"
                          min={method === "SHARES" ? 1 : 0}
                          step={method === "SHARES" ? 1 : ".01"}
                          max={method === "PERCENTAGE" ? 100 : undefined}
                          required
                          value={values[m.id] ?? ""}
                          onChange={(e) =>
                            setValues({ ...values, [m.id]: e.target.value })
                          }
                        />
                      ))}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {items.map((item, i) => (
                  <div className="editor-item" key={item.id}>
                    <div className="editor-pair">
                      <label>
                        Item {i + 1}
                        <Input
                          placeholder="Item name"
                          value={item.name}
                          onChange={(e) =>
                            patchItem(item.id, { name: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Price (₹)
                        <Input
                          type="number"
                          min=".01"
                          step=".01"
                          required
                          value={item.price}
                          onChange={(e) =>
                            patchItem(item.id, { price: e.target.value })
                          }
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {members.map((m) => (
                        <label className="inline-choice" key={m.id}>
                          <input
                            type="checkbox"
                            checked={item.people.includes(m.id)}
                            onChange={(e) =>
                              patchItem(item.id, {
                                people: e.target.checked
                                  ? [...item.people, m.id]
                                  : item.people.filter((id) => id !== m.id),
                              })
                            }
                          />
                          {m.name}
                        </label>
                      ))}
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove item ${i + 1}`}
                          onClick={() =>
                            setItems(items.filter((row) => row.id !== item.id))
                          }
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItems([...items, blankItem()])}
                >
                  <Plus /> Add item
                </Button>
                <div className="editor-pair">
                  <label>
                    Tax (₹)
                    <Input
                      type="number"
                      min="0"
                      step=".01"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                    />
                  </label>
                  <label>
                    Tip (₹)
                    <Input
                      type="number"
                      min="0"
                      step=".01"
                      value={tip}
                      onChange={(e) => setTip(e.target.value)}
                    />
                  </label>
                </div>
              </>
            )}
          </fieldset>
          <details>
            <summary>Category, date, notes and receipt</summary>
            <div className="editor-pair">
              <label>
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <Input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            </div>
            <label>
              Notes
              <textarea
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <label>
              Receipt image
              <Input
                type="file"
                accept="image/*"
                disabled={busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setReceipt(await upload.uploadFile(file));
                    setError("");
                  } catch {
                    setError("Receipt upload failed. Please try again.");
                  }
                }}
              />
            </label>
            {receipt && (
              <div>
                <img
                  src={receipt}
                  className="max-h-36"
                  alt="Attached receipt"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setReceipt("")}
                >
                  Remove receipt
                </Button>
              </div>
            )}
          </details>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : expense ? "Save changes" : "Add expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

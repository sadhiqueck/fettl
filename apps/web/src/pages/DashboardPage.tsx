import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Link2,
  Plus,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { CreateGroupModal } from "@/features/groups/components/CreateGroupModal";
import { useGroups, useJoinGroup } from "@/features/groups/hooks/useGroups";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { formatCurrency } from "@/shared/lib/format";

const categoryImages: Record<string, string> = {
  Travel: "travel",
  Home: "home",
  Friends: "friends",
  Work: "office",
};

export default function DashboardPage() {
  const { data: groups = [], isPending, isError, refetch } = useGroups();
  const [dialog, setDialog] = useState<"create" | "join" | null>(null);
  const [search, setSearch] = useState("");
  const [invite, setInvite] = useState("");
  const join = useJoinGroup();
  const navigate = useNavigate();
  const owed = groups.reduce(
    (total, g) => total + Math.max(0, g.userBalance),
    0,
  );
  const owe = groups.reduce(
    (total, g) => total + Math.max(0, -g.userBalance),
    0,
  );
  const net = owed - owe;
  const visible = groups.filter((g) =>
    g.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const openJoin = () => {
    setInvite("");
    join.reset();
    setDialog("join");
  };

  return (
    <div className="dashboard-scroll">
      <div className="dashboard">
        <header className="dashboard-heading">
          <h1>Overview</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={openJoin}>
              <Link2 /> Join group
            </Button>
            <Button onClick={() => setDialog("create")}>
              <Plus /> Create group
            </Button>
          </div>
        </header>
        {isPending ? (
          <p role="status" className="state-panel">
            Loading your groups and balances…
          </p>
        ) : isError ? (
          <div role="alert" className="state-panel">
            <h2>We couldn’t load your groups</h2>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <section className="balance-panel" aria-label="Balance summary">
              <div className="balance-main">
                <p>
                  <Wallet size={19} /> Net balance
                </p>
                <strong>
                  {net < 0 ? "−" : net > 0 ? "+" : ""}
                  {formatCurrency(net)}
                </strong>
                <span>
                  Across {groups.length}{" "}
                  {groups.length === 1 ? "group" : "groups"}
                </span>
              </div>
              <dl className="balance-breakdown">
                <div>
                  <dt>
                    <ArrowDownLeft /> Owed to you
                  </dt>
                  <dd>{formatCurrency(owed)}</dd>
                </div>
                <div>
                  <dt>
                    <ArrowUpRight /> You owe
                  </dt>
                  <dd>{formatCurrency(owe)}</dd>
                </div>
              </dl>
            </section>
            <section aria-labelledby="groups-title">
              <div className="group-list-heading">
                <h2 id="groups-title">Your groups</h2>
                {groups.length > 0 && (
                  <label className="group-search">
                    <Search size={17} />
                    <input
                      type="search"
                      aria-label="Search groups"
                      placeholder="Search groups"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                )}
              </div>
              {groups.length === 0 ? (
                <div className="state-panel">
                  <Users aria-hidden="true" size={30} />
                  <h3>Create your first group</h3>
                  <p>
                    Start a group for a trip, a household, or a shared bill.
                  </p>
                  <Button variant="outline" onClick={() => setDialog("create")}>
                    Create group
                  </Button>
                </div>
              ) : visible.length === 0 ? (
                <div className="state-panel">
                  <h3>No matching groups</h3>
                  <Button variant="outline" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                </div>
              ) : (
                <ul className="group-ledger">
                  {visible.map((group) => (
                    <li key={group.id}>
                      <Link to={`/groups/${group.id}`} className="group-row">
                        <img
                          src={`/icons/${categoryImages[group.category] ?? "other"}.png`}
                          loading="lazy"
                          alt=""
                        />
                        <div className="group-identity">
                          <strong>{group.name}</strong>
                          <span>
                            {group.category} · {group.memberCount}{" "}
                            {group.memberCount === 1 ? "member" : "members"}
                          </span>
                        </div>
                        <div className="group-amount">
                          <span>
                            {group.userBalance > 0
                              ? "Owed to you"
                              : group.userBalance < 0
                                ? "You owe"
                                : "Settled up"}
                          </span>
                          {group.userBalance !== 0 && (
                            <strong>{formatCurrency(group.userBalance)}</strong>
                          )}
                        </div>
                        <ChevronRight size={16} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
        {dialog === "create" && (
          <CreateGroupModal
            open
            onOpenChange={(open) => !open && setDialog(null)}
          />
        )}
        <Dialog
          open={dialog === "join"}
          onOpenChange={(open) => !open && setDialog(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join a group</DialogTitle>
              <DialogDescription>
                Paste the invite link or enter the code a member shared with
                you.
              </DialogDescription>
            </DialogHeader>
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const code =
                  invite
                    .trim()
                    .replace(/\/$/, "")
                    .split("/")
                    .pop()
                    ?.toUpperCase() ?? "";
                join.mutate(code, {
                  onSuccess: (data) => {
                    setDialog(null);
                    navigate(`/groups/${data.group.id}`);
                  },
                });
              }}
            >
              <Label htmlFor="invite-code">Invite link or code</Label>
              <Input
                id="invite-code"
                required
                value={invite}
                onChange={(event) => setInvite(event.target.value)}
                autoComplete="off"
              />
              {join.isError && (
                <p role="alert">Check your invite code and try again.</p>
              )}
              <Button type="submit" disabled={!invite.trim() || join.isPending}>
                {join.isPending ? "Joining…" : "Join group"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

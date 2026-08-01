import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { subscribeStore, type Role } from "@/data/store";
import {
  addPerson,
  listPeople,
  removePerson,
} from "@/modules/admin/admin-repository";

export function AdminPage() {
  const [people, setPeople] = useState(() => listPeople());
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [phone, setPhone] = useState("");

  useEffect(() => subscribeStore(() => setPeople(listPeople())), []);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Operations
        </p>
        <h1 className="font-display text-3xl font-semibold">Admin panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add or remove people from the HealNexus local database. Demo login:
          use role shortcut <strong>Admin</strong> on the login page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add person</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="caregiver">Caregiver</option>
              <option value="health_worker">Health worker</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button
            className="sm:col-span-2"
            onClick={() => {
              try {
                addPerson({
                  full_name: fullName,
                  email,
                  role,
                  phone,
                });
                toast.success("Person added to database");
                setFullName("");
                setEmail("");
                setPhone("");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              }
            }}
            disabled={!fullName.trim() || !email.trim()}
          >
            Add to DB
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>People in database ({people.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {people.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.email} · {p.username || "no username"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {p.role}
                </Badge>
                {p.is_archived ? (
                  <Badge variant="destructive">Archived</Badge>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    removePerson(p.id);
                    toast.success("Removed from active DB");
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

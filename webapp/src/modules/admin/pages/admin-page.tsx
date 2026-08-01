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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronic, setChronic] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [city, setCity] = useState("Ahmedabad");
  const [lastCreated, setLastCreated] = useState<{
    username: string;
    password: string;
    passport_token: string | null;
  } | null>(null);

  useEffect(() => subscribeStore(() => setPeople(listPeople())), []);

  const reset = () => {
    setFullName("");
    setUsername("");
    setPassword("");
    setEmail("");
    setPhone("");
    setDateOfBirth("");
    setSex("");
    setBloodGroup("");
    setAllergies("");
    setChronic("");
    setEmergencyName("");
    setEmergencyPhone("");
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 pb-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Operations
        </p>
        <h1 className="font-display text-3xl font-semibold">Admin panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create people with a User ID + password. Patients get passport basics
          so they can sign in and use HealNexus immediately.
        </p>
      </div>

      {lastCreated ? (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="space-y-1 p-4 text-sm">
            <p className="font-medium">Account ready — share these credentials</p>
            <p>
              User ID: <span className="font-mono">{lastCreated.username}</span>
            </p>
            <p>
              Password: <span className="font-mono">{lastCreated.password}</span>
            </p>
            {lastCreated.passport_token ? (
              <p>
                Passport QR:{" "}
                <span className="font-mono">{lastCreated.passport_token}</span>
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
              placeholder="Full name"
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
            <Label>User ID (login)</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ramesh.patel"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email (optional)</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="auto if blank"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {role === "patient" ? (
            <>
              <div className="space-y-1.5 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Passport / clinical basics
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Date of birth</Label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sex</Label>
                <Select value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option value="">—</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Blood group</Label>
                <Select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                >
                  <option value="">—</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ),
                  )}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Allergies (comma-separated)</Label>
                <Input
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Penicillin, peanuts"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Conditions (comma-separated)</Label>
                <Input
                  value={chronic}
                  onChange={(e) => setChronic(e.target.value)}
                  placeholder="Type 2 Diabetes, Hypertension"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Emergency contact name</Label>
                <Input
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Emergency contact phone</Label>
                <Input
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                />
              </div>
            </>
          ) : null}

          <Button
            className="sm:col-span-2"
            onClick={() => {
              try {
                const created = addPerson({
                  full_name: fullName,
                  email,
                  role,
                  phone,
                  username,
                  password,
                  date_of_birth: dateOfBirth,
                  sex,
                  blood_group: bloodGroup,
                  allergies,
                  chronic_diseases: chronic,
                  emergency_name: emergencyName,
                  emergency_phone: emergencyPhone,
                  city,
                });
                setLastCreated({
                  username: created.username,
                  password: created.password,
                  passport_token: created.passport_token,
                });
                toast.success(
                  `Created ${created.username} — they can sign in now`,
                );
                reset();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              }
            }}
            disabled={!fullName.trim() || !username.trim() || !password.trim()}
          >
            Create account in DB
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
                  <span className="font-mono">{p.username || "—"}</span>
                  {p.email ? ` · ${p.email}` : ""}
                  {p.passport_token ? ` · passport ${p.passport_token}` : ""}
                  {p.blood_group ? ` · ${p.blood_group}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {p.role}
                </Badge>
                {p.has_password ? (
                  <Badge variant="secondary">Login</Badge>
                ) : null}
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

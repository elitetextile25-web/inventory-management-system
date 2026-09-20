"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Users, Plus, ShieldCheck, UserCog, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  userRoles: { role: { id: string; name: string } }[];
  userStores: { store: { id: string; name: string } }[];
}

interface RoleData {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  rolePermissions: { permission: { code: string; module: string } }[];
}

export default function UsersSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [roles, setRoles] = React.useState<RoleData[]>([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [newUser, setNewUser] = React.useState({
    name: "",
    email: "",
    password: "",
  });

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/users");
      const data = await res.json();
      if (!data.error) {
        setUsers(data.users || []);
        setRoles(data.roles || []);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("All fields are required");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_USER", ...newUser }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create user");
        return;
      }
      toast.success("User created successfully!");
      setNewUser({ name: "", email: "", password: "" });
      setShowAdd(false);
      fetchData();
    } catch {
      toast.error("Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_ACTIVE", userId, isActive: !isActive }),
      });
      toast.success(`User ${isActive ? "deactivated" : "activated"}`);
      fetchData();
    } catch {
      toast.error("Failed to update user");
    }
  };

  const inputClass =
    "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings" title="Back to settings">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Users & Roles</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage users, roles and permissions
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Add User Form */}
      {showAdd && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">New User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  placeholder="user@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateUser} disabled={saving}>
                {saving ? "Creating..." : "Create User"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="w-4 h-4 text-muted-foreground" />
            Active Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                      {!user.isActive && (
                        <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {user.userRoles.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {user.userRoles.map((ur) => (
                          <Badge key={ur.role.id} variant="secondary" className="text-[10px]">
                            {ur.role.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleActive(user.id, user.isActive)}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title={user.isActive ? "Deactivate user" : "Activate user"}
                  >
                    {user.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            Roles ({roles.length})
          </CardTitle>
          <CardDescription>System and custom roles with assigned permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No roles configured</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="p-3 rounded-lg border border-border bg-muted/20 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{role.name}</p>
                    {role.isSystem && (
                      <Badge variant="outline" className="text-[10px]">
                        System
                      </Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-[11px] text-muted-foreground">{role.description}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {role.rolePermissions.length} permission{role.rolePermissions.length !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { Mail, MoreVertical, Plus, Shield, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const mockMembers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'OWNER',
    avatar: 'J',
    joinedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'ADMIN',
    avatar: 'J',
    joinedAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    role: 'MEMBER',
    avatar: 'B',
    joinedAt: '2024-03-10',
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    role: 'MEMBER',
    avatar: 'A',
    joinedAt: '2024-04-05',
  },
];

const pendingInvites = [
  { id: '1', email: 'newuser@example.com', role: 'MEMBER', expiresAt: '2024-12-10' },
];

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  MEMBER: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  VIEWER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function TeamPage() {
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  const handleInvite = () => {
    console.log('Inviting:', inviteEmail, inviteRole);
    setIsInviting(false);
    setInviteEmail('');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Members</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Manage your team and invite new members
          </p>
        </div>
        <Button onClick={() => setIsInviting(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Invite Modal */}
      {isInviting && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invite Team Member
            </CardTitle>
            <CardDescription>Send an invitation to join your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Member</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsInviting(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite}>Send Invitation</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({mockMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {mockMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-medium text-white">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[member.role]}`}
                  >
                    {member.role}
                  </span>
                  {member.role !== 'OWNER' && (
                    <button className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <MoreVertical className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{invite.email}</p>
                      <p className="text-sm text-slate-500">Expires {invite.expiresAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[invite.role]}`}
                    >
                      {invite.role}
                    </span>
                    <Button variant="outline" size="sm">
                      Resend
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>Understanding what each role can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="font-semibold text-purple-600 dark:text-purple-400">Owner</h4>
              <p className="mt-1 text-sm text-slate-500">
                Full access including billing and deletion
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400">Admin</h4>
              <p className="mt-1 text-sm text-slate-500">Manage members, settings, and projects</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="font-semibold text-slate-600 dark:text-slate-400">Member</h4>
              <p className="mt-1 text-sm text-slate-500">Create and manage own projects</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h4 className="font-semibold text-gray-600 dark:text-gray-400">Viewer</h4>
              <p className="mt-1 text-sm text-slate-500">View-only access to projects</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

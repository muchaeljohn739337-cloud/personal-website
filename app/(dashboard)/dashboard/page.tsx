import { ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp, Users, Wallet } from 'lucide-react';
import { getServerSession } from 'next-auth';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';

const stats = [
  {
    name: 'Total Balance',
    value: '$45,231.89',
    change: '+20.1%',
    changeType: 'positive',
    icon: Wallet,
  },
  {
    name: 'Monthly Revenue',
    value: '$12,234.00',
    change: '+15.2%',
    changeType: 'positive',
    icon: DollarSign,
  },
  {
    name: 'Active Users',
    value: '2,345',
    change: '+12.5%',
    changeType: 'positive',
    icon: Users,
  },
  {
    name: 'Growth Rate',
    value: '23.5%',
    change: '-2.3%',
    changeType: 'negative',
    icon: TrendingUp,
  },
];

const recentTransactions = [
  { id: 1, name: 'Payment from Alex', amount: '+$1,200.00', date: 'Today', type: 'credit' },
  { id: 2, name: 'Subscription fee', amount: '-$29.00', date: 'Yesterday', type: 'debit' },
  { id: 3, name: 'Transfer to Sarah', amount: '-$500.00', date: 'Dec 4', type: 'debit' },
  { id: 4, name: 'Refund from Store', amount: '+$89.00', date: 'Dec 3', type: 'credit' },
  { id: 5, name: 'Payment from Client', amount: '+$3,500.00', date: 'Dec 2', type: 'credit' },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Here&apos;s what&apos;s happening with your finances today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.name}
              </CardTitle>
              <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                <stat.icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="mt-1 flex items-center text-sm">
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="mr-1 h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                )}
                <span className={stat.changeType === 'positive' ? 'text-emerald-500' : 'text-red-500'}>
                  {stat.change}
                </span>
                <span className="ml-1 text-slate-500">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        transaction.type === 'credit'
                          ? 'bg-emerald-100 dark:bg-emerald-950'
                          : 'bg-red-100 dark:bg-red-950'
                      }`}
                    >
                      {transaction.type === 'credit' ? (
                        <ArrowDownRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{transaction.name}</p>
                      <p className="text-sm text-slate-500">{transaction.date}</p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      transaction.type === 'credit'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/50">
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-950">
                  <ArrowUpRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Send Money</span>
              </button>
              <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 transition-all hover:border-emerald-500 hover:bg-emerald-50 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/50">
                <div className="rounded-lg bg-emerald-100 p-3 dark:bg-emerald-950">
                  <ArrowDownRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Request Money</span>
              </button>
              <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 transition-all hover:border-purple-500 hover:bg-purple-50 dark:border-slate-700 dark:hover:border-purple-500 dark:hover:bg-purple-950/50">
                <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-950">
                  <Wallet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Add Funds</span>
              </button>
              <button className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 transition-all hover:border-amber-500 hover:bg-amber-50 dark:border-slate-700 dark:hover:border-amber-500 dark:hover:bg-amber-950/50">
                <div className="rounded-lg bg-amber-100 p-3 dark:bg-amber-950">
                  <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Invite Team</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

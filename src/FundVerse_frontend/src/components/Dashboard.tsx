import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, Users, Target, Clock } from 'lucide-react';

interface DashboardProps {
  campaigns: Array<{
    id: bigint;
    title: string;
    goal: bigint;
    amount_raised: bigint;
    end_date: bigint;
    days_left: bigint;
    category: string;
    idea_id: bigint;
  }>;
}

export const Dashboard: React.FC<DashboardProps> = ({ campaigns }) => {
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.days_left > 0).length;
  const totalGoal = campaigns.reduce((sum, c) => sum + Number(c.goal), 0);
  const totalRaised = campaigns.reduce((sum, c) => sum + Number(c.amount_raised), 0);
  const fundedCampaigns = campaigns.filter((c) => c.amount_raised >= c.goal).length;

  const categoryData = campaigns.reduce((acc, campaign) => {
    const category = campaign.category;
    if (!acc[category]) {
      acc[category] = { category, count: 0, raised: 0 };
    }
    acc[category].count += 1;
    acc[category].raised += Number(campaign.amount_raised);
    return acc;
  }, {} as Record<string, { category: string; count: number; raised: number }>);

  const chartData = Object.values(categoryData).map((item) => ({
    ...item,
    raised: Number(item.raised) / 100_000_000,
  }));

  const pieData = [
    { name: 'Funded', value: fundedCampaigns, color: '#10b981' },
    { name: 'Active', value: activeCampaigns - fundedCampaigns, color: '#3b82f6' },
    { name: 'Ended', value: totalCampaigns - activeCampaigns, color: '#6b7280' },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#6b7280'];

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.15 } },
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            title: 'Total Campaigns',
            value: totalCampaigns,
            subtitle: `${activeCampaigns} active campaigns`,
            icon: Target,
          },
          {
            title: 'Total Raised',
            value: formatCurrency(totalRaised / 100_000_000),
            subtitle: `of ${formatCurrency(totalGoal / 100_000_000)} goal`,
            icon: TrendingUp,
          },
          {
            title: 'Funded Projects',
            value: fundedCampaigns,
            subtitle: `${totalCampaigns > 0 ? Math.round((fundedCampaigns / totalCampaigns) * 100) : 0}% success rate`,
            icon: Users,
          },
          {
            title: 'Active Campaigns',
            value: activeCampaigns,
            subtitle: `${totalCampaigns - activeCampaigns} ended`,
            icon: Clock,
          },
        ].map((card, idx) => (
          <motion.div key={idx} variants={fadeUp}>
            <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white">{card.title}</CardTitle>
                <card.icon className="h-5 w-5 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{card.value}</div>
                <p className="text-xs text-gray-400">{card.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.25 } },
        }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Funding by Category */}
        <motion.div variants={fadeUp}>
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white">Funding by Category</CardTitle>
              <CardDescription className="text-gray-400">
                Total ICP raised per project category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                  <XAxis
                    dataKey="category"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                    tick={{ fill: '#fff' }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value.toFixed(2)} ICP`}
                    fontSize={12}
                    tick={{ fill: '#fff' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} ICP`, 'Raised']}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                  <Bar dataKey="raised" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Campaign Status */}
        <motion.div variants={fadeUp}>
          <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:shadow-green-500/20 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white">Campaign Status</CardTitle>
              <CardDescription className="text-gray-400">
                Distribution of campaign statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Campaigns']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent Campaigns */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <Card className="bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:shadow-pink-500/20 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white">Recent Campaigns</CardTitle>
            <CardDescription className="text-gray-400">
              Latest campaigns and their funding progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.slice(0, 5).map((campaign) => (
                <motion.div
                  key={campaign.id.toString()}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{campaign.title}</h4>
                    <p className="text-sm text-gray-400">{campaign.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">
                      {formatCurrency(Number(campaign.amount_raised) / 100_000_000)}
                    </p>
                    <p className="text-sm text-gray-400">
                      of {formatCurrency(Number(campaign.goal) / 100_000_000)}
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(
                            (Number(campaign.amount_raised) / Number(campaign.goal)) * 100,
                            100
                          )}%`,
                        }}
                        transition={{ duration: 1 }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;

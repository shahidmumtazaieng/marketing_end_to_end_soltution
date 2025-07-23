
'use client';

import { StatCard } from '@/components/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, List, Phone, Clock } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const callStatusData = [
  { name: 'Completed', value: 987, color: 'hsl(var(--primary))' },
  { name: 'Failed', value: 205, color: 'hsl(var(--destructive))' },
  { name: 'Pending', value: 92, color: 'hsl(var(--accent))' },
];

const callVolumeData = [
  { day: 'Mon', calls: 120 },
  { day: 'Tue', calls: 150 },
  { day: 'Wed', calls: 130 },
  { day: 'Thu', calls: 180 },
  { day: 'Fri', calls: 210 },
  { day: 'Sat', calls: 160 },
  { day: 'Sun', calls: 110 },
];

const conversionData = [
    { service: 'AC Repair', conversions: 45 },
    { service: 'Cleaning', conversions: 32 },
    { service: 'Plumbing', conversions: 28 },
    { service: 'Electrician', conversions: 18 },
    { service: 'Other', conversions: 29 },
]


export default function CallingAgentAnalyticsPage() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">AI Agent Analytics</h1>
        <p className="text-muted-foreground">Monitor your automated calling agent's performance.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <StatCard title="Total Calls" value="1,284" helperText="+15% from last week" icon={Phone} />
          <StatCard title="Successful Calls" value="987" helperText="77% success rate" icon={CheckCircle} />
          <StatCard title="Bookings" value="152" helperText="12% conversion rate" icon={List} />
          <StatCard title="Avg. Call Duration" value="2.5 mins" helperText="-10s from last week" icon={Clock} />
      </div>

       <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <CardHeader>
                <CardTitle className="font-headline">Call Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                         <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                            }}
                         />
                         <Legend
                            verticalAlign="bottom"
                            wrapperStyle={{ paddingBottom: '1.5rem', outline: 'none' }}
                            iconType="circle"
                         />
                        <Pie
                            data={callStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            dataKey="value"
                        >
                            {callStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                </div>
            </CardContent>
          </Card>
          <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline">Call Volume (Last 7 Days)</CardTitle>
            </CardHeader>
             <CardContent>
                 <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={callVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 8, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
      </div>
       <Card>
          <CardHeader>
            <CardTitle className="font-headline">Conversions by Service Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="service" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Bar dataKey="conversions" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
    </div>
  );
}

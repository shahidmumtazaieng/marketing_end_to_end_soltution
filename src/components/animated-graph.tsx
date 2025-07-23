
'use client';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { name: 'Jan', value: 120 },
  { name: 'Feb', value: 210 },
  { name: 'Mar', value: 180 },
  { name: 'Apr', value: 290 },
  { name: 'May', value: 250 },
  { name: 'Jun', value: 400 },
];

export function AnimatedGraph() {
  return (
    <div className="w-full h-full">
        <style jsx global>{`
            @keyframes draw-graph {
                from {
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                }
                to {
                    stroke-dashoffset: 0;
                }
            }
            @keyframes fill-graph {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
            .graph-line {
                animation: draw-graph 2s ease-out forwards;
            }
            .graph-area {
                animation: fill-graph 1.5s ease-out forwards 0.5s;
                opacity: 0;
            }
        `}</style>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
             <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
              <stop offset="5%" stopColor="hsl(var(--accent))" />
              <stop offset="95%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip 
             contentStyle={{
                backgroundColor: 'hsl(var(--background) / 0.8)',
                borderColor: 'hsl(var(--border))',
                backdropFilter: 'blur(10px)',
                borderRadius: 'var(--radius)',
              }}
              itemStyle={{
                color: 'hsl(var(--foreground))',
              }}
              labelStyle={{
                color: 'hsl(var(--muted-foreground))',
              }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="url(#lineColor)"
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorValue)"
            className="graph-area"
            animationBegin={200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

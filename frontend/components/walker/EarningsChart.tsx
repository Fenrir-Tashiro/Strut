'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  data: { date: string; points: number }[]
}

export default function EarningsChart({ data }: Props) {
  const hasData = data.some((d) => d.points > 0)

  if (!hasData) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
        まだデータがありません
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} />
        <YAxis tick={{ fontSize: 11, fill: '#666' }} />
        <Tooltip
          formatter={(v) => [`${v} pt`, '獲得ポイント']}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar dataKey="points" fill="#E8315B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

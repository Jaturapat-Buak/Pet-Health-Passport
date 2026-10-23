import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DashboardSection, formatDate } from './DashboardParts.jsx';

export default function WeightChart({ pets, weights }) {
  const petIds = [...new Set(weights.map((item) => item.pet_id))];
  const [selectedId, setSelectedId] = useState(petIds[0] ?? '');
  const selected = petIds.includes(selectedId) ? selectedId : (petIds[0] ?? '');
  const points = weights.filter((item) => item.pet_id === selected).map((item) => ({
    label: new Intl.DateTimeFormat('th-TH', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      .format(new Date(`${String(item.record_date).slice(0, 10)}T12:00:00Z`)),
    weight: Number(item.weight), date: formatDate(item.record_date)
  }));
  const petName = pets.find((pet) => pet.id === selected)?.name ?? 'สัตว์เลี้ยง';

  return <DashboardSection title="Weight History" className="weight-section">
    {petIds.length === 0 ? <p className="muted">กราฟน้ำหนักจะแสดงเมื่อคุณเพิ่มประวัติน้ำหนัก</p> : <>
      <label className="chart-pet-select">สัตว์เลี้ยง
        <select value={selected} onChange={(event) => setSelectedId(event.target.value)}>
          {pets.filter((pet) => petIds.includes(pet.id)).map((pet) =>  <option key={pet.id} value={pet.id}>{pet.name}</option>)}
        </select>
      </label>
      <div className="weight-chart" role="img" aria-label={`ประวัติน้ำหนักของ ${petName}: ${points.map((point) => `${point.date}, ${point.weight} กก.`).join('; ')}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 16, right: 20, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="#e2e9e5" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#5b6b66', fontSize: 18 }} />
            <YAxis domain={['auto', 'auto']} unit=" กก." tickLine={false} axisLine={false} tick={{ fill: '#5b6b66', fontSize: 18 }} width={70} />
            <Tooltip formatter={(value) => [`${value} กก.`, 'น้ำหนัก']} labelFormatter={(_label, payload) => payload?.[0]?.payload?.date ?? ''} />
            <Line type="monotone" dataKey="weight" stroke="#187463" strokeWidth={2.5} dot={{ r: 4, fill: '#187463' }} activeDot={{ r: 6 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Link className="dashboard-detail-link" to={`/pets/${selected}`}>เปิดสมุดสุขภาพ</Link>
    </>}
  </DashboardSection>;
}

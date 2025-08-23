import { useMemo, useState } from "react";
import Input from "../ui/Input";
import Skeleton from "../common/Skeleton";

type Column<T> = { key: keyof T; header: string; render?: (row: T) => React.ReactNode };
export type DataTableProps<T> = {
  data?: T[];
  loading?: boolean;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  searchableKeys?: (keyof T)[];
};

export default function DataTable<T extends Record<string, any>>({ data = [], loading, columns, onRowClick, searchableKeys = [] }: DataTableProps<T>) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return data;
    const qq = q.toLowerCase();
    return data.filter(r => searchableKeys.some(k => String(r[k] ?? "").toLowerCase().includes(qq)));
  }, [data, q, searchableKeys]);

  if (loading) {
    return <div className="space-y-2">{Array.from({length: 6}).map((_,i)=><Skeleton key={i} className="h-10" />)}</div>
  }

  return (
    <div className="space-y-3">
      <div className="max-w-xs"><Input placeholder="بحث..." value={q} onChange={e=>setQ(e.target.value)} /></div>
      <div className="overflow-x-auto bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/5">
              {columns.map((c, i)=>(<th key={i} className="text-right p-3 font-semibold">{c.header}</th>))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td className="p-4 text-text-muted">لا توجد بيانات مطابقة.</td></tr>
            ) : filtered.map((row, idx)=>(
              <tr key={idx} className="border-t hover:bg-black/2 cursor-pointer" onClick={()=>onRowClick?.(row)}>
                {columns.map((c,i)=>(<td key={i} className="p-3">{c.render ? c.render(row) : String(row[c.key] ?? "")}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

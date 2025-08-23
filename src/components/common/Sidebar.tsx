import { NavLink } from 'react-router-dom';
const Item = ({ to, label }: { to: string; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      'block rounded-xl px-3 py-2 ' + (isActive ? 'bg-gray-200' : 'hover:bg-gray-100')
    }
  >
    {label}
  </NavLink>
);
export default function Sidebar() {
  return (
    <aside className="w-64 border-e bg-white p-3 space-y-1">
      <Item to="/" label="لوحة التحكم" />
      <Item to="/clients" label="العملاء" />
      <Item to="/projects" label="المشاريع" />
      <Item to="/tasks" label="المهام" />
    </aside>
  );
}

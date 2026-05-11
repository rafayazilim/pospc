import { useState } from "react";
import Tabs from "../components/ui/Tabs";
import TableCard from "../components/restaurant/TableCard";

const filters = [
  { value: "all", label: "Tüm Masalar" },
  { value: "empty", label: "Boş" },
  { value: "occupied", label: "Dolu" },
  { value: "service", label: "Servis Açık" },
  { value: "payment", label: "Ödeme Bekleyen" },
  { value: "reserved", label: "Rezerve" },
];

export default function TablesPage({ tables, searchQuery = "", onSelectTable }) {
  const [filter, setFilter] = useState("all");
  const query = searchQuery.trim().toLowerCase();
  const visibleTables = (filter === "all" ? tables : tables.filter((table) => table.status === filter)).filter((table) => {
    if (!query) return true;
    return [
      table.name,
      table.area,
      table.status,
      ...(table.orders || []).map((order) => order.productName),
    ].join(" ").toLowerCase().includes(query);
  });

  return (
    <div className="page-stack">
      <Tabs items={filters} value={filter} onChange={setFilter} />
      <div className="table-grid">
        {visibleTables.map((table) => (
          <TableCard key={table.id} table={table} onClick={onSelectTable} />
        ))}
      </div>
    </div>
  );
}

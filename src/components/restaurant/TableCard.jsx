import { Clock, Users, Utensils } from "lucide-react";
import Badge from "../ui/Badge";
import { formatCurrency, tableTotal } from "../../utils/format";

export default function TableCard({ table, onClick }) {
  const total = tableTotal(table);
  const count = table.orders.reduce((sum, order) => sum + order.quantity, 0);

  return (
    <button className={`table-card table-${table.status}`} onClick={() => onClick(table)}>
      <div className="table-card-top">
        <span className="table-icon">
          <Utensils size={20} />
        </span>
        <Badge status={table.status} />
      </div>
      <strong>{table.name}</strong>
      <span className="table-area">{table.area}</span>
      <div className="table-meta-grid">
        <span>{formatCurrency(total)}</span>
        <span>{count} ürün</span>
      </div>
      <div className="table-card-bottom">
        <span>
          <Users size={15} /> {table.guests || "-"}
        </span>
        <span>
          <Clock size={15} /> {table.openedAt || "--:--"}
        </span>
      </div>
    </button>
  );
}

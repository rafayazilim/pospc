import { Banknote, CreditCard, Receipt, WalletCards } from "lucide-react";
import Card from "../components/ui/Card";
import StatCard from "../components/restaurant/StatCard";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { formatCurrency } from "../utils/format";

export default function PaymentsPage({ bills, salesRecords = [], searchQuery = "", onPayment }) {
  const query = searchQuery.trim().toLowerCase();
  const visibleBills = bills.filter((bill) => {
    if (!query) return true;
    return [
      bill.id,
      bill.table.name,
      bill.table.openedAt,
      ...(bill.table.orders || []).map((order) => order.productName),
    ].join(" ").toLowerCase().includes(query);
  });

  const total = bills.reduce((sum, bill) => sum + bill.total, 0);
  const paymentTotals = salesRecords.reduce((acc, sale) => {
    (sale.payments || [{ method: sale.method, amount: sale.amount || sale.total }]).forEach((payment) => {
      const method = payment.method || "cash";
      acc[method] = (acc[method] || 0) + Number(payment.amount || 0);
    });
    return acc;
  }, {});

  return (
    <div className="page-stack">
      <div className="stat-grid">
        <StatCard label="Bekleyen Tahsilat" value={formatCurrency(total)} icon={Receipt} />
        <StatCard label="Nakit" value={formatCurrency(paymentTotals.cash || 0)} tone="green" icon={Banknote} />
        <StatCard label="Kart" value={formatCurrency(paymentTotals.card || 0)} tone="blue" icon={CreditCard} />
        <StatCard label="Yemek Kartı" value={formatCurrency(paymentTotals.meal || 0)} tone="amber" icon={WalletCards} />
      </div>
      <Card className="data-card">
        <div className="card-title-row">
          <h2>Ödeme Bekleyen Masalar</h2>
          <Badge status="payment">{bills.length} kayıt</Badge>
        </div>
        <div className="payment-table-list">
          {visibleBills.map((bill) => (
            <div key={bill.id}>
              <div>
                <strong>{bill.table.name}</strong>
                <span>{bill.id} · {bill.table.openedAt} · {bill.itemCount} ürün</span>
              </div>
              <strong>{formatCurrency(bill.total)}</strong>
              <Button variant="success" onClick={() => onPayment(bill.table)}>Ödeme Al</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

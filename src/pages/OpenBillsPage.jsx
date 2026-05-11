import { Eye, Printer, Receipt } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { formatCurrency } from "../utils/format";

export default function OpenBillsPage({ bills, searchQuery = "", onDetail, onPayment, onGoTable, onPrintReceipt }) {
  const query = searchQuery.trim().toLowerCase();
  const visibleBills = bills.filter((bill) => {
    if (!query) return true;
    return [
      bill.id,
      bill.table.name,
      bill.table.openedAt,
      bill.table.status,
      ...(bill.table.orders || []).map((order) => order.productName),
    ].join(" ").toLowerCase().includes(query);
  });
  return (
    <Card className="data-card">
      <div className="card-title-row">
        <div>
          <h2>Açık Adisyonlar</h2>
          <p>Kapanmamış masalar ve ödeme bekleyen hesaplar</p>
        </div>
        <Badge>{bills.length} açık adisyon</Badge>
      </div>
      <div className="data-table">
        <div className="data-head">
          <span>Adisyon No</span>
          <span>Masa</span>
          <span>Açılış</span>
          <span>Ürün</span>
          <span>Tutar</span>
          <span>Durum</span>
          <span>Aksiyonlar</span>
        </div>
        {visibleBills.map((bill) => (
          <div className="data-row" key={bill.id}>
            <strong>{bill.id}</strong>
            <span>{bill.table.name}</span>
            <span>{bill.table.openedAt}</span>
            <span>{bill.itemCount}</span>
            <strong>{formatCurrency(bill.total)}</strong>
            <Badge status={bill.table.status} />
            <div className="row-actions">
              <Button variant="ghost" size="small" onClick={() => onDetail(bill)}><Eye size={16} /> Detay</Button>
              <Button variant="ghost" size="small" onClick={() => onPayment(bill.table)}><Receipt size={16} /> Ödeme</Button>
              <Button variant="ghost" size="small" onClick={() => onPrintReceipt(bill.table)}><Printer size={16} /> Yazdır</Button>
              <Button variant="outline" size="small" onClick={() => onGoTable(bill.table)}>Masaya Git</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

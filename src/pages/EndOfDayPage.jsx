import { useMemo, useState } from "react";
import { FileDown, Printer } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatCard from "../components/restaurant/StatCard";
import Modal from "../components/ui/Modal";
import { formatCurrency } from "../utils/format";

const methodLabels = {
  cash: "Nakit",
  card: "Kart",
  meal: "Yemek Kartı",
  online: "Online",
};

const topEntries = (entries, limit = 5) =>
  Object.entries(entries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

const todayKey = () => new Date().toISOString().slice(0, 10);
const getDateKey = (record, ...keys) => {
  const value = keys.map((key) => record?.[key]).find(Boolean);
  return value ? String(value).slice(0, 10) : null;
};

export default function EndOfDayPage({ openBills = [], salesRecords = [], cateringOrders = [], onCloseDay, onNotify }) {
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const selectedDate = todayKey();

  const filteredSales = useMemo(
    () => salesRecords.filter((sale) => getDateKey(sale, "paidAtDate", "createdAtDate") === selectedDate),
    [salesRecords, selectedDate],
  );

  const deliveredCatering = useMemo(
    () =>
      cateringOrders.filter(
        (order) =>
          order.status === "delivered" &&
          getDateKey(order, "deliveredAtDate", "createdAtDate") === selectedDate,
      ),
    [cateringOrders, selectedDate],
  );

  const shopTotal = filteredSales.reduce((sum, sale) => sum + Number(sale.total || sale.amount || 0), 0);
  const cateringTotal = deliveredCatering.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const totalRevenue = shopTotal + cateringTotal;
  const openTotal = openBills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);
  const paymentTotals = {};
  const productCounts = {};

  filteredSales.forEach((sale) => {
    (sale.payments || [{ method: sale.method, amount: sale.amount || sale.total }]).forEach((payment) => {
      const key = payment.method || "cash";
      paymentTotals[key] = (paymentTotals[key] || 0) + Number(payment.amount || 0);
    });
    (sale.items || []).forEach((item) => {
      const name = item.productName || item.name;
      if (!name) return;
      productCounts[name] = (productCounts[name] || 0) + Number(item.quantity || 0);
    });
  });

  deliveredCatering.forEach((order) => {
    paymentTotals.cash = (paymentTotals.cash || 0) + Number(order.total || 0);
    (order.items || []).forEach((item) => {
      const name = item.productName || item.name;
      if (!name) return;
      productCounts[name] = (productCounts[name] || 0) + Number(item.quantity || 0);
    });
  });

  const topProducts = topEntries(productCounts);
  const paymentRows = topEntries(paymentTotals, 4);

  const exportSummaryPdf = () => {
    const lines = [
      "Dönem: Günlük",
      `Tarih: ${selectedDate}`,
      `Toplam Ciro: ${formatCurrency(totalRevenue)}`,
      `Dükkan Ciro: ${formatCurrency(shopTotal)}`,
      `Catering Ciro: ${formatCurrency(cateringTotal)}`,
      `Teslim Catering: ${deliveredCatering.length}`,
      "",
      "Ödeme Dağılımı:",
      ...(paymentRows.length ? paymentRows.map(([method, total]) => `${methodLabels[method] || method}: ${formatCurrency(total)}`) : ["Veri yok"]),
      "",
      "En Çok Satan Ürünler:",
      ...(topProducts.length ? topProducts.map(([name, count]) => `${name}: ${count} adet`) : ["Veri yok"]),
    ];
    const html = `
      <html><head><meta charset="utf-8"><title>Gün Sonu Özet</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Gün Sonu Özet</h1>
        <pre style="font-size:14px;line-height:1.5;">${lines.join("\n")}</pre>
      </body></html>
    `;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return onNotify("PDF penceresi açılamadı.");
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="page-stack">
      <div className="toolbar">
        <div className="segmented">
          <button className="active">Bugün</button>
        </div>
        <div className="toolbar-actions">
          <Button variant="outline" onClick={() => onNotify("PDF dışa aktarma daha sonra aktif edilecek.")}><FileDown size={17} /> PDF</Button>
          <Button variant="outline" onClick={() => onNotify("Rapor yazdırma daha sonra aktif edilecek.")}><Printer size={17} /> Yazdır</Button>
          <Button variant="danger" disabled={openBills.length > 0} onClick={() => setCloseConfirmOpen(true)}>Gün Sonunu Kapat</Button>
        </div>
      </div>

      {openBills.length > 0 ? (
        <Card>
          <h2>Gün Sonu Kilitli</h2>
          <p className="muted-text">Açık adisyon varken gün sonu kapatılamaz. Önce tüm masaların ödemesini tamamlayın.</p>
        </Card>
      ) : null}

      <div className="stat-grid">
        <StatCard label="Toplam Ciro" value={formatCurrency(totalRevenue)} tone="green" />
        <StatCard label="Dükkan Ciro" value={formatCurrency(shopTotal)} />
        <StatCard label="Catering Ciro" value={formatCurrency(cateringTotal)} tone="amber" />
        <StatCard label="Teslim Catering" value={deliveredCatering.length} tone="green" />
        <StatCard label="Açık Adisyon" value={openBills.length} tone={openBills.length ? "red" : "green"} />
        <StatCard label="Açık Tahsilat" value={formatCurrency(openTotal)} tone="purple" />
      </div>

      <div className="dashboard-grid">
        <Card>
          <h2>Ödeme Dağılımı</h2>
          <div className="rank-list">
            {paymentRows.length === 0 ? <p className="muted-text">Bugün ödeme kaydı yok.</p> : paymentRows.map(([method, total]) => (
              <div key={method}><strong>{methodLabels[method] || method}</strong><em>{formatCurrency(total)}</em></div>
            ))}
          </div>
        </Card>
        <Card>
          <h2>En Çok Satan Ürünler</h2>
          <div className="rank-list">
            {topProducts.length === 0 ? <p className="muted-text">Bugün satış kaydı yok.</p> : topProducts.map(([name, count]) => (
              <div key={name}><strong>{name}</strong><em>{count} adet</em></div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h2>Gün Sonu Notları</h2>
        <textarea className="notes-area" placeholder="Kasa farkı, iptal nedeni veya operasyon notu" />
      </Card>

      <Modal
        open={closeConfirmOpen}
        title="Gün Sonunu Kapat"
        onClose={() => setCloseConfirmOpen(false)}
        wide
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCloseConfirmOpen(false)}>Hayır</Button>
            <Button variant="outline" onClick={exportSummaryPdf}>PDF Çıktısı Al</Button>
            <Button variant="danger" onClick={() => { onCloseDay?.(); setCloseConfirmOpen(false); }}>Evet</Button>
          </>
        )}
      >
        <p>Gün sonunu kapatmak istediğinize emin misiniz?</p>
        <div className="stat-grid">
          <StatCard label="Toplam Ciro" value={formatCurrency(totalRevenue)} tone="green" />
          <StatCard label="Dükkan Ciro" value={formatCurrency(shopTotal)} />
          <StatCard label="Catering Ciro" value={formatCurrency(cateringTotal)} tone="amber" />
          <StatCard label="Teslim Catering" value={deliveredCatering.length} tone="green" />
        </div>
      </Modal>
    </div>
  );
}

import {
  Banknote,
  ChartColumnIncreasing,
  Clock3,
  Percent,
  Receipt,
  ShoppingBasket,
  Star,
  Tags,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import Card from "../components/ui/Card";
import StatCard from "../components/restaurant/StatCard";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { formatCurrency } from "../utils/format";

const methodLabels = {
  cash: "Nakit",
  card: "Kart",
  meal: "Yemek Kartı",
  online: "Online",
};

const emptyRankText = "Seçilen aralıkta satış kaydı yok.";
const percent = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);
const topEntries = (entries, limit = 5) => Object.entries(entries).sort((a, b) => b[1] - a[1]).slice(0, limit);
const todayKey = () => new Date().toISOString().slice(0, 10);

const startOfWeekKey = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diffToMonday);
  return date.toISOString().slice(0, 10);
};

const endOfWeekKey = (dateKey) => {
  const date = new Date(`${startOfWeekKey(dateKey)}T00:00:00`);
  date.setDate(date.getDate() + 6);
  return date.toISOString().slice(0, 10);
};

const getDateKey = (record, ...keys) => {
  const value = keys.map((key) => record?.[key]).find(Boolean);
  return value ? String(value).slice(0, 10) : null;
};

export default function StatisticsPage({
  bills,
  tables = [],
  cateringOrders = [],
  salesRecords = [],
  products = [],
  onResetStatistics,
}) {
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [period, setPeriod] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(todayKey());

  const inSelectedPeriod = (dateKey) => {
    if (!dateKey) return false;
    if (period === "daily") return dateKey === selectedDate;
    if (period === "weekly") {
      const start = startOfWeekKey(selectedDate);
      const end = endOfWeekKey(selectedDate);
      return dateKey >= start && dateKey <= end;
    }
    return dateKey.slice(0, 7) === selectedDate.slice(0, 7);
  };

  const filteredSales = useMemo(
    () => salesRecords.filter((sale) => inSelectedPeriod(getDateKey(sale, "paidAtDate", "createdAtDate"))),
    [salesRecords, period, selectedDate],
  );

  const deliveredCateringOrders = useMemo(
    () =>
      cateringOrders.filter(
        (order) => order.status === "delivered" && inSelectedPeriod(getDateKey(order, "deliveredAtDate", "createdAtDate")),
      ),
    [cateringOrders, period, selectedDate],
  );

  const occupied = tables.filter((table) => table.status !== "empty").length;
  const occupancyRate = percent(occupied, tables.length);
  const pendingTotal = bills.reduce((sum, bill) => sum + Number(bill.total || 0), 0);
  const pendingItemCount = bills.reduce((sum, bill) => sum + Number(bill.itemCount || 0), 0);

  const shopTotal = filteredSales.reduce((sum, sale) => sum + Number(sale.total || sale.amount || 0), 0);
  const shopOrderCount = filteredSales.length;
  const cateringTotal = deliveredCateringOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const cateringOrderCount = deliveredCateringOrders.length;
  const totalRevenue = shopTotal + cateringTotal;
  const totalOrderCount = shopOrderCount + cateringOrderCount;
  const averageTicket = totalOrderCount ? totalRevenue / totalOrderCount : 0;
  const cateringPercent = percent(cateringTotal, totalRevenue);
  const shopPercent = percent(shopTotal, totalRevenue);

  const productCategoryMap = Object.fromEntries(products.map((product) => [product.name, product.category || "Kategorisiz"]));
  const productCounts = {};
  const categoryTotals = {};
  const hourlyTotals = {};
  const paymentTotals = {};
  let soldItemCount = 0;

  filteredSales.forEach((sale) => {
    const saleHour = String(sale.paidAt || "").slice(0, 2);
    if (saleHour) hourlyTotals[saleHour] = (hourlyTotals[saleHour] || 0) + Number(sale.total || sale.amount || 0);
    (sale.payments || [{ method: sale.method, amount: sale.amount || sale.total }]).forEach((payment) => {
      const key = payment.method || sale.method || "cash";
      paymentTotals[key] = (paymentTotals[key] || 0) + Number(payment.amount || 0);
    });
    (sale.items || []).forEach((item) => {
      const name = item.productName || item.name;
      const quantity = Number(item.quantity || 0);
      const total = quantity * Number(item.unitPrice || item.price || 0);
      if (!name || !quantity) return;
      productCounts[name] = (productCounts[name] || 0) + quantity;
      categoryTotals[productCategoryMap[name] || "Kategorisiz"] = (categoryTotals[productCategoryMap[name] || "Kategorisiz"] || 0) + total;
      soldItemCount += quantity;
    });
  });

  deliveredCateringOrders.forEach((order) => {
    const orderHour = String(order.createdAt || "").slice(0, 2);
    if (orderHour) hourlyTotals[orderHour] = (hourlyTotals[orderHour] || 0) + Number(order.total || 0);
    (order.items || []).forEach((item) => {
      const name = item.productName || item.name;
      const quantity = Number(item.quantity || 0);
      const total = quantity * Number(item.unitPrice || item.price || 0);
      if (!name || !quantity) return;
      productCounts[name] = (productCounts[name] || 0) + quantity;
      categoryTotals[item.category || productCategoryMap[name] || "Kategorisiz"] =
        (categoryTotals[item.category || productCategoryMap[name] || "Kategorisiz"] || 0) + total;
      soldItemCount += quantity;
    });
    paymentTotals.cash = (paymentTotals.cash || 0) + Number(order.total || 0);
  });

  const hourlyEntries = Object.entries(hourlyTotals).sort(([a], [b]) => Number(a) - Number(b));
  const maxHourly = Math.max(...hourlyEntries.map(([, value]) => value), 1);
  const topProducts = topEntries(productCounts);
  const topCategories = topEntries(categoryTotals);
  const bestProduct = topProducts[0]?.[0] || "-";
  const busiestHour = hourlyEntries.reduce((best, entry) => (entry[1] > (best?.[1] || 0) ? entry : best), null);
  const paymentTotal = Object.values(paymentTotals).reduce((sum, value) => sum + value, 0);
  const paymentEntries = Object.entries(paymentTotals);

  const paymentSlices = paymentEntries.reduce((cursor, [method, amount], index) => {
    const start = cursor.end;
    const end = start + percent(amount, paymentTotal);
    const color = ["var(--primary)", "var(--gold)", "#0f1717", "#55706b"][index % 4];
    return { end, parts: [...cursor.parts, `${color} ${start}% ${end}%`] };
  }, { end: 0, parts: [] });

  const pieStyle = {
    background: paymentTotal ? `conic-gradient(${paymentSlices.parts.join(", ")})` : "var(--surface-soft)",
  };
  const salesMixStyle = {
    background: totalRevenue
      ? `conic-gradient(var(--primary) 0 ${shopPercent}%, var(--gold) ${shopPercent}% 100%)`
      : "var(--surface-soft)",
  };

  return (
    <div className="page-stack">
      <div className="toolbar">
        <div className="segmented">
          <button className={period === "daily" ? "active" : ""} onClick={() => setPeriod("daily")}>Günlük</button>
          <button className={period === "weekly" ? "active" : ""} onClick={() => setPeriod("weekly")}>Haftalık</button>
          <button className={period === "monthly" ? "active" : ""} onClick={() => setPeriod("monthly")}>Aylık</button>
        </div>
        <div className="toolbar-actions">
          <label className="field">
            <span>Tarih seç</span>
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </label>
          <Button variant="danger" onClick={() => setConfirmResetOpen(true)}>Grafikleri Sıfırla</Button>
        </div>
      </div>

      <div className="stat-grid six">
        <StatCard label="Toplam Ciro" value={formatCurrency(totalRevenue)} icon={Banknote} tone="green" />
        <StatCard label="Dükkan Ciro" value={formatCurrency(shopTotal)} icon={Receipt} />
        <StatCard label="Catering Ciro" value={formatCurrency(cateringTotal)} icon={ShoppingBasket} tone="amber" />
        <StatCard label="Ortalama Adisyon" value={formatCurrency(averageTicket)} icon={ChartColumnIncreasing} tone="amber" />
        <StatCard label="En Çok Satan" value={bestProduct} icon={Star} tone="purple" />
        <StatCard label="Satılan Ürün" value={soldItemCount} icon={Tags} />
        <StatCard label="Açık Adisyon" value={bills.length} icon={Receipt} />
        <StatCard label="Bekleyen Tahsilat" value={formatCurrency(pendingTotal)} icon={Banknote} tone="green" />
        <StatCard label="Açık Ürün Adedi" value={pendingItemCount} icon={ShoppingBasket} />
        <StatCard label="Masa Doluluk" value={`%${occupancyRate}`} icon={Users} tone="amber" />
        <StatCard label="Catering Oranı" value={`%${cateringPercent}`} icon={Percent} tone="purple" />
        <StatCard label="En Yoğun Saat" value={busiestHour ? `${busiestHour[0]}:00` : "-"} icon={Clock3} />
      </div>

      <div className="dashboard-grid">
        <Card>
          <h2>Saatlik Satış</h2>
          {hourlyEntries.length === 0 ? (
            <p className="muted-text">{emptyRankText}</p>
          ) : (
            <div className="bar-chart">
              {hourlyEntries.map(([hour, value]) => (
                <div key={hour}>
                  <span style={{ height: `${Math.max((value / maxHourly) * 180, 24)}px` }} />
                  <small>{hour}:00</small>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h2>En Çok Satan Ürünler</h2>
          <div className="rank-list">
            {topProducts.length === 0 ? <p className="muted-text">{emptyRankText}</p> : topProducts.map(([name, count], index) => (
              <div key={name}>
                <span>{index + 1}</span>
                <strong>{name}</strong>
                <em>{count} adet</em>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="stats-extra-grid">
        <Card>
          <h2>Ödeme Dağılımı</h2>
          <div className="pie-layout">
            <div className="pie-chart" style={pieStyle} />
            <div className="pie-legend">
              {paymentEntries.length === 0 ? <span>Ödeme kaydı yok</span> : paymentEntries.map(([method, amount], index) => (
                <span key={method}>
                  <i style={{ background: ["var(--primary)", "var(--gold)", "#0f1717", "#55706b"][index % 4] }} />
                  {methodLabels[method] || method} %{percent(amount, paymentTotal)}
                </span>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <h2>Catering / Dükkan Satışı</h2>
          <div className="pie-layout">
            <div className="pie-chart" style={salesMixStyle} />
            <div className="pie-legend">
              <span><i style={{ background: "var(--primary)" }} /> Dükkan %{shopPercent}</span>
              <span><i style={{ background: "var(--gold)" }} /> Catering %{cateringPercent}</span>
            </div>
          </div>
        </Card>
        <Card>
          <h2>Kategori Cirosu</h2>
          <div className="metric-list">
            {topCategories.length === 0 ? <p className="muted-text">{emptyRankText}</p> : topCategories.map(([category, total]) => (
              <div key={category}><span>{category}</span><strong>{formatCurrency(total)}</strong></div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={confirmResetOpen}
        title="İstatistikleri Sıfırla"
        onClose={() => setConfirmResetOpen(false)}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setConfirmResetOpen(false)}>Hayır</Button>
            <Button variant="danger" onClick={() => { onResetStatistics?.(); setConfirmResetOpen(false); }}>Evet</Button>
          </>
        )}
      >
        <p>İstatistikleri sıfırlamakta emin misiniz?</p>
      </Modal>
    </div>
  );
}


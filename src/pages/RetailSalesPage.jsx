import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { formatCurrency } from "../utils/format";

const getProductType = (product) => product.productType || (product.isCatering ? "catering" : product.isRetail ? "retail" : "restaurant");

const methods = [
  { value: "cash", label: "Nakit" },
  { value: "card", label: "Kart" },
  { value: "meal", label: "Yemek Kartı" },
  { value: "online", label: "Online" },
];

export default function RetailSalesPage({ products, categories, salesRecords = [], searchQuery = "", onCreateSale }) {
  const [category, setCategory] = useState("Tümü");
  const [method, setMethod] = useState("cash");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [items, setItems] = useState([]);

  const retailProducts = useMemo(
    () => products.filter((product) => product.isActive !== false && getProductType(product) === "retail"),
    [products],
  );
  const query = searchQuery.trim().toLowerCase();
  const visibleProducts = (category === "Tümü" ? retailProducts : retailProducts.filter((product) => product.category === category))
    .filter((product) => !query || [product.name, product.category, product.description].join(" ").toLowerCase().includes(query));
  const retailSales = salesRecords.filter((sale) => sale.channel === "retail");
  const visibleSales = retailSales.filter((sale) => {
    const matchesMethod = historyFilter === "all" || sale.method === historyFilter;
    const matchesQuery = !query || [sale.method, sale.paidAt, ...(sale.items || []).map((item) => item.productName)].join(" ").toLowerCase().includes(query);
    return matchesMethod && matchesQuery;
  });
  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

  const addItem = (product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const completeSale = () => {
    onCreateSale({ items, total, method });
    setItems([]);
  };

  return (
    <div className="catering-layout retail-layout">
      <section className="page-stack">
        <Card className="toolbar-card">
          <Select label="Kategori" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>Tümü</option>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </Card>
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div>
                <div className="product-head">
                  <strong>{product.name}</strong>
                  <span className="badge badge-pending">Perakende</span>
                </div>
                <p>{product.description}</p>
              </div>
              <div className="product-foot">
                <span>{product.category}</span>
                <strong>{formatCurrency(product.price)}</strong>
                <Button variant="primary" size="small" onClick={() => addItem(product)}><Plus size={16} /> Ekle</Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="order-cart">
        <h2>Perakende Satış</h2>
        <Select label="Ödeme tipi" value={method} onChange={(event) => setMethod(event.target.value)}>
          {methods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
        <div className="cart-lines">
          {items.length === 0 ? <p>Ürün eklenmedi.</p> : items.map((item) => (
            <div className="cart-line" key={item.id}>
              <div><strong>{item.name}</strong><span>{formatCurrency(item.price)}</span></div>
              <Input type="number" min="1" value={item.quantity} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantity: Number(event.target.value) || 1 } : entry))} />
              <button className="icon-button danger" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <div className="cart-total"><span>Toplam</span><strong>{formatCurrency(total)}</strong></div>
        <Button variant="primary" size="large" disabled={!items.length} onClick={completeSale}>Satışı Kaydet</Button>
      </aside>

      <Card className="span-2 catering-history-card">
        <div className="card-title-row">
          <div>
            <h2>Perakende Satış Geçmişi</h2>
            <p>Direkt satış olarak kaydedilen ürünler.</p>
          </div>
          <div className="segmented">
            <button className={historyFilter === "all" ? "active" : ""} onClick={() => setHistoryFilter("all")}>Tümü</button>
            {methods.map((item) => (
              <button key={item.value} className={historyFilter === item.value ? "active" : ""} onClick={() => setHistoryFilter(item.value)}>{item.label}</button>
            ))}
          </div>
        </div>
        <div className="catering-history-list">
          {visibleSales.length === 0 ? <p>Bu filtrede perakende satış yok.</p> : visibleSales.map((sale) => (
            <div key={sale.id}>
              <div>
                <strong>{methods.find((item) => item.value === sale.method)?.label || "Satış"}</strong>
                <span>{sale.paidAt}</span>
                <em>{(sale.items || []).map((item) => `${item.quantity}x ${item.productName}`).join(", ")}</em>
              </div>
              <strong>{formatCurrency(sale.total)}</strong>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

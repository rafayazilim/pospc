import { useMemo, useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Select from "../components/ui/Select";
import { Input, Textarea } from "../components/ui/Input";
import { formatCurrency } from "../utils/format";

const getProductType = (product) => product.productType || (product.isCatering ? "catering" : product.isRetail ? "retail" : "restaurant");

export default function CateringOrderPage({ products, categories, orders, searchQuery = "", onCreateOrder, onMarkDelivered }) {
  const [category, setCategory] = useState("Tümü");
  const [statusFilter, setStatusFilter] = useState("preparing");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState([]);

  const cateringProducts = useMemo(
    () => products.filter((product) => product.isActive !== false && getProductType(product) === "catering"),
    [products],
  );

  const query = searchQuery.trim().toLowerCase();
  const visibleProducts = (category === "Tümü" ? cateringProducts : cateringProducts.filter((product) => product.category === category))
    .filter((product) => !query || [product.name, product.category, product.description].join(" ").toLowerCase().includes(query));
  const visibleOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === "all" || (order.status || "preparing") === statusFilter;
    const matchesQuery = !query || [order.customer, order.phone, order.deliveryDate, ...(order.items || []).map((item) => item.name)].join(" ").toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const addItem = (product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const createOrder = () => {
    onCreateOrder({ customer, phone, deliveryDate, note, items, total });
    setCustomer("");
    setPhone("");
    setDeliveryDate("");
    setNote("");
    setItems([]);
  };

  return (
    <div className="catering-layout">
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
                  <span className={`badge ${product.isCatering ? "badge-service" : "badge-active"}`}>
                    {product.isCatering ? "Catering" : "Dükkan"}
                  </span>
                </div>
                <p>{product.description}</p>
              </div>
              <div className="product-foot">
                <span>{product.category}</span>
                <span>{product.prepTime}</span>
                <strong>{formatCurrency(product.price)}</strong>
                <Button variant="primary" size="small" onClick={() => addItem(product)}><Plus size={16} /> Ekle</Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="order-cart">
        <h2>Catering Siparişi</h2>
        <Input label="Müşteri adı" value={customer} onChange={(event) => setCustomer(event.target.value)} />
        <Input label="Telefon" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <Input label="Teslim tarihi / saati" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} placeholder="Örn: 12 Mayıs 18:00" />
        <div className="cart-lines">
          {items.length === 0 ? <p>Ürün eklenmedi.</p> : items.map((item) => (
            <div className="cart-line" key={item.id}>
              <div><strong>{item.name}</strong><span>{formatCurrency(item.price)}</span></div>
              <Input type="number" min="1" value={item.quantity} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, quantity: Number(event.target.value) || 1 } : entry))} />
              <button className="icon-button danger" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <Textarea label="Sipariş notu" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
        <div className="cart-total"><span>Toplam</span><strong>{formatCurrency(total)}</strong></div>
        <Button variant="primary" size="large" disabled={!customer || !items.length} onClick={createOrder}>Catering Siparişi Oluştur</Button>
      </aside>

      <Card className="span-2 catering-history-card">
        <div className="card-title-row">
          <div>
            <h2>Catering Siparişleri</h2>
            <p>Teslim edilen siparişler kasaya ve istatistiklere yansır.</p>
          </div>
          <div className="segmented">
            <button className={statusFilter === "preparing" ? "active" : ""} onClick={() => setStatusFilter("preparing")}>Hazırlananlar</button>
            <button className={statusFilter === "delivered" ? "active" : ""} onClick={() => setStatusFilter("delivered")}>Teslim Edilenler</button>
            <button className={statusFilter === "all" ? "active" : ""} onClick={() => setStatusFilter("all")}>Tümü</button>
          </div>
        </div>
        <div className="catering-history-list">
          {visibleOrders.length === 0 ? <p>Bu filtrede catering siparişi yok.</p> : visibleOrders.map((order) => (
            <div key={order.id}>
              <div>
                <strong>{order.customer}</strong>
                <span>{order.phone || "Telefon yok"} · {order.deliveryDate || "Teslim tarihi yok"} · {order.createdAt}</span>
                <em>{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</em>
              </div>
              <div className="catering-history-actions">
                <span className={`badge ${(order.status || "preparing") === "delivered" ? "badge-payment" : "badge-pending"}`}>
                  {(order.status || "preparing") === "delivered" ? "Teslim edildi" : "Hazırlanıyor"}
                </span>
                <strong>{formatCurrency(order.total)}</strong>
                {(order.status || "preparing") !== "delivered" ? (
                  <Button variant="primary" size="small" onClick={() => onMarkDelivered(order.id)}>
                    <CheckCircle2 size={16} /> Teslim Edildi
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

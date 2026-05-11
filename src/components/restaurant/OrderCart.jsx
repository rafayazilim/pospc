import { Minus, Plus, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import Select from "../ui/Select";
import { Textarea } from "../ui/Input";
import { formatCurrency } from "../../utils/format";

export default function OrderCart({ tables, selectedTableId, onSelectTable, items, note, setNote, setItems, onSubmit }) {
  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const updateQuantity = (id, delta) => {
    setItems((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: Math.max(item.quantity + delta, 1) } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  return (
    <aside className="order-cart">
      <h2>Sipariş Özeti</h2>
      <Select label="Masa" value={selectedTableId} onChange={(event) => onSelectTable(event.target.value)}>
        {tables.map((table) => (
          <option key={table.id} value={table.id}>{table.name} - {table.area}</option>
        ))}
      </Select>
      <div className="cart-lines">
        {items.length === 0 ? <p>Sepet boş. Ürün kartlarından ekleme yapın.</p> : items.map((item) => (
          <div className="cart-line" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>{formatCurrency(item.price)}</span>
            </div>
            <div className="qty-control">
              <button onClick={() => updateQuantity(item.id, -1)}><Minus size={15} /></button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, 1)}><Plus size={15} /></button>
            </div>
            <button className="icon-button danger" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}>
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
      <Textarea label="Sipariş notu" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Mutfak veya servis notu" />
      <div className="cart-total">
        <span>Toplam</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
      <Button variant="primary" size="large" disabled={!items.length} onClick={onSubmit}>Siparişi Masaya Ekle</Button>
    </aside>
  );
}

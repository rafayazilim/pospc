import { useMemo, useState } from "react";
import Tabs from "../components/ui/Tabs";
import ProductCard from "../components/restaurant/ProductCard";
import OrderCart from "../components/restaurant/OrderCart";

const getProductType = (product) => product.productType || (product.isCatering ? "catering" : product.isRetail ? "retail" : "restaurant");

export default function CreateOrderPage({ tables, products, categories = [], searchQuery = "", initialTableId, onSubmitOrder }) {
  const [category, setCategory] = useState("Tümü");
  const [selectedTableId, setSelectedTableId] = useState(initialTableId || tables[0]?.id || 1);
  const [items, setItems] = useState([]);
  const [note, setNote] = useState("");

  const tabs = [{ value: "Tümü", label: "Tümü" }, ...categories.map((item) => ({ value: item, label: item }))];
  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory = category === "Tümü" || product.category === category;
        const matchesQuery = !searchQuery.trim() || [product.name, product.category, product.description].join(" ").toLowerCase().includes(searchQuery.trim().toLowerCase());
        return product.isActive !== false && getProductType(product) === "restaurant" && matchesCategory && matchesQuery;
      }),
    [category, products, searchQuery],
  );

  const addProduct = (product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const submit = () => {
    items.forEach((item) => onSubmitOrder(selectedTableId, item, item.quantity, note));
    setItems([]);
    setNote("");
  };

  return (
    <div className="order-layout">
      <section className="order-products">
        <Tabs items={tabs} value={category} onChange={setCategory} />
        <div className="product-grid">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addProduct} />
          ))}
        </div>
      </section>
      <OrderCart
        tables={tables}
        selectedTableId={selectedTableId}
        onSelectTable={setSelectedTableId}
        items={items}
        note={note}
        setNote={setNote}
        setItems={setItems}
        onSubmit={submit}
      />
    </div>
  );
}

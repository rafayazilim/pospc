import { useEffect, useMemo, useState } from "react";
import { WalletCards } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import Select from "../components/ui/Select";
import { formatCurrency, tableTotal } from "../utils/format";

const keypad = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", ".", "0", "Sil", "+", "Tümünü Sil", "="];

const calculateExpression = (value) => {
  if (!value || !/^[\d+\-*/. ()]+$/.test(value)) return "";
  try {
    const result = Function(`"use strict"; return (${value})`)();
    return Number.isFinite(result) ? String(result) : "";
  } catch {
    return "";
  }
};

export default function QuickCashPage({
  openBills = [],
  products = [],
  onAddProductToBill,
  onDeleteOrder,
  onUpdateOrder,
  onPayment,
  onPrintReceipt,
}) {
  const [calculatorValue, setCalculatorValue] = useState("");
  const [calculatorResult, setCalculatorResult] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [productId, setProductId] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const activeProducts = products.filter((product) => product.isActive !== false);
  const categories = useMemo(
    () => [...new Set(activeProducts.map((product) => product.category || "Kategorisiz"))],
    [activeProducts],
  );
  const groupedProducts = categories
    .map((category) => ({
      category,
      products: activeProducts.filter((product) => (product.category || "Kategorisiz") === category),
    }))
    .filter((group) => group.products.length > 0);

  const currentBill = selectedBill ? openBills.find((bill) => bill.id === selectedBill.id) : null;
  const selectedProduct = activeProducts.find((product) => product.id === Number(productId)) || activeProducts[0];
  const selectedBillTotal = currentBill?.table ? tableTotal(currentBill.table) : currentBill?.total || 0;

  useEffect(() => {
    if (!currentBill) return;
    setCalculatorValue(String(selectedBillTotal));
    setCalculatorResult("");
  }, [currentBill, selectedBillTotal]);

  const pressKey = (key) => {
    if (key === "Tümünü Sil") {
      setCalculatorValue("");
      setCalculatorResult("");
      return;
    }
    if (key === "Sil") {
      setCalculatorValue((current) => current.slice(0, -1));
      setCalculatorResult("");
      return;
    }
    if (key === "=") {
      setCalculatorResult(calculateExpression(calculatorValue));
      return;
    }
    setCalculatorValue((current) => `${current}${key}`);
  };

  const openBillDetail = (bill) => {
    setSelectedBill(bill);
    setShowAddProduct(false);
  };

  const addSelectedProduct = () => {
    if (!currentBill?.table?.id || !selectedProduct) return;
    onAddProductToBill?.(currentBill.table.id, selectedProduct, Number(productQuantity) || 1, "Hızlı kasa");
    setProductQuantity(1);
    setShowAddProduct(false);
  };

  return (
    <main className="quickcash-page">
      <section className="quickcash-top">
        <div className="quickcash-left">
          <Card className="quickcash-bills-card">
            <div className="section-title-row">
              <h3>Açık Adisyonlar</h3>
              <span>{openBills.length} adisyon</span>
            </div>
            {openBills.length === 0 ? (
              <p className="muted-text">Açık adisyon yok.</p>
            ) : (
              <div className="quickcash-list quickcash-bill-list">
                {openBills.map((bill) => (
                  <button
                    key={bill.id}
                    className={currentBill?.id === bill.id ? "active" : ""}
                    onClick={() => openBillDetail(bill)}
                  >
                    <strong>{bill.table?.name || bill.id}</strong>
                    <em>{formatCurrency(bill.total)}</em>
                  </button>
                ))}
              </div>
            )}

            {currentBill ? (
              <div className="quickcash-bill-detail">
                <div className="section-title-row">
                  <h3>{currentBill.table?.name || currentBill.id} Adisyon Detayı</h3>
                  <Button variant="secondary" size="small" onClick={() => setSelectedBill(null)}>Listeye Dön</Button>
                </div>

                <div className="quickcash-bill-meta">
                  <div>
                    <span>Masa</span>
                    <strong>{currentBill.table?.name || "-"}</strong>
                  </div>
                  <div>
                    <span>Açılış</span>
                    <strong>{currentBill.table?.openedAt || "--:--"}</strong>
                  </div>
                  <div>
                    <span>Ürün</span>
                    <strong>{currentBill.itemCount || 0}</strong>
                  </div>
                  <div>
                    <span>Toplam</span>
                    <strong>{formatCurrency(selectedBillTotal)}</strong>
                  </div>
                </div>

                <div className="bill-total">
                  <span>Adisyon Toplamı</span>
                  <strong>{formatCurrency(selectedBillTotal)}</strong>
                </div>

                <button className={`quickcash-add-preview ${showAddProduct ? "active" : ""}`} onClick={() => setShowAddProduct((value) => !value)}>
                  <span>Ürün Ekle</span>
                  <em>Menüden ürün seç</em>
                  <strong>+</strong>
                </button>

                {showAddProduct ? (
                  <div className="quickcash-add-card">
                    <h3>Ürün Ekle</h3>
                    <div className="quickcash-add-row">
                      <Select className="quickcash-product-select" value={productId || selectedProduct?.id || ""} onChange={(event) => setProductId(event.target.value)}>
                        {groupedProducts.map((group) => (
                          <optgroup key={group.category} label={group.category}>
                            {group.products.map((product) => (
                              <option key={product.id} value={product.id}>{product.name} - {formatCurrency(product.price)}</option>
                            ))}
                          </optgroup>
                        ))}
                      </Select>
                      <Input label="Miktar" type="number" min="1" value={productQuantity} onChange={(event) => setProductQuantity(event.target.value)} />
                      <Button variant="primary" disabled={!selectedProduct} onClick={addSelectedProduct}>Ekle</Button>
                    </div>
                  </div>
                ) : null}

                <div className="quickcash-order-list">
                  {(currentBill.table?.orders || []).map((order) => (
                    <div key={order.id}>
                      <span>{order.productName}</span>
                      <Input
                        label="Miktar"
                        type="number"
                        min="1"
                        value={order.quantity}
                        onChange={(event) => onUpdateOrder?.(currentBill.table.id, order.id, { quantity: event.target.value })}
                      />
                      <Input
                        label="Fiyat"
                        type="number"
                        min="0"
                        value={order.unitPrice}
                        onChange={(event) => onUpdateOrder?.(currentBill.table.id, order.id, { unitPrice: event.target.value })}
                      />
                      <Badge status={order.status} />
                      <strong>{formatCurrency(order.quantity * order.unitPrice)}</strong>
                      <Button variant="danger" size="small" onClick={() => onDeleteOrder?.(currentBill.table.id, order.id)}>Kaldır</Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        <aside className="cashier-tab">
          <div className="cashier-tab-head">
            <span>
              <WalletCards size={22} />
            </span>
            <div>
              <strong>Hızlı Kasa</strong>
              <em>İşlem yapmak istediğiniz adisyonu seçin</em>
            </div>
          </div>

          <div className="cashier-display">
            <span>İşlem</span>
            <strong>{calculatorValue || "0"}</strong>
            <em>{calculatorResult ? `= ${calculatorResult}` : "Sonuç bekliyor"}</em>
          </div>

          <div className="cashier-keypad">
            {keypad.map((key) => (
              <button key={key} className={key === "=" ? "equals" : key === "Tümünü Sil" ? "clear-all" : key === "Sil" ? "delete-key" : ""} onClick={() => pressKey(key)}>
                {key}
              </button>
            ))}
          </div>

          <div className="quickcash-payment-actions cashier-actions">
            <Button variant="outline" disabled={!currentBill} onClick={() => onPrintReceipt?.(currentBill.table)}>Yazdır</Button>
            <Button variant="success" disabled={!currentBill} onClick={() => onPayment?.(currentBill.table)}>Ödeme Al</Button>
          </div>
        </aside>
      </section>
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Banknote, Check, CreditCard, Minus, Plus, WalletCards } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { Input } from "../ui/Input";
import { formatCurrency } from "../../utils/format";

const methods = [
  { id: "cash", label: "Nakit", icon: Banknote },
  { id: "card", label: "Kredi Kartı", icon: CreditCard },
  { id: "meal", label: "Yemek Kartı", icon: WalletCards },
  { id: "online", label: "Online", icon: Check },
];

export default function PaymentModal({ table, settings, open, onClose, onComplete, onPrintReceipt }) {
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState(0);
  const [amountTouched, setAmountTouched] = useState(false);
  const [selected, setSelected] = useState({});
  const [payments, setPayments] = useState([]);
  const [paymentError, setPaymentError] = useState("");

  const availableOrders = useMemo(
    () => (table?.orders || []).filter((order) => order.quantity - (order.paidQuantity || 0) > 0),
    [table],
  );

  const selectedItems = useMemo(
    () =>
      availableOrders
        .map((order) => ({
          orderId: order.id,
          productName: order.productName,
          unitPrice: order.unitPrice,
          quantity: Math.min(selected[order.id] || 0, order.quantity - (order.paidQuantity || 0)),
        }))
        .filter((item) => item.quantity > 0),
    [availableOrders, selected],
  );

  const subtotal = selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const service = 0;
  const total = subtotal;
  const paid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const remaining = Math.max(total - paid, 0);

  useEffect(() => {
    if (!open || !table) return;
    const initial = {};
    table.orders.forEach((order) => {
      initial[order.id] = order.quantity - (order.paidQuantity || 0);
    });
    setSelected(initial);
    setPayments([]);
    setMethod("cash");
    setAmountTouched(false);
    setPaymentError("");
  }, [open, table]);

  useEffect(() => {
    if (open && !amountTouched) setAmount(total);
  }, [open, total, amountTouched]);

  if (!table) return null;

  const setItemQuantity = (order, value) => {
    const max = order.quantity - (order.paidQuantity || 0);
    setSelected((current) => ({ ...current, [order.id]: Math.max(0, Math.min(Number(value) || 0, max)) }));
    setPayments([]);
    setPaymentError("");
    setAmountTouched(false);
  };

  const toggleOrder = (order) => {
    const max = order.quantity - (order.paidQuantity || 0);
    setSelected((current) => ({ ...current, [order.id]: current[order.id] > 0 ? 0 : max }));
    setPayments([]);
    setPaymentError("");
    setAmountTouched(false);
  };

  const selectAll = () => {
    const next = {};
    availableOrders.forEach((order) => {
      next[order.id] = order.quantity - (order.paidQuantity || 0);
    });
    setSelected(next);
    setPayments([]);
    setPaymentError("");
    setAmountTouched(false);
  };

  const clearSelection = () => {
    setSelected({});
    setPayments([]);
    setPaymentError("");
    setAmountTouched(false);
  };

  const addPayment = () => {
    const value = Math.min(Number(amount) || 0, remaining || total);
    if (!value) return;
    setPaymentError("");
    setPayments((current) => [...current, { method, amount: value }]);
    setAmount(Math.max(remaining - value, 0));
    setAmountTouched(false);
  };

  const finish = () => {
    if (!selectedItems.length) {
      setPaymentError("Ödenecek ürün veya adet seçin.");
      return;
    }
    const finalPayments = payments.length ? payments : [{ method, amount: total }];
    const paidAmount = finalPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    if (payments.length && paidAmount < total) {
      setPaymentError("Seçili ürün/adetlerin toplamı tam ödenmedi. Kısmi ödeme için soldan ödenecek adetleri azaltın veya kalan tutarı ekleyin.");
      return;
    }
    onComplete(table.id, {
      method,
      amount: paidAmount,
      items: selectedItems,
      serviceFeeRate: 0,
      service,
      subtotal,
      total,
      payments: finalPayments,
    });
    setPayments([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={`${table.name} - Ödeme Al`}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Vazgeç</Button>
          <Button variant="outline" onClick={() => onPrintReceipt(table, settings, selectedItems)}>Adisyon Yazdır</Button>
          <Button variant="success" disabled={!selectedItems.length} onClick={finish}>Ödeme Tamamla</Button>
        </>
      }
    >
      <div className="payment-summary">
        <div><span>Ara Toplam</span><strong>{formatCurrency(subtotal)}</strong></div>
        <div><span>Kalan</span><strong>{formatCurrency(remaining)}</strong></div>
      </div>

      <div className="payment-split-layout">
        <section>
          <div className="section-title-row">
            <h3>Adisyon</h3>
            <div className="quick-actions">
              <Button variant="ghost" size="small" onClick={selectAll}>Tümünü Seç</Button>
              <Button variant="ghost" size="small" onClick={clearSelection}>Temizle</Button>
            </div>
          </div>
          <div className="payable-order-list">
            {availableOrders.map((order) => {
              const remainingQty = order.quantity - (order.paidQuantity || 0);
              const selectedQty = selected[order.id] || 0;
              return (
                <div key={order.id} className={selectedQty > 0 ? "selected" : ""}>
                  <label className="payable-check">
                    <input type="checkbox" checked={selectedQty > 0} onChange={() => toggleOrder(order)} />
                  </label>
                  <button className="payable-info" onClick={() => toggleOrder(order)}>
                    <strong>{order.productName}</strong>
                    <span>{remainingQty} adet kaldı · {formatCurrency(order.unitPrice)}</span>
                  </button>
                  <div className="payable-stepper">
                    <button onClick={() => setItemQuantity(order, selectedQty - 1)}><Minus size={15} /></button>
                    <input
                      type="number"
                      min="0"
                      max={remainingQty}
                      value={selectedQty}
                      onChange={(event) => setItemQuantity(order, event.target.value)}
                    />
                    <button onClick={() => setItemQuantity(order, selectedQty + 1)}><Plus size={15} /></button>
                  </div>
                  <strong className="payable-line-total">{formatCurrency(selectedQty * order.unitPrice)}</strong>
                </div>
              );
            })}
          </div>
          <div className="selected-payment-total">
            <span>Seçili ödeme tutarı</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </section>

        <section>
          <h3>Ödeme</h3>
          <div className="method-grid">
            {methods.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} className={method === item.id ? "active" : ""} onClick={() => setMethod(item.id)}>
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="payment-row">
            <Input label="Tutar" type="number" value={amount} onChange={(event) => { setAmountTouched(true); setAmount(event.target.value); }} />
            <Button variant="primary" onClick={addPayment}>Ödeme Ekle</Button>
          </div>
          <div className="quick-actions">
            <Button variant="outline" onClick={() => { setMethod("cash"); setAmountTouched(false); setAmount(remaining || total); }}>Seçileni Nakit Al</Button>
            <Button variant="outline" onClick={() => { setMethod("card"); setAmountTouched(false); setAmount(remaining || total); }}>Seçileni Kart Al</Button>
          </div>
          <div className="payment-list">
            {payments.length === 0 ? <p>Ödeme eklenmezse seçili tutarın tamamı alınır.</p> : payments.map((payment, index) => (
              <div key={`${payment.method}-${index}`}>
                <span>{methods.find((item) => item.id === payment.method)?.label}</span>
                <strong>{formatCurrency(payment.amount)}</strong>
              </div>
            ))}
          </div>
          {paymentError ? <div className="payment-error">{paymentError}</div> : null}
        </section>
      </div>
    </Modal>
  );
}

import { ArrowRightLeft, Printer, Receipt, Trash2, Users } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Drawer from "../ui/Drawer";
import { formatCurrency, tableTotal } from "../../utils/format";

export default function TableDetailDrawer({
  table,
  open,
  onClose,
  onAddProduct,
  onStartTable,
  onReserve,
  onPayment,
  onCloseTable,
  onMoveTable,
  onPrintReceipt,
  onDeleteOrder,
}) {
  if (!table) return null;

  const total = tableTotal(table);
  const discount = table.status === "payment" ? 50 : 0;
  const grandTotal = Math.max(total - discount, 0);

  return (
    <Drawer open={open} title={table.name} onClose={onClose}>
      <div className="drawer-section compact">
        <div className="drawer-title-row">
          <Badge status={table.status} />
          <span>{table.area}</span>
        </div>
        <div className="table-facts">
          <span><Users size={16} /> {table.guests || 0} kişi</span>
          <span>Açılış: {table.openedAt || "--:--"}</span>
        </div>
      </div>

      {table.status === "empty" || table.status === "reserved" ? (
        <div className="drawer-section">
          <h3>Hızlı işlem</h3>
          <div className="action-stack">
            <Button variant="primary" size="large" onClick={() => onStartTable(table.id, 2)}>Yeni Sipariş Başlat</Button>
            <Button variant="outline" size="large" onClick={() => onReserve(table.id)}>Masa Rezerve Et</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="drawer-section">
            <h3>Siparişler</h3>
            <div className="order-list">
              {table.orders.map((order) => {
                const remainingQty = order.quantity - (order.paidQuantity || 0);
                return (
                  <div className="order-row" key={order.id}>
                    <div>
                      <strong>{order.productName}</strong>
                      <span>
                        {remainingQty}/{order.quantity} açık · {formatCurrency(order.unitPrice)}
                        {order.note ? ` · ${order.note}` : ""}
                      </span>
                    </div>
                    <Badge status={order.status} />
                    <strong>{formatCurrency(remainingQty * order.unitPrice)}</strong>
                    <button className="icon-button danger" aria-label="Ürün iptal" onClick={() => onDeleteOrder(table.id, order.id)}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="drawer-section totals">
            <div><span>Ara toplam</span><strong>{formatCurrency(total)}</strong></div>
            <div><span>İndirim</span><strong>-{formatCurrency(discount)}</strong></div>
            <div className="grand"><span>Genel toplam</span><strong>{formatCurrency(grandTotal)}</strong></div>
          </div>
          <div className="drawer-section">
            <div className="action-grid">
              <Button variant="primary" size="large" onClick={() => onAddProduct(table.id)}>Ürün Ekle</Button>
              <Button variant="outline" size="large" onClick={() => onPrintReceipt(table)}>
                <Printer size={18} /> Adisyon Yazdır
              </Button>
              <Button variant="success" size="large" onClick={() => onPayment(table)}>
                <Receipt size={18} /> Ödeme Al
              </Button>
              <Button variant="secondary" size="large" onClick={() => onMoveTable(table)}>
                <ArrowRightLeft size={18} /> Masayı Taşı
              </Button>
              <Button variant="danger" size="large" className="span-2" onClick={() => onCloseTable(table.id)}>Masayı Kapat</Button>
            </div>
          </div>
        </>
      )}
    </Drawer>
  );
}

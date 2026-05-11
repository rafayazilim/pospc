import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import { formatCurrency, tableTotal } from "../../utils/format";

export default function BillDetailModal({ bill, open, onClose, onPayment, onPrintReceipt }) {
  if (!bill) return null;
  const total = tableTotal(bill.table);

  return (
    <Modal
      open={open}
      title={`${bill.id} - ${bill.table.name}`}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={() => onPrintReceipt(bill.table)}>Yazdır</Button>
          <Button variant="success" onClick={() => onPayment(bill.table)}>Ödeme Al</Button>
        </>
      }
    >
      <div className="bill-detail-list">
        {bill.table.orders.map((order) => (
          <div key={order.id}>
            <span>{order.productName}</span>
            <span>{order.quantity} adet</span>
            <Badge status={order.status} />
            <strong>{formatCurrency(order.quantity * order.unitPrice)}</strong>
          </div>
        ))}
      </div>
      <div className="bill-total">
        <span>Toplam</span>
        <strong>{formatCurrency(total)}</strong>
      </div>
    </Modal>
  );
}

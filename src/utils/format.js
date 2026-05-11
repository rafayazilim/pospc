export const formatCurrency = (value) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const tableTotal = (table) =>
  table.orders.reduce((sum, order) => sum + (order.quantity - (order.paidQuantity || 0)) * order.unitPrice, 0);

export const tableGrossTotal = (table) =>
  table.orders.reduce((sum, order) => sum + order.quantity * order.unitPrice, 0);

export const billService = (subtotal, serviceFeeRate = 10) => Math.round((subtotal * Number(serviceFeeRate || 0)) / 100);

export const billGrandTotal = (subtotal, serviceFeeRate = 10, discount = 0) =>
  Math.max(subtotal + billService(subtotal, serviceFeeRate) - Number(discount || 0), 0);

export const nowTime = () =>
  new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

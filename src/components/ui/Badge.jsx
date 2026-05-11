const labels = {
  empty: "Boş",
  occupied: "Dolu",
  pending: "Sipariş Bekliyor",
  service: "Servis Açık",
  payment: "Ödeme Bekliyor",
  reserved: "Rezerve",
  served: "Servis Edildi",
  preparing: "Hazırlanıyor",
  new: "Yeni",
  closed: "Kapandı",
  active: "Aktif",
  passive: "Pasif",
};

export default function Badge({ status = "active", children }) {
  return <span className={`badge badge-${status}`}>{children || labels[status] || status}</span>;
}

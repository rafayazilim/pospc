import {
  BarChart3,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ConciergeBell,
  CreditCard,
  Home,
  LayoutDashboard,
  PackageCheck,
  Receipt,
  Settings,
  ShoppingBasket,
  Utensils,
} from "lucide-react";

const navItems = [
  { id: "home", label: "Ana Ekran", icon: Home },
  { id: "tables", label: "Masalar", icon: LayoutDashboard },
  { id: "order", label: "Sipariş Oluştur", icon: Utensils },
  { id: "catering", label: "Catering Sipariş", icon: ConciergeBell },
  { id: "retail", label: "Perakende Satış", icon: PackageCheck },
  { id: "bills", label: "Açık Adisyonlar", icon: Receipt },
  { id: "payments", label: "Ödemeler", icon: CreditCard },
  { id: "stats", label: "İstatistikler", icon: BarChart3 },
  { id: "endofday", label: "Gün Sonu Özeti", icon: CalendarCheck },
  { id: "products", label: "Ürünler / Menü", icon: ShoppingBasket },
  { id: "settings", label: "Ayarlar", icon: Settings },
];

export default function Sidebar({ currentPage, collapsed, onToggle, onNavigate }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand">
        <div className="brand-icon">
          <img src="./pospcico.png" alt="" />
        </div>
        {!collapsed ? (
          <div>
            <strong>Göçmen Kızının Mutfağı</strong>
            <span>Restaurant POS</span>
          </div>
        ) : null}
      </div>
      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={currentPage === item.id ? "active" : ""} onClick={() => onNavigate(item.id)} title={item.label}>
              <Icon size={20} />
              {!collapsed ? <span>{item.label}</span> : null}
            </button>
          );
        })}
      </nav>
      <button className="collapse-button" onClick={onToggle}>
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        {!collapsed ? <span>Daralt</span> : null}
      </button>
    </aside>
  );
}

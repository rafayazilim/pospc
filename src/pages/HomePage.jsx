import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ConciergeBell,
  CreditCard,
  Headphones,
  PackageCheck,
  ReceiptText,
  Settings,
  Store,
  Table2,
  User,
  Wifi,
  Wrench,
} from "lucide-react";

const modules = [
  { id: "tables", label: "Masalar", icon: Table2 },
  { id: "order", label: "Sipariş Oluştur", icon: ReceiptText },
  { id: "payments", label: "Ödemeler", icon: CreditCard },
  { id: "stats", label: "İstatistikler", icon: BarChart3 },
  { id: "endofday", label: "Gün Sonu", icon: CalendarCheck },
  { id: "products", label: "Menü", icon: BookOpen },
  { id: "catering", label: "Catering", icon: ConciergeBell },
  { id: "retail", label: "Perakende", icon: PackageCheck },
];

export default function HomePage({ onNavigate }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const dateText = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
  }).format(now);

  const timeText = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  return (
    <main className="launch-screen">
      <header className="launch-header">
        <button className="launch-logo" onClick={() => onNavigate("home")}>
          <img src="./pospcico.png" alt="" />
          <span>
            RAFA <strong>POS</strong> PC
          </span>
        </button>
        <div className="launch-restaurant">GÖÇMEN KIZININ MUTFAĞI</div>
        <div className="launch-status">
          <span>
            <Wifi size={24} />
            <strong>İnternet</strong>
            <em>Bağlı</em>
          </span>
          <span>
            <Store size={24} />
            <strong>Server</strong>
            <em>Bağlı</em>
          </span>
          <button onClick={() => onNavigate("settings")}>
            <Wrench size={22} />
            <strong>Restoran</strong>
            <em>Değiştir</em>
          </button>
          <button onClick={() => onNavigate("settings")}>
            <User size={22} />
            <strong>Kasiyer</strong>
            <em>Değiştir</em>
          </button>
        </div>
      </header>

      <section className="launch-body">
        <aside className="launch-left">
          <div className="launch-clock">
            <span>{dateText}</span>
            <strong>{timeText}</strong>
            <div className="weather-line">
              <span className="weather-icon">☁</span>
              <div>
                <b>12°</b>
                <em>Açık ve Güneşli</em>
              </div>
            </div>
          </div>
        </aside>

        <section className="launch-modules">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button key={module.id} onClick={() => onNavigate(module.id)}>
                <Icon size={82} strokeWidth={1.6} />
                <strong>{module.label}</strong>
              </button>
            );
          })}
        </section>
      </section>

      <footer className="launch-footer">
        <div className="support-line">
          <Headphones size={30} />
          <span>
            İletişim <strong>rafayazilim.com</strong>
          </span>
        </div>
        <span>RAFA POS PC v1.5.2</span>
        <button className="launch-settings" onClick={() => onNavigate("settings")}>
          Ayarlar <Settings size={28} />
        </button>
      </footer>
    </main>
  );
}

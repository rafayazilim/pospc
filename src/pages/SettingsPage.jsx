import { useEffect, useState } from "react";
import { Building2, MonitorCog, Printer, Trash2, UserCog } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import Tabs from "../components/ui/Tabs";
import { Input } from "../components/ui/Input";

const tabs = [
  { value: "restaurant", label: "Restoran Bilgileri" },
  { value: "tables", label: "Masa Düzeni" },
  { value: "printers", label: "Yazıcı Ayarları" },
  { value: "users", label: "Kullanıcılar" },
  { value: "tax", label: "Vergi" },
  { value: "data", label: "Veri" },
  { value: "theme", label: "Tema" },
];

export default function SettingsPage({ settings, tables = [], onAddTable, onDeleteTable, onUpdateSettings, onResetSalesData, onNotify }) {
  const [tab, setTab] = useState("restaurant");
  const [tableForm, setTableForm] = useState({ name: "", area: "Salon", capacity: 4 });
  const [printers, setPrinters] = useState([]);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [lockEnabled, setLockEnabled] = useState(Boolean(settings.lockEnabled));
  const [lockPin, setLockPin] = useState(settings.lockPin || "");
  const [lockPinConfirm, setLockPinConfirm] = useState(settings.lockPin || "");
  const [lockTimeoutMinutes, setLockTimeoutMinutes] = useState(Number(settings.lockTimeoutMinutes) || 30);
  const [lockError, setLockError] = useState("");

  const loadPrinters = async () => {
    if (!window.restaurantPrinter?.list) {
      onNotify("Yazıcı kontrolü sadece masaüstü Electron uygulamasında çalışır.");
      return;
    }
    const list = await window.restaurantPrinter.list();
    setPrinters(list || []);
    onNotify(list?.length ? `${list.length} yazıcı bulundu` : "Sistemde kayıtlı yazıcı bulunamadı");
  };

  useEffect(() => {
    if (tab === "printers") loadPrinters();
  }, [tab]);

  useEffect(() => {
    setLockEnabled(Boolean(settings.lockEnabled));
    setLockPin(settings.lockPin || "");
    setLockPinConfirm(settings.lockPin || "");
    setLockTimeoutMinutes(Number(settings.lockTimeoutMinutes) || 30);
  }, [settings.lockEnabled, settings.lockPin, settings.lockTimeoutMinutes]);

  const testPayload = {
    table: { name: "TEST", orders: [] },
    settings,
    selectedItems: [
      { productName: "Test Ürünü", quantity: 1, unitPrice: 10 },
      { productName: "Test Kalemi", quantity: 1, unitPrice: 5 },
    ],
    printerName: settings.printerName,
    rawPrinterPath: settings.rawPrinterPath,
    printMode: settings.printMode,
  };

  const previewReceipt = async () => {
    if (window.restaurantPrinter?.receiptText) {
      const text = await window.restaurantPrinter.receiptText(testPayload);
      setReceiptPreview(text.replace(/\x1b[@a]?\x01?/g, "").replace(/\x1dV\x00/g, ""));
      return;
    }
    setReceiptPreview("GOCMEN KIZININ MUTFAGI\nTEST ADISYON\n1x Test Ürünü        10 TL\nToplam               15 TL");
  };

  const testPrint = async () => {
    try {
      if (!window.restaurantPrinter?.printReceipt) {
        onNotify("Test yazdırma sadece masaüstü Electron uygulamasında çalışır.");
        return;
      }
      const result = await window.restaurantPrinter.printReceipt({ ...testPayload, silent: true });
      onNotify(`Test adisyon yazıcıya gönderildi: ${result?.printerName || "varsayılan yazıcı"}`);
    } catch (error) {
      onNotify(`Test yazdırma başarısız: ${error.message}`);
    }
  };

  const testPrintWithDialog = async () => {
    try {
      if (!window.restaurantPrinter?.printReceipt) {
        onNotify("Yazdırma penceresi sadece masaüstü Electron uygulamasında çalışır.");
        return;
      }
      await window.restaurantPrinter.printReceipt({ ...testPayload, silent: false });
      onNotify("Yazdırma penceresi açıldı / işlem yazıcıya gönderildi");
    } catch (error) {
      onNotify(`Pencereli test başarısız: ${error.message}`);
    }
  };

  const saveLockSettings = () => {
    const cleanPin = String(lockPin || "").trim();
    const cleanPinConfirm = String(lockPinConfirm || "").trim();
    if (lockEnabled) {
      if (!/^\d{4,8}$/.test(cleanPin)) {
        setLockError("PIN 4-8 haneli ve sadece rakamlardan oluşmalı.");
        return;
      }
      if (cleanPin !== cleanPinConfirm) {
        setLockError("PIN tekrar alanı eşleşmiyor.");
        return;
      }
    }
    setLockError("");
    onUpdateSettings(
      {
        lockEnabled,
        lockPin: lockEnabled ? cleanPin : "",
        lockTimeoutMinutes: Number(lockTimeoutMinutes) || 30,
      },
      { silent: true },
    );
    if (lockEnabled) {
      onNotify(`Ayarlar kaydedildi. ${Number(lockTimeoutMinutes)} dakika aktif olunmazsa oturum kapatılacaktır.`);
      return;
    }
    onNotify("Ayarlar kaydedildi.");
  };

  return (
    <div className="settings-layout">
      <Card className="settings-menu">
        <Tabs items={tabs} value={tab} onChange={setTab} />
      </Card>
      <Card className="settings-panel">
        {tab === "restaurant" ? (
          <>
            <h2><Building2 size={20} /> Restoran Bilgileri</h2>
            <div className="form-grid">
              <Input label="Restoran adı" defaultValue="Göçmen Kızının Mutfağı" />
              <Input label="Telefon" defaultValue="0 533 744 74 77" />
              <Input className="span-2" label="Adres" defaultValue="Salon Sokak No: 12" />
            </div>
          </>
        ) : null}
        {tab === "tables" ? (
          <>
            <h2><MonitorCog size={20} /> Masa Düzeni</h2>
            <div className="form-grid">
              <Input label="Masa adı" placeholder="Masa 13" value={tableForm.name} onChange={(event) => setTableForm({ ...tableForm, name: event.target.value })} />
              <Select label="Bölge" value={tableForm.area} onChange={(event) => setTableForm({ ...tableForm, area: event.target.value })}><option>Salon</option><option>Bahçe</option><option>Teras</option></Select>
              <Input label="Kapasite" type="number" value={tableForm.capacity} onChange={(event) => setTableForm({ ...tableForm, capacity: event.target.value })} />
              <label className="toggle-row"><input type="checkbox" defaultChecked /> Aktif masa</label>
            </div>
            <Button variant="primary" disabled={!tableForm.name} onClick={() => { onAddTable(tableForm); setTableForm({ name: "", area: "Salon", capacity: 4 }); }}>Masayı Kaydet</Button>
            <div className="settings-table-list">
              {tables.map((table) => (
                <div key={table.id}>
                  <div>
                    <strong>{table.name}</strong>
                    <span>{table.area} · {table.capacity || 4} kişi · {table.status}</span>
                  </div>
                  <Button variant="danger" size="small" onClick={() => onDeleteTable(table.id)}><Trash2 size={15} /> Sil</Button>
                </div>
              ))}
            </div>
          </>
        ) : null}
        {tab === "printers" ? (
          <>
            <h2><Printer size={20} /> Yazıcı Ayarları</h2>
            <div className="form-grid">
              <Select label="Adisyon yazıcısı" value={settings.printerName} onChange={(event) => onUpdateSettings({ printerName: event.target.value })}>
                <option value="">Varsayılan yazıcı</option>
                {printers.map((printer) => (
                  <option key={printer.name} value={printer.name}>
                    {printer.name}{printer.isDefault ? " (varsayılan)" : ""}
                  </option>
                ))}
              </Select>
              <Input
                label="ESC/POS raw yazıcı yolu"
                value={settings.rawPrinterPath || ""}
                placeholder="Örn: \\\\localhost\\Adisyon"
                onChange={(event) => onUpdateSettings({ rawPrinterPath: event.target.value })}
              />
              <Select label="Sessiz yazdırma modu" value={settings.printMode || "auto"} onChange={(event) => onUpdateSettings({ printMode: event.target.value })}>
                <option value="auto">Otomatik (POS 58 için ESC/POS)</option>
                <option value="escpos">ESC/POS direkt</option>
                <option value="driver">Windows sürücüsü</option>
              </Select>
              <p className="field-help span-2">
                Bu alan zorunlu değildir. Sadece ESC/POS yazıcı Windows'ta paylaşıma açılıp raw komutla kullanılacaksa doldurun.
                Normal kullanımda boş bırakıp yukarıdan yazıcı seçmeniz yeterlidir.
              </p>
              <Select label="Mutfak yazıcısı"><option>Mutfak Termal</option><option>Pasif</option></Select>
              <label className="toggle-row"><input type="checkbox" defaultChecked /> Otomatik yazdır</label>
            </div>
            <div className="quick-actions printer-actions">
              <Button variant="outline" onClick={loadPrinters}>Yazıcıları Kontrol Et</Button>
              <Button variant="secondary" onClick={previewReceipt}>Test Önizleme</Button>
              <Button variant="primary" onClick={testPrint}>Sessiz Test Çıktısı</Button>
              <Button variant="outline" onClick={testPrintWithDialog}>Yazdırma Penceresiyle Dene</Button>
            </div>
            <div className="printer-status">
              <strong>Algılanan yazıcılar</strong>
              {printers.length ? printers.map((printer) => (
                <span key={printer.name}>{printer.name}{printer.isDefault ? " · varsayılan" : ""}</span>
              )) : <span>Yazıcı yok veya henüz algılanmadı.</span>}
            </div>
          </>
        ) : null}
        {tab === "users" ? (
          <>
            <h2><UserCog size={20} /> Kullanıcılar</h2>
            <div className="rank-list">
              <div><strong>Kasiyer</strong><em>Tam yetki</em></div>
              <div><strong>Garson</strong><em>Sipariş yetkisi</em></div>
              <div><strong>Yönetici</strong><em>Rapor ve ayarlar</em></div>
            </div>
            <h3>Oturum Kilidi</h3>
            <div className="form-grid">
              <label className="toggle-row span-2">
                <input type="checkbox" checked={lockEnabled} onChange={(event) => setLockEnabled(event.target.checked)} />
                PIN ile otomatik kilit ekranını aktif et
              </label>
              <Input
                label="PIN oluştur"
                type="password"
                inputMode="numeric"
                value={lockPin}
                onChange={(event) => setLockPin(event.target.value.replace(/\D/g, ""))}
                placeholder="4-8 hane"
                disabled={!lockEnabled}
              />
              <Input
                label="PIN tekrar"
                type="password"
                inputMode="numeric"
                value={lockPinConfirm}
                onChange={(event) => setLockPinConfirm(event.target.value.replace(/\D/g, ""))}
                placeholder="4-8 hane"
                disabled={!lockEnabled}
              />
              <Select label="Zaman aşımı süresi" value={String(lockTimeoutMinutes)} onChange={(event) => setLockTimeoutMinutes(Number(event.target.value))} disabled={!lockEnabled}>
                <option value="1">1 dakika</option>
                <option value="15">15 dakika</option>
                <option value="20">20 dakika</option>
                <option value="30">30 dakika</option>
                <option value="60">60 dakika</option>
                <option value="120">120 dakika</option>
              </Select>
              <p className="field-help span-2">
                PIN local JSON dosyasına düz metin olarak kaydedilir. Şifre unutulursa bu dosyadan geri bulunabilir.
              </p>
            </div>
            {lockError ? <p className="payment-error">{lockError}</p> : null}
            <Button variant="primary" onClick={saveLockSettings}>Kilit Ayarını Kaydet</Button>
          </>
        ) : null}
        {tab === "tax" ? (
          <>
            <h2>Vergi Ücreti</h2>
            <div className="form-grid">
              <Input label="KDV oranı (%)" type="number" defaultValue="10" />
            </div>
          </>
        ) : null}
        {tab === "theme" ? (
          <>
            <h2>Tema</h2>
            <div className="swatches">
              <button className="active" style={{ background: "#2563EB" }} />
              <button style={{ background: "#16A34A" }} />
              <button style={{ background: "#F59E0B" }} />
            </div>
          </>
        ) : null}
        {tab === "data" ? (
          <>
            <h2>Satış Datası</h2>
            <p className="muted-text">Bu işlem sadece satış geçmişini, açık adisyonları, catering/perakende satış kayıtlarını ve bildirimleri temizler. Ürünler, kategoriler, masa düzeni ve yazıcı ayarları korunur.</p>
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm("Sadece satış datası sıfırlansın mı? Ürünler ve ayarlar korunacak.")) {
                  onResetSalesData?.();
                }
              }}
            >
              Satış Datasını Sıfırla
            </Button>
          </>
        ) : null}
      </Card>
      <Modal
        open={Boolean(receiptPreview)}
        title="Test Adisyon Önizleme"
        onClose={() => setReceiptPreview("")}
        footer={<Button variant="primary" onClick={() => setReceiptPreview("")}>Kapat</Button>}
      >
        <pre className="receipt-preview">{receiptPreview}</pre>
      </Modal>
    </div>
  );
}

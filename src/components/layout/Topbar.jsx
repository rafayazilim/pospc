import { Bell, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

const titles = {
  home: "Ana Ekran",
  tables: "Masalar",
  order: "Sipariş Oluştur",
  catering: "Catering Sipariş",
  retail: "Perakende Satış",
  bills: "Açık Adisyonlar",
  payments: "Ödemeler",
  stats: "İstatistikler",
  endofday: "Gün Sonu Özeti",
  products: "Ürünler / Menü",
  settings: "Ayarlar",
};

export default function Topbar({ currentPage, searchQuery = "", onSearchChange, searchResults = [], onSearchSelect }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [updaterStatus, setUpdaterStatus] = useState({ state: "idle" });
  const [updaterBusy, setUpdaterBusy] = useState(false);
  const date = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const showDropdown = searchFocused && searchQuery.trim().length > 0;
  const groupedResults = {
    Adisyonlar: searchResults.filter((item) => item.type === "Adisyon"),
    "Menü": searchResults.filter((item) => item.type === "Ürün"),
    Masa: searchResults.filter((item) => item.type === "Masa"),
  };
  const sectionOrder = ["Adisyonlar", "Menü", "Masa"];

  useEffect(() => {
    const updater = window.restaurantUpdater;
    if (!updater) return undefined;

    let disposed = false;
    updater.getState?.()
      .then((status) => {
        if (!disposed && status) setUpdaterStatus(status);
      })
      .catch(() => {});
    const unsubscribe = updater.onStatus?.((status) => {
      if (status) setUpdaterStatus(status);
    });

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);

  const installDownloadedUpdate = async (status) => {
    const shouldInstall = window.confirm(
      `${status?.version ? `Sürüm ${status.version} indirildi. ` : ""}Güncelleme şimdi yüklenip uygulama yeniden başlatılsın mı?`,
    );
    if (!shouldInstall) return;
    await window.restaurantUpdater.quitAndInstall();
  };

  const handleUpdaterClick = async () => {
    const updater = window.restaurantUpdater;
    if (!updater || updaterBusy) return;

    setUpdaterBusy(true);
    try {
      const latestStatus = (await updater.getState?.()) || updaterStatus;
      if (latestStatus?.state === "downloading" || latestStatus?.state === "checking") {
        window.alert(latestStatus.message || "Güncelleme işlemi devam ediyor.");
        return;
      }

      if (latestStatus?.state === "downloaded") {
        await installDownloadedUpdate(latestStatus);
        return;
      }

      const result = await updater.check();
      if (result?.ok === false) {
        window.alert(result.error || "Güncelleme kontrolü başarısız.");
        return;
      }

      const checkedStatus = (await updater.getState?.()) || updaterStatus;
      if (checkedStatus?.state === "downloaded") {
        await installDownloadedUpdate(checkedStatus);
        return;
      }

      if (checkedStatus?.state !== "available") {
        window.alert(checkedStatus?.message || "Uygulama güncel.");
        return;
      }

      const shouldInstall = window.confirm(
        `${checkedStatus.version ? `Yeni sürüm bulundu: ${checkedStatus.version}. ` : ""}Güncelleme yüklensin mi?`,
      );
      if (!shouldInstall) return;

      const downloadResult = await updater.download();
      if (downloadResult?.ok === false) {
        window.alert(downloadResult.error || "Güncelleme indirilemedi.");
        return;
      }

      await updater.quitAndInstall();
    } catch (error) {
      window.alert(error?.message || "Güncelleme işlemi tamamlanamadı.");
    } finally {
      setUpdaterBusy(false);
    }
  };

  return (
    <header className="topbar">
      <div>
        <h1>{titles[currentPage]}</h1>
        <p>Göçmen Kızının Mutfağı servis ve kasa paneli</p>
      </div>
      <div className="top-search-wrap" style={{ position: "relative", flex: 1, maxWidth: 460 }}>
        <label className="top-search">
          <Search size={18} />
          <input
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Masa, ürün veya adisyon ara"
          />
          {searchQuery ? (
            <button
              type="button"
              className="search-clear-btn"
              aria-label="Aramayı temizle"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSearchChange?.("");
                setSearchFocused(false);
              }}
              style={{
                border: "1px solid rgba(0,155,131,0.35)",
                background: "rgba(0,155,131,0.08)",
                color: "var(--primary, #009b83)",
                borderRadius: 999,
                width: 26,
                height: 26,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          ) : null}
        </label>
        {showDropdown ? (
          <div
            className="search-dropdown"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              maxHeight: 360,
              overflowY: "auto",
              background: "var(--surface, #fff)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 12,
              boxShadow: "0 12px 26px rgba(0,0,0,0.12)",
              zIndex: 40,
              padding: 8,
            }}
          >
            {searchResults.length === 0 ? (
              <div style={{ padding: "10px 12px", fontSize: 13, opacity: 0.7 }}>Sonuç bulunamadı.</div>
            ) : (
              sectionOrder.map((section) => {
                const items = groupedResults[section] || [];
                if (!items.length) return null;
                return (
                  <div key={section} style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--primary, #009b83)",
                        background: "rgba(0,155,131,0.08)",
                        borderRadius: 8,
                        marginBottom: 4,
                      }}
                    >
                      {section}
                    </div>
                    {items.map((result) => (
                      <div
                        key={result.id}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          onSearchSelect?.(result);
                          setSearchFocused(false);
                        }}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          display: "grid",
                          gap: 4,
                          border: "1px solid rgba(0,0,0,0.04)",
                          marginBottom: 6,
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <strong style={{ fontSize: 13 }}>{result.title}</strong>
                        </div>
                        {result.subtitle ? <span style={{ fontSize: 12, opacity: 0.8 }}>{result.subtitle}</span> : null}
                        {result.meta ? <em style={{ fontSize: 12, opacity: 0.75 }}>{result.meta}</em> : null}
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>
      <div className="top-actions">
        <span>{date}</span>
        <button
          className="icon-button"
          aria-label="Bildirimler"
          title={updaterStatus?.message || "Bildirimler"}
          disabled={updaterBusy}
          onClick={handleUpdaterClick}
        >
          <Bell size={20} />
        </button>
        <div className="profile">
          <strong>Kasiyer</strong>
          <span>Kasa 1</span>
        </div>
      </div>
    </header>
  );
}

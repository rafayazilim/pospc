import { useEffect, useMemo, useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import PaymentModal from "./components/restaurant/PaymentModal";
import TableDetailDrawer from "./components/restaurant/TableDetailDrawer";
import BillDetailModal from "./components/restaurant/BillDetailModal";
import LockScreen from "./components/LockScreen";
import Modal from "./components/ui/Modal";
import Button from "./components/ui/Button";
import useMockRestaurantState from "./hooks/useMockRestaurantState";
import HomePage from "./pages/HomePage";
import TablesPage from "./pages/TablesPage";
import CreateOrderPage from "./pages/CreateOrderPage";
import OpenBillsPage from "./pages/OpenBillsPage";
import PaymentsPage from "./pages/PaymentsPage";
import StatisticsPage from "./pages/StatisticsPage";
import EndOfDayPage from "./pages/EndOfDayPage";
import ProductsPage from "./pages/ProductsPage";
import SettingsPage from "./pages/SettingsPage";
import CateringOrderPage from "./pages/CateringOrderPage";
import RetailSalesPage from "./pages/RetailSalesPage";
import QuickCashPage from "./pages/QuickCashPage";
import { formatCurrency } from "./utils/format";

export default function App() {
  const restaurant = useMockRestaurantState();
  const [page, setPage] = useState("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [orderTableId, setOrderTableId] = useState(null);
  const [paymentTable, setPaymentTable] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);  const [moveSourceTable, setMoveSourceTable] = useState(null);
  const [moveTargetTableId, setMoveTargetTableId] = useState("");
  const [locked, setLocked] = useState(false);
  const [printStatus, setPrintStatus] = useState(null);
  const [pendingPrint, setPendingPrint] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const lockEnabled = Boolean(restaurant.settings?.lockEnabled && restaurant.settings?.lockPin);
  const lockTimeoutMinutes = [1, 15, 20, 30, 60, 120].includes(Number(restaurant.settings?.lockTimeoutMinutes))
    ? Number(restaurant.settings?.lockTimeoutMinutes)
    : 30;

  const globalSearchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const tableResults = (restaurant.tables || [])
      .filter((table) => {
        const tableTotal = (table.orders || []).reduce((sum, order) => sum + Number(order.unitPrice || 0) * Number(order.quantity || 0), 0);
        return [
          table.id,
          table.name,
          table.area,
          table.status,
          tableTotal,
          ...(table.orders || []).map((order) => order.productName),
        ].join(" ").toLowerCase().includes(query);
      })
      .slice(0, 6)
      .map((table) => {
        const tableTotal = (table.orders || []).reduce((sum, order) => sum + Number(order.unitPrice || 0) * Number(order.quantity || 0), 0);
        return {
          id: `table-${table.id}`,
          type: "Masa",
          entityId: table.id,
          title: `${table.name}`,
          subtitle: `${table.area || "-"} · ${table.status}`,
          meta: `Toplam: ${formatCurrency(tableTotal)}`,
        };
      });

    const productResults = (restaurant.products || [])
      .filter((product) => [
        product.id,
        product.name,
        product.category,
        product.description,
        product.price,
      ].join(" ").toLowerCase().includes(query))
      .slice(0, 8)
      .map((product) => ({
        id: `product-${product.id}`,
        type: "Ürün",
        entityId: product.id,
        title: product.name,
        subtitle: product.category || "Kategorisiz",
        meta: formatCurrency(product.price),
      }));

    const billResults = (restaurant.openBills || [])
      .filter((bill) => [
        bill.id,
        bill.table?.name,
        bill.table?.openedAt,
        bill.table?.status,
        bill.total,
        ...(bill.table?.orders || []).map((order) => order.productName),
      ].join(" ").toLowerCase().includes(query))
      .slice(0, 8)
      .map((bill) => ({
        id: `bill-${bill.id}`,
        type: "Adisyon",
        entityId: bill.id,
        title: `${bill.id} · ${bill.table?.name || "-"}`,
        subtitle: `${bill.table?.openedAt || "-"} · ${bill.itemCount || 0} ürün`,
        meta: formatCurrency(bill.total),
      }));

    return [...tableResults, ...productResults, ...billResults].slice(0, 20);
  }, [searchQuery, restaurant.tables, restaurant.products, restaurant.openBills]);

  const handleSearchSelect = (result) => {
    if (!result) return;
    setSearchQuery("");
    if (result.type === "Masa") {
      const table = restaurant.tables.find((item) => item.id === result.entityId);
      if (table) {
        setSelectedTable(table);
      }
      setPage("tables");
      return;
    }
    if (result.type === "Adisyon") {
      const bill = restaurant.openBills.find((item) => item.id === result.entityId);
      if (bill) setSelectedBill(bill);
      setPage("bills");
      return;
    }
    if (result.type === "Ürün") {
      setPage("products");
    }
  };

  useEffect(() => {
    if (!lockEnabled) {
      setLocked(false);
      return undefined;
    }
    let timer;
    const reset = () => {
      window.clearTimeout(timer);
      if (!locked) timer = window.setTimeout(() => setLocked(true), lockTimeoutMinutes * 60 * 1000);
    };
    ["mousemove", "mousedown", "keydown", "touchstart", "scroll"].forEach((eventName) => window.addEventListener(eventName, reset));
    reset();
    return () => {
      window.clearTimeout(timer);
      ["mousemove", "mousedown", "keydown", "touchstart", "scroll"].forEach((eventName) => window.removeEventListener(eventName, reset));
    };
  }, [locked, lockEnabled, lockTimeoutMinutes]);

  const currentSelectedTable = selectedTable
    ? restaurant.tables.find((table) => table.id === selectedTable.id) || selectedTable
    : null;

  const openOrderForTable = (tableId) => {
    setOrderTableId(tableId);
    setSelectedTable(null);
    setPage("order");
  };

  const completePayment = (tableId, payment) => {
    restaurant.recordPayment(tableId, payment);
  };

  const printReceipt = (table, settings = restaurant.settings, selectedItems = null) => {
    const items = selectedItems || (table.orders || []).map((order) => ({
      orderId: order.id,
      productName: order.productName,
      unitPrice: order.unitPrice,
      quantity: order.quantity - (order.paidQuantity || 0),
    })).filter((item) => item.quantity > 0);
    setPendingPrint({ table, settings, selectedItems: items });
  };

  const executePrintReceipt = async (silent) => {
    const payload = pendingPrint;
    if (!payload) return;
    const { table, settings, selectedItems: items } = payload;
    setPendingPrint(null);
    setPrintStatus({
      title: "Adisyon Yazdırılıyor",
      body: `${table.name} adisyonu yazıcıya gönderiliyor.`,
      receiptText: "",
    });
    try {
      if (window.restaurantPrinter?.printReceipt) {
        const result = await window.restaurantPrinter.printReceipt({
          table,
          settings,
          selectedItems: items,
          printerName: settings.printerName,
          rawPrinterPath: settings.rawPrinterPath,
          printMode: settings.printMode,
          silent,
        });
        setPrintStatus({
          title: "Adisyon Yazdırıldı",
          body: settings.rawPrinterPath
            ? `Adisyon ESC/POS raw yoluna gönderildi: ${settings.rawPrinterPath}`
            : "Adisyon seçili/varsayılan yazıcıya gönderildi.",
          receiptText: "",
        });
        restaurant.notify("Adisyon yazıcıya gönderildi");
      } else {
        const fallbackText = [
          "GOCMEN KIZININ MUTFAGI",
          "ADISYON",
          `Masa: ${table.name}`,
          ...items.map((item) => `${item.quantity}x ${item.productName} - ${item.quantity * item.unitPrice} TL`),
        ].join("\n");
        setPrintStatus({
          title: "Yazıcı Bağlantısı Yok",
          body: "Uygulama Electron dışında çalışıyor. Aşağıdaki test adisyonu önizleme amaçlı üretildi.",
          receiptText: fallbackText,
        });
        restaurant.notify("Adisyon önizleme olarak hazırlandı");
      }
    } catch (error) {
      setPrintStatus({
        title: "Yazdırma Başarısız",
        body: error.message || "Yazdırma sırasında bilinmeyen bir hata oluştu.",
        receiptText: "",
      });
      restaurant.notify(`Yazdırma başarısız: ${error.message}`);
    }
  };

  const pageContent = {
    home: (
      <HomePage
        notifications={restaurant.notifications}
        tables={restaurant.tables}
        products={restaurant.products}
        openBills={restaurant.openBills}
        salesRecords={restaurant.salesRecords}
        onNavigate={setPage}
      />
    ),
    tables: <TablesPage tables={restaurant.tables} searchQuery="" onSelectTable={setSelectedTable} />,
    order: (
      <CreateOrderPage
        tables={restaurant.tables}
        products={restaurant.products}
        categories={restaurant.categories}
        searchQuery=""
        initialTableId={orderTableId}
        onSubmitOrder={restaurant.addProductToTable}
      />
    ),
    bills: (
      <OpenBillsPage
        bills={restaurant.openBills}
        onDetail={setSelectedBill}
        onPayment={setPaymentTable}
        onGoTable={(table) => {
          setSelectedTable(table);
          setPage("tables");
        }}
        onPrintReceipt={printReceipt}
        searchQuery=""
      />
    ),
    payments: (
      <PaymentsPage
        bills={restaurant.openBills}
        salesRecords={restaurant.salesRecords}
        searchQuery=""
        onPayment={setPaymentTable}
      />
    ),
    stats: (
      <StatisticsPage
        bills={restaurant.openBills}
        tables={restaurant.tables}
        cateringOrders={restaurant.cateringOrders}
        salesRecords={restaurant.salesRecords}
        products={restaurant.products}
        onResetStatistics={restaurant.resetSalesData}
      />
    ),
    endofday: (
      <EndOfDayPage
        openBills={restaurant.openBills}
        salesRecords={restaurant.salesRecords}
        cateringOrders={restaurant.cateringOrders}
        onCloseDay={() => {
          if (restaurant.openBills.length) {
            restaurant.notify("Açık adisyon varken gün sonu kapatılamaz.");
            return;
          }
          restaurant.resetSalesData();
          restaurant.notify("Gun sonu kapatildi. Gunluk istatistikler sifirlandi.");
        }}
        onNotify={restaurant.notify}
      />
    ),
    products: (
      <ProductsPage
        products={restaurant.products}
        categories={restaurant.categories}
        onAddProduct={restaurant.addProduct}
        onUpdateProduct={restaurant.updateProduct}
        onDeleteProduct={restaurant.deleteProduct}
        onAddCategory={restaurant.addCategory}
        onUpdateCategory={restaurant.updateCategory}
        onDeleteCategory={restaurant.deleteCategory}
        searchQuery=""
      />
    ),
    catering: (
      <CateringOrderPage
        products={restaurant.products}
        categories={restaurant.categories}
        orders={restaurant.cateringOrders}
        onCreateOrder={restaurant.addCateringOrder}
        onMarkDelivered={restaurant.markCateringDelivered}
        searchQuery=""
      />
    ),
    retail: (
      <RetailSalesPage
        products={restaurant.products}
        categories={restaurant.categories}
        salesRecords={restaurant.salesRecords}
        onCreateSale={restaurant.addRetailSale}
        searchQuery=""
      />
    ),
    quickcash: (
      <QuickCashPage
        openBills={restaurant.openBills}
        products={restaurant.products}
        onAddProductToBill={restaurant.addProductToTable}
        onDeleteOrder={restaurant.deleteOrderFromTable}
        onUpdateOrder={restaurant.updateOrderInTable}
        onPayment={setPaymentTable}
        onPrintReceipt={printReceipt}
      />
    ),
    settings: (
      <SettingsPage
        settings={restaurant.settings}
        tables={restaurant.tables}
        onAddTable={restaurant.addTable}
        onDeleteTable={restaurant.deleteTable}
        onUpdateSettings={restaurant.updateSettings}
        onNotify={restaurant.notify}
        onResetSalesData={restaurant.resetSalesData}
      />
    ),
  };

  return (
    <AppLayout
      currentPage={page}
      collapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
      onNavigate={setPage}
      toast={restaurant.toast}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchResults={globalSearchResults}
      onSearchSelect={handleSearchSelect}
    >
      {pageContent[page]}
      <TableDetailDrawer
        table={currentSelectedTable}
        open={Boolean(currentSelectedTable)}
        onClose={() => setSelectedTable(null)}
        onAddProduct={openOrderForTable}
        onStartTable={restaurant.startTable}
        onReserve={restaurant.reserveTable}
        onPayment={setPaymentTable}
        onCloseTable={restaurant.closeTable}
        onMoveTable={(table) => {
          setMoveSourceTable(table);
          setMoveTargetTableId("");
        }}
        onPrintReceipt={(table) => printReceipt(table)}
        onDeleteOrder={restaurant.deleteOrderFromTable}
        serviceFeeRate={restaurant.settings.serviceFeeRate}
        onNotify={restaurant.notify}
      />
      <PaymentModal
        table={paymentTable}
        settings={restaurant.settings}
        open={Boolean(paymentTable)}
        onClose={() => setPaymentTable(null)}
        onComplete={completePayment}
        onPrintReceipt={printReceipt}
      />
      <BillDetailModal
        bill={selectedBill}
        open={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        onPayment={(table) => {
          setSelectedBill(null);
          setPaymentTable(table);
        }}
        onPrintReceipt={printReceipt}
      />
      <Modal
        open={Boolean(moveSourceTable)}
        title="Masayı Taşı"
        onClose={() => setMoveSourceTable(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMoveSourceTable(null)}>Vazgeç</Button>
            <Button
              variant="primary"
              disabled={!moveTargetTableId}
              onClick={() => {
                restaurant.moveTable(moveSourceTable.id, moveTargetTableId);
                setSelectedTable(null);
                setMoveSourceTable(null);
              }}
            >
              Taşı
            </Button>
          </>
        }
      >
        <label className="field">
          <span>Hedef masa</span>
          <select value={moveTargetTableId} onChange={(event) => setMoveTargetTableId(event.target.value)}>
            <option value="">Masa seç</option>
            {restaurant.tables
              .filter((table) => table.id !== moveSourceTable?.id)
              .map((table) => (
                <option key={table.id} value={table.id}>{table.name} - {table.status}</option>
              ))}
          </select>
        </label>
      </Modal>
      <Modal
        open={Boolean(pendingPrint)}
        title="Adisyon Yazdır"
        onClose={() => setPendingPrint(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingPrint(null)}>Vazgeç</Button>
            <Button variant="outline" onClick={() => executePrintReceipt(false)}>Windows Penceresi ile Yazdır</Button>
            <Button variant="primary" onClick={() => executePrintReceipt(true)}>Direkt Yazdır</Button>
          </>
        }
      >
        <p>{pendingPrint?.table?.name || "Seçili masa"} adisyonu için yazdırma yöntemini seçin.</p>
        <p className="muted-text">Direkt yazdırma POS 58 için ESC/POS yolunu kullanır. Sorun yaşanırsa Windows penceresi ile yazdırma seçeneği yedek olarak durur.</p>
      </Modal>
      <Modal
        open={Boolean(printStatus)}
        title={printStatus?.title || "Yazdırma Durumu"}
        onClose={() => setPrintStatus(null)}
        footer={<Button variant="primary" onClick={() => setPrintStatus(null)}>Kapat</Button>}
      >
        <p>{printStatus?.body}</p>
        {printStatus?.receiptText ? <pre className="receipt-preview">{printStatus.receiptText}</pre> : null}
      </Modal>
      <LockScreen locked={locked} pinCode={restaurant.settings?.lockPin} onUnlock={() => setLocked(false)} />
    </AppLayout>
  );
}



import { useEffect, useMemo, useState } from "react";
import { initialTables } from "../data/mockTables";
import { categories as initialCategories, products as initialProducts } from "../data/mockProducts";
import { nowTime, tableTotal } from "../utils/format";

const nextId = () => Math.floor(Date.now() + Math.random() * 1000);
const storageKey = "gocmen-pos-state-v1";
const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultSettings = {
  serviceFeeRate: 10,
  printerName: "",
  rawPrinterPath: "",
  printMode: "auto",
  lockEnabled: false,
  lockPin: "",
  lockTimeoutMinutes: 30,
};

const defaultNotifications = [
  { id: 1, title: "Servis açık masa var", source: "Masa", time: "16:27", page: "tables", color: "#009b83" },
  { id: 2, title: "Ödeme bekleyen adisyon var", source: "Kasa", time: "15:32", page: "payments", color: "#d2b854" },
  { id: 3, title: "Catering sipariş kontrolü", source: "Catering", time: "15:14", page: "catering", color: "#0f1717" },
];

const normalizeProduct = (product) => {
  const productType = product.productType || (product.isCatering ? "catering" : product.isRetail ? "retail" : "restaurant");
  return {
    ...product,
    productType,
    isCatering: productType === "catering",
    isRetail: productType === "retail",
  };
};

const loadBrowserState = () => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveBrowserState = (state) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable in restricted contexts.
  }
};

export default function useMockRestaurantState() {
  const saved = typeof window !== "undefined" ? loadBrowserState() : null;
  const [tables, setTables] = useState(saved?.tables || initialTables);
  const [products, setProducts] = useState((saved?.products || initialProducts).map(normalizeProduct));
  const [categories, setCategories] = useState(saved?.categories || initialCategories);
  const [cateringOrders, setCateringOrders] = useState(saved?.cateringOrders || []);
  const [salesRecords, setSalesRecords] = useState(saved?.salesRecords || []);
  const [notifications, setNotifications] = useState(saved?.notifications || defaultNotifications);
  const [settings, setSettings] = useState({ ...defaultSettings, ...(saved?.settings || {}) });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    window.restaurantStore?.load?.().then((data) => {
      if (cancelled || !data) return;
      setTables(data.tables || initialTables);
      setProducts((data.products || initialProducts).map(normalizeProduct));
      setCategories(data.categories || initialCategories);
      setCateringOrders(data.cateringOrders || []);
      setSalesRecords(data.salesRecords || []);
      setNotifications(data.notifications || defaultNotifications);
      setSettings({ ...defaultSettings, ...(data.settings || {}) });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const state = { tables, products, categories, cateringOrders, salesRecords, notifications, settings };
    saveBrowserState(state);
    window.restaurantStore?.save?.(state);
  }, [tables, products, categories, cateringOrders, salesRecords, notifications, settings]);

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.__rafaToastTimer);
    window.__rafaToastTimer = window.setTimeout(() => setToast(null), 2600);
  };

  const openBills = useMemo(
    () =>
      tables
        .filter((table) => ["occupied", "service", "pending", "payment"].includes(table.status))
        .map((table, index) => ({
          id: `AD-${20260429 + index}`,
          table,
          total: tableTotal(table),
          itemCount: table.orders.reduce((sum, order) => sum + order.quantity - (order.paidQuantity || 0), 0),
        })),
    [tables],
  );

  const addProductToTable = (tableId, product, quantity = 1, note = "") => {
    setTables((current) =>
      current.map((table) => {
        if (table.id !== Number(tableId)) return table;
        const orders = [
          ...table.orders,
          {
            id: nextId(),
            productName: product.name,
            quantity,
            paidQuantity: 0,
            unitPrice: product.price,
            status: "new",
            note,
          },
        ];
        return {
          ...table,
          status: table.status === "payment" ? "payment" : "service",
          guests: table.guests || 2,
          openedAt: table.openedAt || nowTime(),
          orders,
        };
      }),
    );
    notify("Sipariş masaya eklendi");
  };

  const startTable = (tableId, guests = 2) => {
    setTables((current) =>
      current.map((table) =>
        table.id === Number(tableId)
          ? { ...table, status: "occupied", guests: Number(guests), openedAt: table.openedAt || nowTime() }
          : table,
      ),
    );
    notify("Masa açıldı");
  };

  const reserveTable = (tableId) => {
    setTables((current) =>
      current.map((table) =>
        table.id === Number(tableId) ? { ...table, status: "reserved", guests: table.guests || 2, openedAt: "20:00" } : table,
      ),
    );
    notify("Masa rezerve edildi");
  };

  const markPaymentWaiting = (tableId) => {
    setTables((current) => current.map((table) => (table.id === Number(tableId) ? { ...table, status: "payment" } : table)));
    notify("Masa ödeme bekliyor olarak işaretlendi");
  };

  const closeTable = (tableId) => {
    setTables((current) =>
      current.map((table) =>
        table.id === Number(tableId)
          ? { ...table, status: "empty", guests: 0, openedAt: null, orders: [], payments: [] }
          : table,
      ),
    );
    notify("Masa kapatıldı");
  };

  const deleteOrderFromTable = (tableId, orderId) => {
    setTables((current) =>
      current.map((table) => {
        if (table.id !== Number(tableId)) return table;
        const orders = table.orders.filter((order) => order.id !== Number(orderId));
        return orders.length
          ? { ...table, orders }
          : { ...table, status: "empty", guests: 0, openedAt: null, orders: [], payments: [] };
      }),
    );
    notify("Ürün masadan silindi");
  };

  const addProduct = (product) => {
    setProducts((current) => [{ ...normalizeProduct(product), id: nextId(), price: Number(product.price), isActive: true }, ...current]);
    notify("Ürün kaydedildi");
  };

  const updateProduct = (product) => {
    setProducts((current) =>
      current.map((entry) => (entry.id === product.id ? normalizeProduct({ ...entry, ...product, price: Number(product.price) }) : entry)),
    );
    notify("Ürün güncellendi");
  };

  const deleteProduct = (productId) => {
    setProducts((current) => current.filter((product) => product.id !== Number(productId)));
    notify("Ürün silindi");
  };

  const addCategory = (name) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    setCategories((current) => (current.includes(cleanName) ? current : [...current, cleanName]));
    notify("Kategori eklendi");
  };

  const updateCategory = (oldName, newName) => {
    const cleanName = newName.trim();
    if (!oldName || !cleanName) return;
    setCategories((current) => current.map((category) => (category === oldName ? cleanName : category)));
    setProducts((current) => current.map((product) => (product.category === oldName ? { ...product, category: cleanName } : product)));
    notify("Kategori güncellendi");
  };

  const deleteCategory = (name) => {
    setCategories((current) => current.filter((category) => category !== name));
    setProducts((current) => current.map((product) => (product.category === name ? { ...product, category: "Kategorisiz" } : product)));
    notify("Kategori silindi");
  };

  const addTable = (table) => {
    setTables((current) => [
      ...current,
      { id: nextId(), name: table.name, area: table.area || "Salon", status: "empty", guests: 0, openedAt: null, orders: [], capacity: Number(table.capacity || 4) },
    ]);
    notify("Masa eklendi");
  };

  const deleteTable = (tableId) => {
    setTables((current) => current.filter((table) => table.id !== Number(tableId)));
    notify("Masa silindi");
  };

  const addCateringOrder = (order) => {
    const id = nextId();
    setCateringOrders((current) => [{ ...order, id, createdAt: nowTime(), createdAtDate: todayKey(), status: "preparing" }, ...current]);
    setNotifications((current) => [
      { id, title: "Yeni catering siparişi oluşturuldu", source: "Catering", time: nowTime(), page: "catering", color: "#009b83" },
      ...current,
    ].slice(0, 8));
    notify("Catering satışı oluşturuldu");
  };

  const updateSettings = (patch, options = {}) => {
    setSettings((current) => ({ ...current, ...patch }));
    if (!options.silent) notify("Ayarlar kaydedildi");
  };

  const markCateringDelivered = (orderId) => {
    setCateringOrders((current) =>
      current.map((order) =>
        order.id === Number(orderId)
          ? { ...order, status: "delivered", deliveredAt: nowTime(), deliveredAtDate: todayKey() }
          : order,
      ),
    );
    notify("Catering siparişi teslim edildi ve kasaya işlendi");
  };

  const moveTable = (fromTableId, toTableId) => {
    setTables((current) => {
      const from = current.find((table) => table.id === Number(fromTableId));
      const to = current.find((table) => table.id === Number(toTableId));
      if (!from || !to || from.id === to.id) return current;

      return current.map((table) => {
        if (table.id === from.id) {
          return { ...table, status: "empty", guests: 0, openedAt: null, orders: [], payments: [] };
        }
        if (table.id === to.id) {
          return {
            ...table,
            status: from.status === "payment" ? "payment" : "service",
            guests: from.guests,
            openedAt: from.openedAt,
            orders: [...(to.orders || []), ...(from.orders || [])],
            payments: [...(to.payments || []), ...(from.payments || [])],
          };
        }
        return table;
      });
    });
    notify("Masa taşındı");
  };

  const recordPayment = (tableId, payment) => {
    let closed = false;
    const table = tables.find((entry) => entry.id === Number(tableId));
    if (table) {
      setSalesRecords((current) => [
        {
          id: nextId(),
          channel: "restaurant",
          tableId: table.id,
          tableName: table.name,
          paidAt: nowTime(),
          paidAtDate: todayKey(),
          method: payment.method,
          subtotal: Number(payment.subtotal || 0),
          service: Number(payment.service || 0),
          total: Number(payment.total || payment.amount || 0),
          amount: Number(payment.amount || payment.total || 0),
          payments: payment.payments || [],
          items: payment.items || [],
        },
        ...current,
      ]);
    }
    setTables((current) =>
      current.map((table) => {
        if (table.id !== Number(tableId)) return table;
        const paidByOrder = Object.fromEntries((payment.items || []).map((item) => [item.orderId, item.quantity]));
        const orders = table.orders.map((order) => ({
          ...order,
          paidQuantity: Math.min(order.quantity, (order.paidQuantity || 0) + (paidByOrder[order.id] || 0)),
        }));
        const remaining = orders.reduce((sum, order) => sum + order.quantity - (order.paidQuantity || 0), 0);
        closed = remaining <= 0;
        if (closed) {
          return { ...table, status: "empty", guests: 0, openedAt: null, orders: [], payments: [] };
        }
        return {
          ...table,
          status: "service",
          orders,
          payments: [...(table.payments || []), { ...payment, id: nextId(), paidAt: nowTime() }],
        };
      }),
    );
    notify(closed ? "Ödeme tamamlandı. Masa kapatıldı." : "Kısmi ödeme alındı");
    return closed;
  };

  const addRetailSale = (sale) => {
    setSalesRecords((current) => [
      {
        id: nextId(),
        channel: "retail",
        tableName: "Perakende",
        paidAt: nowTime(),
        paidAtDate: todayKey(),
        method: sale.method || "cash",
        subtotal: Number(sale.total || 0),
        service: 0,
        total: Number(sale.total || 0),
        amount: Number(sale.total || 0),
        payments: [{ method: sale.method || "cash", amount: Number(sale.total || 0) }],
        items: (sale.items || []).map((item) => ({
          orderId: item.id,
          productName: item.name,
          unitPrice: Number(item.price || 0),
          quantity: Number(item.quantity || 0),
        })),
      },
      ...current,
    ]);
    notify("Perakende satış kaydedildi");
  };

  const resetSalesData = () => {
    setSalesRecords([]);
    setCateringOrders([]);
    setNotifications([]);
    setTables((current) =>
      current.map((table) => ({
        ...table,
        status: "empty",
        guests: 0,
        openedAt: null,
        orders: [],
        payments: [],
      })),
    );
    notify("Satış datası sıfırlandı");
  };

  return {
    tables,
    products,
    categories,
    cateringOrders,
    salesRecords,
    notifications,
    settings,
    toast,
    openBills,
    addProductToTable,
    startTable,
    reserveTable,
    markPaymentWaiting,
    closeTable,
    deleteOrderFromTable,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    addTable,
    deleteTable,
    addCateringOrder,
    markCateringDelivered,
    updateSettings,
    moveTable,
    recordPayment,
    addRetailSale,
    resetSalesData,
    notify,
  };
}

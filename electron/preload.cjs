const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("restaurantStore", {
  load: () => ipcRenderer.invoke("store:load"),
  save: (data) => ipcRenderer.invoke("store:save", data),
});

contextBridge.exposeInMainWorld("restaurantPrinter", {
  list: () => ipcRenderer.invoke("printer:list"),
  printReceipt: (payload) => ipcRenderer.invoke("printer:printReceipt", payload),
  receiptText: (payload) => ipcRenderer.invoke("printer:receiptText", payload),
});

contextBridge.exposeInMainWorld("restaurantWindow", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
});

contextBridge.exposeInMainWorld("restaurantUpdater", {
  getState: () => ipcRenderer.invoke("updater:getState"),
  check: () => ipcRenderer.invoke("updater:check"),
  download: () => ipcRenderer.invoke("updater:download"),
  quitAndInstall: () => ipcRenderer.invoke("updater:quitAndInstall"),
  onStatus: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("updater:status", listener);
    return () => ipcRenderer.removeListener("updater:status", listener);
  },
});

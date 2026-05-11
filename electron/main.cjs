const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs/promises");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");

const isDev = !app.isPackaged;
const execFileAsync = promisify(execFile);
let mainWindow = null;
let updaterState = { state: "idle", message: "Güncelleme kontrolü yapılmadı." };
const appIconPath = () =>
  isDev ? path.join(__dirname, "../public/pospcimg.ico") : path.join(process.resourcesPath, "pospcimg.ico");

const getDataPath = () => path.join(app.getPath("userData"), "restaurant-data.json");

async function readDataFile() {
  try {
    const raw = await fs.readFile(getDataPath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeDataFile(data) {
  await fs.mkdir(app.getPath("userData"), { recursive: true });
  await fs.writeFile(getDataPath(), JSON.stringify(data, null, 2), "utf8");
  return true;
}

function buildReceiptText({ table, settings, selectedItems = [] }) {
  const receiptWidth = 24;
  const line = "-".repeat(receiptWidth);
  const fitLine = (left, right = "") => {
    const cleanLeft = String(left).slice(0, right ? 14 : receiptWidth);
    const cleanRight = String(right);
    if (!cleanRight) return cleanLeft;
    const gap = Math.max(receiptWidth - cleanLeft.length - cleanRight.length, 1);
    return `${cleanLeft}${" ".repeat(gap)}${cleanRight}`;
  };
  const subtotal = selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal;
  const rows = [
    "\x1b@",
    "\x1ba\x01",
    "GOCMEN KIZININ MUTFAGI",
    "ADISYON",
    "\x1ba\x00",
    line,
    `Masa: ${table?.name || "-"}`,
    `Saat: ${new Date().toLocaleString("tr-TR")}`,
    line,
    ...selectedItems.map((item) => {
      const price = `${item.quantity * item.unitPrice} TL`;
      return fitLine(`${item.quantity}x ${item.productName}`, price);
    }),
    line,
    fitLine("Ara Toplam", `${subtotal} TL`),
    fitLine("Toplam", `${total} TL`),
    line,
    "Tesekkur ederiz",
    "\n\n\n\x1dV\x00",
  ];
  return rows.join("\n");
}

const looksLikeEscPosPrinter = (printerName = "") => /pos|58|thermal|termal|receipt|fi[sş]|adisyon/i.test(printerName);

async function printRawToWindowsPrinter(printerName, receiptText) {
  if (process.platform !== "win32") {
    throw new Error("ESC/POS sessiz yazdırma şu an sadece Windows üzerinde destekleniyor.");
  }
  if (!printerName) {
    throw new Error("ESC/POS raw yazdırma için yazıcı adı seçilmeli.");
  }

  const jobId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const dataPath = path.join(os.tmpdir(), `rafa-pos-receipt-${jobId}.bin`);
  const scriptPath = path.join(os.tmpdir(), `rafa-pos-raw-print-${jobId}.ps1`);
  const script = `
param(
  [Parameter(Mandatory=$true)][string]$PrinterName,
  [Parameter(Mandatory=$true)][string]$DataPath
)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }

  [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

  [DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
  public static extern bool ClosePrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

  [DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true, ExactSpelling=true, CallingConvention=CallingConvention.StdCall)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

  public static int SendBytesToPrinter(string printerName, byte[] bytes) {
    IntPtr hPrinter = IntPtr.Zero;
    IntPtr unmanagedBytes = IntPtr.Zero;
    DOCINFOA docInfo = new DOCINFOA();
    docInfo.pDocName = "Rafa POS Adisyon";
    docInfo.pDataType = "RAW";

    if (!OpenPrinter(printerName.Normalize(), out hPrinter, IntPtr.Zero)) return Marshal.GetLastWin32Error();
    try {
      if (!StartDocPrinter(hPrinter, 1, docInfo)) return Marshal.GetLastWin32Error();
      try {
        if (!StartPagePrinter(hPrinter)) return Marshal.GetLastWin32Error();
        try {
          unmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
          Marshal.Copy(bytes, 0, unmanagedBytes, bytes.Length);
          int written = 0;
          if (!WritePrinter(hPrinter, unmanagedBytes, bytes.Length, out written)) return Marshal.GetLastWin32Error();
          if (written != bytes.Length) return 234;
        } finally {
          if (unmanagedBytes != IntPtr.Zero) Marshal.FreeCoTaskMem(unmanagedBytes);
          EndPagePrinter(hPrinter);
        }
      } finally {
        EndDocPrinter(hPrinter);
      }
    } finally {
      ClosePrinter(hPrinter);
    }
    return 0;
  }
}
"@
$bytes = [System.IO.File]::ReadAllBytes($DataPath)
$result = [RawPrinterHelper]::SendBytesToPrinter($PrinterName, $bytes)
if ($result -ne 0) {
  throw "RAW yazdırma başarısız. Windows hata kodu: $result"
}
`;

  await fs.writeFile(dataPath, Buffer.from(receiptText, "binary"));
  await fs.writeFile(scriptPath, script, "utf8");
  try {
    await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-PrinterName",
      printerName,
      "-DataPath",
      dataPath,
    ], { windowsHide: true, timeout: 20000 });
  } finally {
    await Promise.allSettled([fs.unlink(dataPath), fs.unlink(scriptPath)]);
  }
}

function buildReceiptHtml({ table, settings, selectedItems = [] }) {
  const subtotal = selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal;
  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const rows = selectedItems
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.quantity)}x ${escapeHtml(item.productName)}</td>
          <td>${escapeHtml(item.quantity * item.unitPrice)} TL</td>
        </tr>
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Adisyon Yazdır</title>
        <style>
          body { margin: 0; background: #f3f6f5; font-family: Arial, sans-serif; }
          .toolbar { position: sticky; top: 0; display: flex; gap: 8px; padding: 10px; background: #0f1717; }
          button { border: 0; border-radius: 8px; background: #009b83; color: white; padding: 10px 14px; font-weight: 700; cursor: pointer; }
          .receipt { width: 48mm; margin: 16px auto; background: white; padding: 2mm; color: #111; font: 12px "Courier New", monospace; }
          h1, h2 { margin: 0; text-align: center; }
          h1 { font-size: 15px; }
          h2 { font-size: 13px; margin-bottom: 10px; }
          .line { border-top: 1px dashed #111; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          td:last-child { text-align: right; white-space: nowrap; }
          .totals div { display: flex; justify-content: space-between; margin: 3px 0; }
          .thanks { text-align: center; margin-top: 10px; }
          @page { margin: 0; size: 58mm 210mm; }
          @media print {
            body { background: white; }
            .toolbar { display: none; }
            .receipt { width: auto; margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button onclick="window.print()">Yazdır</button>
          <button onclick="window.close()">Kapat</button>
        </div>
        <main class="receipt">
          <h1>GOCMEN KIZININ MUTFAGI</h1>
          <h2>ADISYON</h2>
          <div class="line"></div>
          <div>Masa: ${escapeHtml(table?.name || "-")}</div>
          <div>Saat: ${escapeHtml(new Date().toLocaleString("tr-TR"))}</div>
          <div class="line"></div>
          <table>${rows}</table>
          <div class="line"></div>
          <section class="totals">
            <div><span>Ara Toplam</span><strong>${escapeHtml(subtotal)} TL</strong></div>
            <div><span>Toplam</span><strong>${escapeHtml(total)} TL</strong></div>
          </section>
          <div class="line"></div>
          <div class="thanks">Tesekkur ederiz</div>
        </main>
      </body>
    </html>
  `;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    icon: appIconPath(),
    backgroundColor: "#eef7f3",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    await mainWindow.loadURL("http://localhost:5173");
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function pushUpdaterStatus(patch) {
  updaterState = { ...updaterState, ...patch };
  if (mainWindow?.webContents && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("updater:status", updaterState);
  }
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.forceDevUpdateConfig = isDev;

  autoUpdater.on("checking-for-update", () => {
    pushUpdaterStatus({ state: "checking", message: "Güncellemeler kontrol ediliyor..." });
  });

  autoUpdater.on("update-available", (info) => {
    pushUpdaterStatus({
      state: "available",
      version: info?.version,
      message: `Yeni sürüm bulundu: ${info?.version || "-"}`,
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    pushUpdaterStatus({
      state: "not-available",
      version: info?.version || app.getVersion(),
      message: "Uygulama güncel.",
    });
  });

  autoUpdater.on("error", (error) => {
    pushUpdaterStatus({
      state: "error",
      message: error?.message || "Güncelleme kontrolünde hata oluştu.",
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    pushUpdaterStatus({
      state: "downloading",
      message: `Güncelleme indiriliyor: %${Math.round(progress?.percent || 0)}`,
      progress: progress?.percent || 0,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    pushUpdaterStatus({
      state: "downloaded",
      version: info?.version,
      message: "Güncelleme indirildi. Uygulamayı yeniden başlatarak kurulabilir.",
    });
    autoUpdater.quitAndInstall();
  });
}

app.whenReady().then(() => {
  setupAutoUpdater();

  ipcMain.handle("store:load", readDataFile);
  ipcMain.handle("store:save", (_event, data) => writeDataFile(data));
  ipcMain.handle("window:minimize", (event) => BrowserWindow.fromWebContents(event.sender)?.minimize());
  ipcMain.handle("window:maximize", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return false;
    window.isMaximized() ? window.unmaximize() : window.maximize();
    return window.isMaximized();
  });
  ipcMain.handle("window:close", (event) => BrowserWindow.fromWebContents(event.sender)?.close());
  ipcMain.handle("window:isMaximized", (event) => Boolean(BrowserWindow.fromWebContents(event.sender)?.isMaximized()));
  ipcMain.handle("updater:getState", () => updaterState);
  ipcMain.handle("updater:check", async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { ok: true, updateInfo: result?.updateInfo || null };
    } catch (error) {
      pushUpdaterStatus({ state: "error", message: error?.message || "Güncelleme kontrolü başarısız." });
      return { ok: false, error: error?.message || "Güncelleme kontrolü başarısız." };
    }
  });
  ipcMain.handle("updater:download", async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (error) {
      pushUpdaterStatus({ state: "error", message: error?.message || "Güncelleme indirilemedi." });
      return { ok: false, error: error?.message || "Güncelleme indirilemedi." };
    }
  });
  ipcMain.handle("updater:quitAndInstall", () => {
    autoUpdater.quitAndInstall();
    return { ok: true };
  });
  ipcMain.handle("printer:list", async (event) => event.sender.getPrintersAsync());
  ipcMain.handle("printer:receiptText", (_event, payload) => buildReceiptText(payload));
  ipcMain.handle("printer:printReceipt", async (event, payload) => {
    const rawPrinterPath = payload?.rawPrinterPath || payload?.settings?.rawPrinterPath;
    const receiptText = buildReceiptText(payload);
    if (rawPrinterPath) {
      await fs.writeFile(rawPrinterPath, Buffer.from(receiptText, "binary"));
      return { ok: true, printerName: rawPrinterPath, mode: "raw-path" };
    }
    const printers = await event.sender.getPrintersAsync();
    if (!printers.length) {
      throw new Error("Sistemde kayıtlı yazıcı bulunamadı.");
    }
    if (payload?.printerName && !printers.some((printer) => printer.name === payload.printerName)) {
      throw new Error(`Seçili yazıcı bulunamadı: ${payload.printerName}`);
    }
    const targetPrinterName = payload?.printerName || printers.find((printer) => printer.isDefault)?.name || printers[0]?.name;
    if (!targetPrinterName) {
      throw new Error("Yazdırılacak hedef yazıcı seçilemedi.");
    }
    const showPrintWindow = payload?.silent === false;
    const printMode = payload?.printMode || payload?.settings?.printMode || "auto";
    const shouldPrintRaw =
      !showPrintWindow &&
      (printMode === "escpos" || (printMode === "auto" && looksLikeEscPosPrinter(targetPrinterName)));

    if (shouldPrintRaw) {
      await printRawToWindowsPrinter(targetPrinterName, receiptText);
      return { ok: true, printerName: targetPrinterName, mode: "escpos-raw-spooler" };
    }

    const receiptWindow = new BrowserWindow({
      show: showPrintWindow,
      width: 360,
      height: 640,
      title: "Adisyon Yazdır",
      backgroundColor: "#ffffff",
      webPreferences: { sandbox: true },
    });
    const html = buildReceiptHtml(payload);
    await receiptWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    if (showPrintWindow) {
      receiptWindow.show();
      receiptWindow.focus();
      return { ok: true, printerName: targetPrinterName, mode: "preview" };
    }
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        receiptWindow.webContents.print(
          {
            silent: !showPrintWindow,
            deviceName: showPrintWindow ? undefined : targetPrinterName,
            margins: { marginType: "none" },
            printBackground: true,
            pageSize: { width: 58000, height: 210000 },
          },
          (success, failureReason) => {
            if (!showPrintWindow) receiptWindow.close();
            success ? resolve() : reject(new Error(failureReason || `Yazdırma başarısız. Hedef yazıcı: ${targetPrinterName}`));
          },
        );
      }, 400);
    });
    return { ok: true, printerName: targetPrinterName, mode: "electron-html" };
  });

  createWindow().then(() => {
    if (!isDev) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch((error) => {
          pushUpdaterStatus({ state: "error", message: error?.message || "Otomatik güncelleme kontrolü başarısız." });
        });
      }, 1200);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

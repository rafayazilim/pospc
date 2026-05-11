import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({
  currentPage,
  collapsed,
  onToggleSidebar,
  onNavigate,
  children,
  toast,
  searchQuery,
  onSearchChange,
  searchResults = [],
  onSearchSelect,
}) {
  return (
    <div className="app-shell">
      <Sidebar currentPage={currentPage} collapsed={collapsed} onToggle={onToggleSidebar} onNavigate={onNavigate} />
      <main className="main-shell">
        <Topbar
          currentPage={currentPage}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchResults={searchResults}
          onSearchSelect={onSearchSelect}
        />
        <div className="content">{children}</div>
      </main>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

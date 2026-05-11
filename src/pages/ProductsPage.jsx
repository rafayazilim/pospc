import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Select from "../components/ui/Select";
import { Input, Textarea } from "../components/ui/Input";
import { formatCurrency } from "../utils/format";

const getProductType = (product) => product.productType || (product.isCatering ? "catering" : product.isRetail ? "retail" : "restaurant");

const productTypeLabel = {
  restaurant: "Restoran",
  catering: "Catering",
  retail: "Perakende",
};

const emptyProduct = (categories) => ({
  name: "",
  category: categories[0] || "Kategorisiz",
  price: "",
  description: "",
  prepTime: "10 dk",
  productType: "restaurant",
  isCatering: false,
  isRetail: false,
});

export default function ProductsPage({
  products,
  categories,
  searchQuery = "",
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tümü");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyProduct(categories));
  const [editingId, setEditingId] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [editingCategoryValue, setEditingCategoryValue] = useState("");

  const visibleProducts = products.filter((product) => {
    const mergedQuery = `${query} ${searchQuery}`.trim().toLowerCase();
    const matchesQuery = !mergedQuery || [product.name, product.category, product.description].join(" ").toLowerCase().includes(mergedQuery);
    const matchesCategory = category === "Tümü" || product.category === category;
    const matchesType = typeFilter === "all" || getProductType(product) === typeFilter;
    return matchesQuery && matchesCategory && matchesType;
  });

  const save = () => {
    const payload = {
      ...form,
      isCatering: form.productType === "catering",
      isRetail: form.productType === "retail",
    };
    if (editingId) onUpdateProduct({ ...payload, id: editingId });
    else onAddProduct(payload);
    setForm(emptyProduct(categories));
    setEditingId(null);
    setModalOpen(false);
  };

  const edit = (product) => {
    const productType = getProductType(product);
    setEditingId(product.id);
    setForm({ ...product, productType, isCatering: productType === "catering", isRetail: productType === "retail" });
    setModalOpen(true);
  };

  const addCategory = () => {
    onAddCategory(newCategory);
    setNewCategory("");
  };

  const updateCategory = () => {
    onUpdateCategory(editingCategory, editingCategoryValue);
    setEditingCategory("");
    setEditingCategoryValue("");
  };

  return (
    <div className="page-stack">
      <Card className="toolbar-card product-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ürün ara" />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option>Tümü</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">Tüm ürünler</option>
          <option value="restaurant">Restoran ürünleri</option>
          <option value="catering">Catering ürünleri</option>
          <option value="retail">Perakende ürünleri</option>
        </select>
        <Button variant="primary" onClick={() => { setEditingId(null); setForm(emptyProduct(categories)); setModalOpen(true); }}><Plus size={18} /> Yeni Ürün</Button>
      </Card>

      <div className="product-management-grid">
        <Card className="data-card">
          <div className="data-table product-table">
            <div className="data-head">
              <span>Ürün</span>
              <span>Kategori</span>
              <span>Fiyat</span>
              <span>Tip</span>
              <span>Durum</span>
              <span>Aksiyon</span>
            </div>
            {visibleProducts.map((product) => {
              const productType = getProductType(product);
              return (
                <div className="data-row" key={product.id}>
                  <strong>{product.name}</strong>
                  <span>{product.category}</span>
                  <strong>{formatCurrency(product.price)}</strong>
                  <Badge status={productType === "catering" ? "service" : productType === "retail" ? "pending" : "active"}>
                    {productTypeLabel[productType]}
                  </Badge>
                  <Badge status={product.isActive ? "active" : "passive"} />
                  <div className="row-actions">
                    <Button variant="outline" size="small" onClick={() => edit(product)}>Düzenle</Button>
                    <Button variant="danger" size="small" onClick={() => onDeleteProduct(product.id)}><Trash2 size={15} /> Sil</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2>Kategoriler</h2>
          <div className="category-editor">
            <div className="category-add-row">
              <Input label="Yeni kategori" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} />
              <Button variant="primary" onClick={addCategory}>Ekle</Button>
            </div>
            {categories.map((item) => (
              <div className="category-row" key={item}>
                {editingCategory === item ? (
                  <>
                    <input value={editingCategoryValue} onChange={(event) => setEditingCategoryValue(event.target.value)} />
                    <Button size="small" variant="primary" onClick={updateCategory}>Kaydet</Button>
                  </>
                ) : (
                  <>
                    <strong>{item}</strong>
                    <Button size="small" variant="outline" onClick={() => { setEditingCategory(item); setEditingCategoryValue(item); }}>Düzenle</Button>
                  </>
                )}
                <Button size="small" variant="danger" onClick={() => onDeleteCategory(item)}>Sil</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? "Ürün Düzenle" : "Yeni Ürün"}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingId(null); }}>Vazgeç</Button>
            <Button variant="primary" disabled={!form.name || !form.price} onClick={save}>Kaydet</Button>
          </>
        }
      >
        <div className="form-grid">
          <Input label="Ürün adı" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Select label="Kategori" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Input label="Fiyat" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
          <Input label="Hazırlık süresi" value={form.prepTime} onChange={(event) => setForm({ ...form, prepTime: event.target.value })} />
          <Select
            className="span-2"
            label="Ürün tipi"
            value={form.productType || "restaurant"}
            onChange={(event) => setForm({
              ...form,
              productType: event.target.value,
              isCatering: event.target.value === "catering",
              isRetail: event.target.value === "retail",
            })}
          >
            <option value="restaurant">Restoran</option>
            <option value="catering">Catering</option>
            <option value="retail">Perakende</option>
          </Select>
          <Textarea className="span-2" label="Kısa açıklama" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

import { Plus } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatCurrency } from "../../utils/format";

export default function ProductCard({ product, onAdd }) {
  return (
    <article className={`product-card ${!product.isActive ? "muted" : ""}`}>
      <div>
        <div className="product-head">
          <strong>{product.name}</strong>
          <Badge status={product.isActive ? "active" : "passive"} />
        </div>
        <p>{product.description}</p>
      </div>
      <div className="product-foot">
        <span>{product.category}</span>
        <span>{product.prepTime}</span>
        <strong>{formatCurrency(product.price)}</strong>
        <Button variant="primary" size="small" disabled={!product.isActive} onClick={() => onAdd(product)}>
          <Plus size={17} /> Ekle
        </Button>
      </div>
    </article>
  );
}

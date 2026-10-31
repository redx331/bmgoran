import { Icon } from '../Icon';
import type { CategoryId, Product } from '../../data/products';
import { categoryOptions } from '../../lib/admin/catalogue';
import { formatPrice } from '../../lib/format';

interface ProductListProps {
  products: Product[];
  activeSlug: string | null;
  query: string;
  category: CategoryId | 'all';
  previews: Record<string, string>;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: CategoryId | 'all') => void;
  onSelect: (product: Product) => void;
  onCreate: () => void;
}

export function ProductList({
  products,
  activeSlug,
  query,
  category,
  previews,
  onQueryChange,
  onCategoryChange,
  onSelect,
  onCreate,
}: ProductListProps) {
  const categories = categoryOptions();

  return (
    <section className="admin-panel admin-sidebar" aria-labelledby="admin-products-title">
      <div className="admin-sidebar__head">
        <div>
          <h2 id="admin-products-title">Produits</h2>
          <p className="admin-muted">
            {products.length} produit{products.length > 1 ? 's' : ''}
          </p>
        </div>
        <button type="button" className="btn btn--primary btn--sm" onClick={onCreate}>
          <Icon name="plus" size={15} />
          Nouveau
        </button>
      </div>

      <div className="admin-search">
        <Icon name="search" size={16} />
        <input
          type="search"
          value={query}
          placeholder="Rechercher un produit…"
          aria-label="Rechercher un produit"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="admin-category-filter">Filtrer par catégorie</label>
        <select
          id="admin-category-filter"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value as CategoryId | 'all')}
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {products.length === 0 ? (
        <p className="admin-muted admin-sidebar__empty">
          Aucun produit ne correspond à cette recherche.
        </p>
      ) : (
        <ul className="admin-list">
          {products.map((product) => {
            const image = product.images[0];
            const active = product.slug === activeSlug;
            return (
              <li key={product.id}>
                <button
                  type="button"
                  className={`admin-list__item${active ? ' is-active' : ''}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => onSelect(product)}
                >
                  <span className="admin-list__thumb">
                    {image ? (
                      <img src={previews[image] ?? image} alt="" loading="lazy" />
                    ) : (
                      <Icon name="image" size={18} />
                    )}
                  </span>
                  <span className="admin-list__body">
                    <span className="admin-list__name">{product.nameFr || product.slug}</span>
                    <span className="admin-list__meta">
                      {formatPrice(product.price, 'fr')}
                      {product.stockStatus === 'out_of_stock' ? ' · rupture' : ''}
                      {product.isDemo ? ' · démo' : ''}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

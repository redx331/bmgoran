import { useId, useState } from 'react';
import { Icon } from '../Icon';
import type { CategoryId, Product, Specification, StockStatus } from '../../data/products';
import {
  STOCK_OPTIONS,
  categoryOptions,
  formatKeywords,
  parseKeywords,
  type ProductErrors,
} from '../../lib/admin/catalogue';
import { formatPrice } from '../../lib/format';

export interface PendingImage {
  path: string;
  blob: Blob;
}

interface ProductEditorProps {
  draft: Product;
  errors: ProductErrors;
  pendingImages: PendingImage[];
  /** Object URLs for images uploaded in this session, keyed by repository path. */
  previews: Record<string, string>;
  isNew: boolean;
  busy: boolean;
  imageBusy: boolean;
  dirty: boolean;
  deleteArmed: boolean;
  onChange: (patch: Partial<Product>) => void;
  onNameFrChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onSpecChange: (index: number, patch: Partial<Specification>) => void;
  onAddSpec: () => void;
  onRemoveSpec: (index: number) => void;
  onAddImages: (files: FileList | null) => void;
  onRemoveImage: (path: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onArmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}

export function ProductEditor({
  draft,
  errors,
  pendingImages,
  previews,
  isNew,
  busy,
  imageBusy,
  dirty,
  deleteArmed,
  onChange,
  onNameFrChange,
  onSlugChange,
  onSpecChange,
  onAddSpec,
  onRemoveSpec,
  onAddImages,
  onRemoveImage,
  onSave,
  onCancel,
  onArmDelete,
  onCancelDelete,
  onDelete,
}: ProductEditorProps) {
  const idPrefix = useId();
  const fieldId = (name: string) => `${idPrefix}-${name}`;
  const [keywordsText, setKeywordsText] = useState(() => formatKeywords(draft));
  const pendingPaths = new Set(pendingImages.map((image) => image.path));
  const categories = categoryOptions();
  const totalImages = draft.images.length;

  const priceValue = draft.price > 0 ? String(draft.price) : '';

  return (
    <form
      className="admin-editor"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="admin-editor__head">
        <div>
          <p className="admin-kicker">{isNew ? 'Nouveau produit' : 'Modifier le produit'}</p>
          <h2>{draft.nameFr || 'Produit sans nom'}</h2>
          <p className="admin-editor__meta">
            {formatPrice(draft.price, 'fr')} · {draft.slug || 'adresse à définir'}
            {dirty ? ' · modifications non enregistrées' : ''}
          </p>
        </div>
        {!isNew ? (
          <a
            className="btn btn--ghost btn--sm"
            href={`/product/${encodeURIComponent(draft.slug)}`}
            target="_blank"
            rel="noreferrer"
          >
            Voir la fiche
            <Icon name="external" size={14} />
          </a>
        ) : null}
      </div>

      <section className="admin-section" aria-labelledby={fieldId('identity')}>
        <h3 id={fieldId('identity')}>Identité</h3>
        <div className="admin-grid">
          <div className={`field${errors.nameFr ? ' is-invalid' : ''}`}>
            <label htmlFor={fieldId('name-fr')}>
              Nom (français) <span className="required-mark">*</span>
            </label>
            <input
              id={fieldId('name-fr')}
              value={draft.nameFr}
              placeholder="Ex. Phares LED H4 6000K"
              autoComplete="off"
              aria-invalid={Boolean(errors.nameFr)}
              onChange={(event) => onNameFrChange(event.target.value)}
            />
            {errors.nameFr ? <p className="field-error">{errors.nameFr}</p> : null}
          </div>

          <div className={`field${errors.nameAr ? ' is-invalid' : ''}`}>
            <label htmlFor={fieldId('name-ar')}>
              Nom (arabe) <span className="required-mark">*</span>
            </label>
            <input
              id={fieldId('name-ar')}
              value={draft.nameAr}
              dir="rtl"
              lang="ar"
              placeholder="مثال: مصابيح LED H4"
              autoComplete="off"
              aria-invalid={Boolean(errors.nameAr)}
              onChange={(event) => onChange({ nameAr: event.target.value })}
            />
            {errors.nameAr ? <p className="field-error">{errors.nameAr}</p> : null}
          </div>

          <div className={`field field--full${errors.slug ? ' is-invalid' : ''}`}>
            <label htmlFor={fieldId('slug')}>Adresse de la fiche (slug)</label>
            <input
              id={fieldId('slug')}
              value={draft.slug}
              dir="ltr"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={Boolean(errors.slug)}
              onChange={(event) => onSlugChange(event.target.value)}
            />
            {errors.slug ? (
              <p className="field-error">{errors.slug}</p>
            ) : (
              <p className="field-hint">
                Adresse publique : /product/{draft.slug || '…'} — ne la changez que si nécessaire,
                les anciens liens cesseront de fonctionner.
              </p>
            )}
          </div>

          <div className={`field${errors.category ? ' is-invalid' : ''}`}>
            <label htmlFor={fieldId('category')}>Catégorie</label>
            <select
              id={fieldId('category')}
              value={draft.category}
              aria-invalid={Boolean(errors.category)}
              onChange={(event) => onChange({ category: event.target.value as CategoryId })}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category ? <p className="field-error">{errors.category}</p> : null}
          </div>

          <div className={`field${errors.brand ? ' is-invalid' : ''}`}>
            <label htmlFor={fieldId('brand')}>Marque (facultatif)</label>
            <input
              id={fieldId('brand')}
              value={draft.brand ?? ''}
              placeholder="Ex. Bosch"
              autoComplete="off"
              aria-invalid={Boolean(errors.brand)}
              onChange={(event) => onChange({ brand: event.target.value })}
            />
            {errors.brand ? <p className="field-error">{errors.brand}</p> : null}
          </div>

          <div className={`field${errors.partNumber ? ' is-invalid' : ''}`}>
            <label htmlFor={fieldId('part')}>Référence (facultatif)</label>
            <input
              id={fieldId('part')}
              value={draft.partNumber ?? ''}
              dir="ltr"
              placeholder="Ex. H4-LED-6000"
              autoComplete="off"
              aria-invalid={Boolean(errors.partNumber)}
              onChange={(event) => onChange({ partNumber: event.target.value })}
            />
            {errors.partNumber ? <p className="field-error">{errors.partNumber}</p> : null}
          </div>
        </div>
      </section>

      <section className="admin-section" aria-labelledby={fieldId('price')}>
        <h3 id={fieldId('price')}>Prix et disponibilité</h3>
        <div className="admin-grid">
          <div className={`field${errors.price ? ' is-invalid' : ''}`}>
            <label htmlFor={fieldId('price-input')}>
              Prix en dinars (DA) <span className="required-mark">*</span>
            </label>
            <input
              id={fieldId('price-input')}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={priceValue}
              placeholder="Ex. 3500"
              aria-invalid={Boolean(errors.price)}
              onChange={(event) => {
                const raw = event.target.value.trim();
                const parsed = raw === '' ? 0 : Math.trunc(Number(raw));
                onChange({ price: Number.isFinite(parsed) ? parsed : 0 });
              }}
            />
            {errors.price ? (
              <p className="field-error">{errors.price}</p>
            ) : (
              <p className="field-hint">Nombre entier, sans espace ni « DA ».</p>
            )}
          </div>

          <div className={`field${errors.stockStatus ? ' is-invalid' : ''}`}>
            <label htmlFor={fieldId('stock')}>État du stock</label>
            <select
              id={fieldId('stock')}
              value={draft.stockStatus}
              aria-invalid={Boolean(errors.stockStatus)}
              onChange={(event) => onChange({ stockStatus: event.target.value as StockStatus })}
            >
              {STOCK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.stockStatus ? <p className="field-error">{errors.stockStatus}</p> : null}
          </div>

          <label className="admin-check field--full">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(event) => onChange({ featured: event.target.checked })}
            />
            <span>
              <strong>Mettre en avant sur l’accueil</strong>
              <small>Le produit apparaît dans la sélection « à la une ».</small>
            </span>
          </label>

          <label className="admin-check field--full">
            <input
              type="checkbox"
              checked={draft.isDemo}
              onChange={(event) => onChange({ isDemo: event.target.checked })}
            />
            <span>
              <strong>Contenu de démonstration</strong>
              <small>
                Laissez coché tant que le prix et les informations ne sont pas vérifiés. Le site
                affiche alors un avertissement « démo ».
              </small>
            </span>
          </label>
        </div>
      </section>

      <section className="admin-section" aria-labelledby={fieldId('descriptions')}>
        <h3 id={fieldId('descriptions')}>Descriptions</h3>
        <div className="admin-grid">
          <div className={`field field--full${errors.descriptionFr ? ' is-invalid' : ''}`}>
            <label htmlFor={fieldId('desc-fr')}>
              Description (français) <span className="required-mark">*</span>
            </label>
            <textarea
              id={fieldId('desc-fr')}
              rows={4}
              value={draft.descriptionFr}
              placeholder="Décrivez la pièce, sa matière, ce qu’elle contient…"
              aria-invalid={Boolean(errors.descriptionFr)}
              onChange={(event) => onChange({ descriptionFr: event.target.value })}
            />
            {errors.descriptionFr ? <p className="field-error">{errors.descriptionFr}</p> : null}
          </div>

          <div className={`field field--full${errors.descriptionAr ? ' is-invalid' : ''}`}>
            <label htmlFor={fieldId('desc-ar')}>
              Description (arabe) <span className="required-mark">*</span>
            </label>
            <textarea
              id={fieldId('desc-ar')}
              rows={4}
              dir="rtl"
              lang="ar"
              value={draft.descriptionAr}
              placeholder="وصف القطعة، مادتها، ومحتويات العلبة…"
              aria-invalid={Boolean(errors.descriptionAr)}
              onChange={(event) => onChange({ descriptionAr: event.target.value })}
            />
            {errors.descriptionAr ? <p className="field-error">{errors.descriptionAr}</p> : null}
          </div>
        </div>
      </section>

      <section className="admin-section" aria-labelledby={fieldId('specs')}>
        <div className="admin-section__head">
          <h3 id={fieldId('specs')}>Caractéristiques</h3>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onAddSpec}>
            <Icon name="plus" size={14} />
            Ajouter
          </button>
        </div>

        {draft.specifications.length === 0 ? (
          <p className="admin-muted">
            Aucune caractéristique. Ajoutez par exemple « Matière » ou « Couleur ».
          </p>
        ) : (
          <div className="admin-specs">
            <div className="admin-specs__head" aria-hidden="true">
              <span>Libellé FR</span>
              <span>Libellé AR</span>
              <span>Valeur FR</span>
              <span>Valeur AR</span>
              <span />
            </div>
            {draft.specifications.map((spec, index) => (
              <div className="admin-spec" key={index}>
                <input
                  value={spec.labelFr}
                  aria-label={`Libellé français ${index + 1}`}
                  placeholder="Matière"
                  onChange={(event) => onSpecChange(index, { labelFr: event.target.value })}
                />
                <input
                  value={spec.labelAr}
                  aria-label={`Libellé arabe ${index + 1}`}
                  placeholder="المادة"
                  dir="rtl"
                  lang="ar"
                  onChange={(event) => onSpecChange(index, { labelAr: event.target.value })}
                />
                <input
                  value={spec.valueFr}
                  aria-label={`Valeur française ${index + 1}`}
                  placeholder="ABS"
                  onChange={(event) => onSpecChange(index, { valueFr: event.target.value })}
                />
                <input
                  value={spec.valueAr}
                  aria-label={`Valeur arabe ${index + 1}`}
                  placeholder="ABS"
                  dir="rtl"
                  lang="ar"
                  onChange={(event) => onSpecChange(index, { valueAr: event.target.value })}
                />
                <button
                  type="button"
                  className="admin-icon-button"
                  aria-label={`Supprimer la caractéristique ${index + 1}`}
                  onClick={() => onRemoveSpec(index)}
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.specifications ? <p className="field-error">{errors.specifications}</p> : null}
      </section>

      <section className="admin-section" aria-labelledby={fieldId('photos')}>
        <div className="admin-section__head">
          <h3 id={fieldId('photos')}>Photos</h3>
          <span className="admin-muted">{totalImages} / 8</span>
        </div>

        <div className="admin-photos">
          {draft.images.map((image, index) => (
            <div className="admin-photo" key={image}>
              <img
                src={previews[image] ?? image}
                alt={`Photo ${index + 1} de ${draft.nameFr || 'ce produit'}`}
                loading="lazy"
              />
              {pendingPaths.has(image) ? <span className="admin-photo__tag">Nouvelle</span> : null}
              <button
                type="button"
                className="admin-photo__remove"
                aria-label={`Supprimer la photo ${index + 1}`}
                onClick={() => onRemoveImage(image)}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}

          {totalImages < 8 ? (
            <label className={`admin-photo-add${imageBusy ? ' is-busy' : ''}`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                disabled={imageBusy || busy}
                onChange={(event) => {
                  onAddImages(event.target.files);
                  event.target.value = '';
                }}
              />
              <Icon name="image" size={22} />
              <span>{imageBusy ? 'Préparation…' : 'Ajouter des photos'}</span>
            </label>
          ) : null}
        </div>

        <p className="field-hint">
          JPEG, PNG, WebP ou AVIF. Les photos sont automatiquement recadrées en 1200 × 900 et
          compressées avant l’envoi. La première photo sert d’image principale.
        </p>
      </section>

      <section className="admin-section" aria-labelledby={fieldId('seo')}>
        <h3 id={fieldId('seo')}>Référencement</h3>
        <div className="field">
          <label htmlFor={fieldId('keywords')}>Mots-clés (facultatif)</label>
          <input
            id={fieldId('keywords')}
            value={keywordsText}
            placeholder="phares led, h4, éclairage"
            autoComplete="off"
            onChange={(event) => {
              setKeywordsText(event.target.value);
              onChange({ keywords: parseKeywords(event.target.value) });
            }}
          />
          <p className="field-hint">
            Séparés par des virgules. Ils aident la recherche interne du site.
          </p>
        </div>
      </section>

      <div className="admin-actions">
        <button type="submit" className="btn btn--primary" disabled={busy || imageBusy}>
          {busy ? 'Enregistrement…' : isNew ? 'Publier le produit' : 'Enregistrer les modifications'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Annuler
        </button>
        <span className="admin-actions__spacer" />
        {isNew ? null : deleteArmed ? (
          <>
            <button
              type="button"
              className="btn btn--danger"
              onClick={onDelete}
              disabled={busy}
            >
              Confirmer la suppression
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onCancelDelete}
              disabled={busy}
            >
              Non
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn--danger-ghost btn--sm"
            onClick={onArmDelete}
            disabled={busy}
          >
            Supprimer ce produit
          </button>
        )}
      </div>
    </form>
  );
}

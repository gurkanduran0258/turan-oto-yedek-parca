'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Product = {
  id: number;
  product_code: string;
  product_name: string;
  product_group: string | null;
  purchase_price: number;
  profit_margin: number;
  vat: number;
  sale_price: number;
  stock: number;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
};

type ProductListResponse = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
};

type ProductForm = {
  product_code: string;
  product_name: string;
  product_group: string;
  purchase_price: string;
  profit_margin: string;
  vat: string;
  sale_price: string;
  stock: string;
  image_url: string;
};

const emptyForm: ProductForm = {
  product_code: '',
  product_name: '',
  product_group: '',
  purchase_price: '',
  profit_margin: '30',
  vat: '20',
  sale_price: '',
  stock: '0',
  image_url: '',
};

function formatMoney(value: number | string | null | undefined) {
  const numericValue = Number(value || 0);

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  useEffect(() => {
    void loadProducts();
  }, [page, activeSearch]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function loadProducts() {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (activeSearch.trim()) {
        params.set('search', activeSearch.trim());
      }

      const response = await fetch(`/api/products-list?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const result = (await response.json()) as ProductListResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || 'Ürünler getirilemedi.');
      }

      setProducts(Array.isArray(result.products) ? result.products : []);
      setTotal(Number(result.total || 0));
    } catch (err) {
      setProducts([]);
      setTotal(0);
      setError(
        err instanceof Error ? err.message : 'Ürünler getirilemedi.'
      );
    } finally {
      setLoading(false);
    }
  }

  function openNewProductModal() {
    setEditingProduct(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function openEditProductModal(product: Product) {
    setEditingProduct(product);

    setForm({
      product_code: product.product_code || '',
      product_name: product.product_name || '',
      product_group: product.product_group || '',
      purchase_price: String(product.purchase_price ?? ''),
      profit_margin: String(product.profit_margin ?? 30),
      vat: String(product.vat ?? 20),
      sale_price: String(product.sale_price ?? ''),
      stock: String(product.stock ?? 0),
      image_url: product.image_url || '',
    });

    setSelectedFile(null);
    setPreviewUrl(product.image_url || '');
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setModalOpen(false);
    setEditingProduct(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setForm(emptyForm);
  }

  function updateFormField(
    field: keyof ProductForm,
    value: string
  ) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (
        field === 'purchase_price' ||
        field === 'profit_margin' ||
        field === 'vat'
      ) {
        const purchasePrice =
          field === 'purchase_price'
            ? Number(value)
            : Number(next.purchase_price);

        const profitMargin =
          field === 'profit_margin'
            ? Number(value)
            : Number(next.profit_margin);

        const vat =
          field === 'vat'
            ? Number(value)
            : Number(next.vat);

        if (
          Number.isFinite(purchasePrice) &&
          Number.isFinite(profitMargin) &&
          Number.isFinite(vat)
        ) {
          const priceWithoutVat =
            purchasePrice * (1 + profitMargin / 100);

          const priceWithVat =
            priceWithoutVat * (1 + vat / 100);

          next.sale_price = priceWithVat.toFixed(2);
        }
      }

      return next;
    });
  }

  function handleFileChange(file: File | null) {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);

    if (!file) {
      setPreviewUrl(form.image_url || '');
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadProductImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/products/upload-image', {
      method: 'POST',
      body: formData,
    });

    const result = (await response.json()) as {
      image_url?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(result.error || 'Görsel yüklenemedi.');
    }

    if (!result.image_url) {
      throw new Error('Görsel bağlantısı alınamadı.');
    }

    return result.image_url;
  }

  async function handleSaveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!form.product_code.trim()) {
        throw new Error('Ürün kodu zorunludur.');
      }

      if (!form.product_name.trim()) {
        throw new Error('Parça adı zorunludur.');
      }

      let imageUrl = form.image_url.trim();

      if (selectedFile) {
        imageUrl = await uploadProductImage(selectedFile);
      }

      const payload = {
        product_code: form.product_code.trim(),
        product_name: form.product_name.trim(),
        product_group: form.product_group.trim(),
        purchase_price: Number(form.purchase_price) || 0,
        profit_margin: Number(form.profit_margin) || 0,
        vat: Number(form.vat) || 20,
        sale_price: Number(form.sale_price) || 0,
        stock: Number(form.stock) || 0,
        image_url: imageUrl || null,
      };

      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products';

      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || 'Ürün kaydedilemedi.');
      }

      setSuccess(
        editingProduct
          ? 'Ürün başarıyla güncellendi.'
          : 'Ürün başarıyla eklendi.'
      );

      closeModal();

      if (!editingProduct && page !== 1) {
        setPage(1);
      } else {
        await loadProducts();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ürün kaydedilemedi.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    const approved = window.confirm(
      `${product.product_code} kodlu ürünü silmek istediğine emin misin?`
    );

    if (!approved) {
      return;
    }

    try {
      setDeletingId(product.id);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });

      const result = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || 'Ürün silinemedi.');
      }

      setSuccess('Ürün başarıyla silindi.');

      if (products.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadProducts();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ürün silinemedi.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setActiveSearch(search.trim());
  }

  function handleExport() {
    window.location.href = '/api/products/export';
  }

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <div style={styles.topLinkRow}>
          <a href="/admin" style={styles.backLink}>
            ← Yönetim paneli
          </a>
        </div>

        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Ürün Yönetimi</h1>
            <p style={styles.subtitle}>Toplam {total} ürün</p>
          </div>

          <div style={styles.headerActions}>
            <a href="/admin/excel-yukle" style={styles.excelButton}>
              Excel Yükle
            </a>

            <button
              type="button"
              onClick={handleExport}
              style={styles.exportButton}
            >
              Dışa Aktar
            </button>

            <button
              type="button"
              onClick={openNewProductModal}
              style={styles.newButton}
            >
              + Yeni Ürün
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} style={styles.searchRow}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ürün kodu, parça adı veya grup ara"
            style={styles.searchInput}
          />

          <button type="submit" style={styles.searchButton}>
            Ara
          </button>
        </form>

        {error ? (
          <div style={styles.errorBox}>{error}</div>
        ) : null}

        {success ? (
          <div style={styles.successBox}>{success}</div>
        ) : null}

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Görsel</th>
                <th style={styles.th}>Kod</th>
                <th style={styles.th}>Parça</th>
                <th style={styles.th}>Grup</th>
                <th style={styles.th}>Alış</th>
                <th style={styles.th}>Satış</th>
                <th style={styles.th}>Stok</th>
                <th style={styles.th}>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={styles.emptyCell}>
                    Ürünler yükleniyor...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} style={styles.emptyCell}>
                    Ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.td}>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.product_name}
                          style={styles.productImage}
                        />
                      ) : (
                        <div style={styles.noImage}>Görsel yok</div>
                      )}
                    </td>

                    <td style={styles.td}>
                      <strong>{product.product_code}</strong>
                    </td>

                    <td style={styles.td}>
                      {product.product_name}
                    </td>

                    <td style={styles.td}>
                      {product.product_group || '-'}
                    </td>

                    <td style={styles.td}>
                      {formatMoney(product.purchase_price)}
                    </td>

                    <td style={styles.td}>
                      <strong>{formatMoney(product.sale_price)}</strong>
                    </td>

                    <td style={styles.td}>
                      {product.stock}
                    </td>

                    <td style={styles.td}>
                      <div style={styles.actionRow}>
                        <button
                          type="button"
                          onClick={() => openEditProductModal(product)}
                          style={styles.editButton}
                        >
                          Düzenle
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDeleteProduct(product)}
                          disabled={deletingId === product.id}
                          style={styles.deleteButton}
                        >
                          {deletingId === product.id
                            ? 'Siliniyor'
                            : 'Sil'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.pagination}>
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            style={styles.paginationButton}
          >
            ← Önceki
          </button>

          <strong>
            {page} / {totalPages}
          </strong>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            style={styles.paginationButton}
          >
            Sonraki →
          </button>
        </div>
      </section>

      {modalOpen ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            </h2>

            <form onSubmit={handleSaveProduct}>
              <div style={styles.formGrid}>
                <label style={styles.label}>
                  Ürün Kodu
                  <input
                    value={form.product_code}
                    onChange={(event) =>
                      updateFormField(
                        'product_code',
                        event.target.value
                      )
                    }
                    required
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Parça Adı
                  <input
                    value={form.product_name}
                    onChange={(event) =>
                      updateFormField(
                        'product_name',
                        event.target.value
                      )
                    }
                    required
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Ürün Grubu
                  <input
                    value={form.product_group}
                    onChange={(event) =>
                      updateFormField(
                        'product_group',
                        event.target.value
                      )
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Alış Fiyatı
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.purchase_price}
                    onChange={(event) =>
                      updateFormField(
                        'purchase_price',
                        event.target.value
                      )
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Kar Marjı %
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.profit_margin}
                    onChange={(event) =>
                      updateFormField(
                        'profit_margin',
                        event.target.value
                      )
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  KDV %
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.vat}
                    onChange={(event) =>
                      updateFormField('vat', event.target.value)
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Satış Fiyatı
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.sale_price}
                    onChange={(event) =>
                      updateFormField(
                        'sale_price',
                        event.target.value
                      )
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Stok
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) =>
                      updateFormField('stock', event.target.value)
                    }
                    style={styles.input}
                  />
                </label>
              </div>

              <div style={styles.imageSection}>
                <label style={styles.label}>
                  Ürün Görseli
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      handleFileChange(
                        event.target.files?.[0] || null
                      )
                    }
                    style={styles.fileInput}
                  />
                </label>

                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Ürün görseli ön izlemesi"
                    style={styles.previewImage}
                  />
                ) : null}
              </div>

              <div style={styles.modalActions}>
                <button
                  type="submit"
                  disabled={saving}
                  style={styles.saveButton}
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  Vazgeç
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '70vh',
    background: '#ffffff',
    padding: '36px 20px 70px',
  },
  container: {
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
  },
  topLinkRow: {
    marginBottom: '26px',
  },
  backLink: {
    color: '#0f172a',
    textDecoration: 'none',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '26px',
  },
  title: {
    margin: 0,
    fontSize: '36px',
    lineHeight: 1.1,
    color: '#0f172a',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#475569',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  excelButton: {
    padding: '11px 16px',
    borderRadius: '8px',
    background: '#c81e1e',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 700,
  },
  exportButton: {
    padding: '11px 16px',
    borderRadius: '8px',
    border: 'none',
    background: '#334155',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  newButton: {
    padding: '11px 16px',
    borderRadius: '8px',
    border: 'none',
    background: '#047857',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  searchRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '18px',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    padding: '13px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '16px',
  },
  searchButton: {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    background: '#0f172a',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  },
  errorBox: {
    padding: '12px 14px',
    borderRadius: '8px',
    background: '#fee2e2',
    color: '#991b1b',
    marginBottom: '16px',
    fontWeight: 700,
  },
  successBox: {
    padding: '12px 14px',
    borderRadius: '8px',
    background: '#dcfce7',
    color: '#166534',
    marginBottom: '16px',
    fontWeight: 700,
  },
  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #dbe3ec',
    borderRadius: '12px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '980px',
  },
  th: {
    padding: '14px 12px',
    textAlign: 'left',
    background: '#f8fafc',
    color: '#0f172a',
    borderBottom: '1px solid #dbe3ec',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '13px 12px',
    borderBottom: '1px solid #eef2f7',
    verticalAlign: 'middle',
  },
  emptyCell: {
    padding: '36px 12px',
    textAlign: 'center',
    color: '#475569',
  },
  productImage: {
    width: '64px',
    height: '64px',
    objectFit: 'contain',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
  },
  noImage: {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: '#64748b',
    textAlign: 'center',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    border: 'none',
    borderRadius: '7px',
    padding: '8px 11px',
    background: '#1d4ed8',
    color: '#ffffff',
    cursor: 'pointer',
  },
  deleteButton: {
    border: 'none',
    borderRadius: '7px',
    padding: '8px 11px',
    background: '#b91c1c',
    color: '#ffffff',
    cursor: 'pointer',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '14px',
    marginTop: '18px',
  },
  paginationButton: {
    padding: '8px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '7px',
    background: '#ffffff',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0, 0, 0, 0.58)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    overflowY: 'auto',
  },
  modal: {
    width: '100%',
    maxWidth: '760px',
    maxHeight: '92vh',
    overflowY: 'auto',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '26px',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.28)',
  },
  modalTitle: {
    margin: '0 0 20px',
    fontSize: '28px',
    color: '#0f172a',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '14px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    fontWeight: 700,
    color: '#1e293b',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 11px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '16px',
  },
  imageSection: {
    marginTop: '18px',
  },
  fileInput: {
    marginTop: '2px',
  },
  previewImage: {
    width: '140px',
    height: '140px',
    objectFit: 'contain',
    border: '1px solid #dbe3ec',
    borderRadius: '10px',
    marginTop: '12px',
    background: '#ffffff',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  saveButton: {
    padding: '11px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#047857',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  cancelButton: {
    padding: '11px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#64748b',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
  },
};

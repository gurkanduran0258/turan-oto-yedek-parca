'use client';

import type {
  ChangeEvent,
  CSSProperties,
  FormEvent,
} from 'react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
};

type ProductListResponse = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
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

const PAGE_SIZE = 25;

const EMPTY_FORM: ProductForm = {
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

function formatMoney(
  value: number | string | null | undefined
): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Görsel okunamadı.'));
    };

    reader.onerror = () => {
      reject(new Error('Görsel okunamadı.'));
    };

    reader.readAsDataURL(file);
  });
}

async function readJsonResponse<T>(
  response: Response
): Promise<T> {
  const responseText = await response.text();

  if (!responseText.trim()) {
    throw new Error(
      `Sunucu boş cevap verdi. HTTP: ${response.status}`
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    console.error('Sunucudan gelen geçersiz cevap:', responseText);

    throw new Error(
      `Sunucudan geçersiz cevap geldi. HTTP: ${response.status}`
    );
  }
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductForm>(EMPTY_FORM);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState('');

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }, [total]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });

      if (activeSearch.trim()) {
        params.set('search', activeSearch.trim());
      }

      const response = await fetch(
        `/api/products-list?${params.toString()}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const result =
        await readJsonResponse<ProductListResponse>(response);

      if (!response.ok) {
        throw new Error(
          result.error || 'Ürünler getirilemedi.'
        );
      }

      setProducts(
        Array.isArray(result.products)
          ? result.products
          : []
      );

      setTotal(Number(result.total || 0));
    } catch (requestError) {
      setProducts([]);
      setTotal(0);

      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Ürünler getirilemedi.'
      );
    } finally {
      setLoading(false);
    }
  }, [page, activeSearch]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  function resetModalState() {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setModalOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl('');
  }

  function openNewProduct() {
    clearMessages();

    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setSelectedFile(null);
    setPreviewUrl('');
    setModalOpen(true);
  }

  function openEditProduct(product: Product) {
    clearMessages();

    setEditingProduct(product);

    setForm({
      product_code: product.product_code || '',
      product_name: product.product_name || '',
      product_group: product.product_group || '',
      purchase_price: String(
        product.purchase_price ?? ''
      ),
      profit_margin: String(
        product.profit_margin ?? 30
      ),
      vat: String(product.vat ?? 20),
      sale_price: String(product.sale_price ?? ''),
      stock: String(product.stock ?? 0),
      image_url: product.image_url || '',
    });

    setSelectedFile(null);
    setPreviewUrl(product.image_url || '');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    resetModalState();
  }

  function updateField(
    field: keyof ProductForm,
    value: string
  ) {
    setForm((current) => {
      const updated: ProductForm = {
        ...current,
        [field]: value,
      };

      if (
        field === 'purchase_price' ||
        field === 'profit_margin' ||
        field === 'vat'
      ) {
        const purchasePrice = Number(
          updated.purchase_price || 0
        );

        const profitMargin = Number(
          updated.profit_margin || 0
        );

        const vat = Number(updated.vat || 0);

        const priceWithoutVat =
          purchasePrice * (1 + profitMargin / 100);

        const priceWithVat =
          priceWithoutVat * (1 + vat / 100);

        updated.sale_price = priceWithVat.toFixed(2);
      }

      return updated;
    });
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] || null;

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(form.image_url || '');
    }
  }

  async function uploadProductImage(
    file: File
  ): Promise<string> {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        'Sadece JPG, PNG veya WEBP yüklenebilir.'
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error(
        'Görsel en fazla 5 MB olabilir.'
      );
    }

    const fileData = await fileToBase64(file);

    const response = await fetch(
      '/api/products/upload-image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData,
        }),
      }
    );

    const result = await readJsonResponse<{
      image_url?: string;
      error?: string;
    }>(response);

    if (!response.ok) {
      throw new Error(
        result.error || 'Görsel yüklenemedi.'
      );
    }

    if (!result.image_url) {
      throw new Error(
        'Görsel bağlantısı alınamadı.'
      );
    }

    return result.image_url;
  }

  async function saveProduct(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      clearMessages();

      const productCode = form.product_code.trim();
      const productName = form.product_name.trim();

      if (!productCode) {
        throw new Error('Ürün kodu zorunludur.');
      }

      if (!productName) {
        throw new Error('Parça adı zorunludur.');
      }

      let imageUrl = form.image_url.trim();

      if (selectedFile) {
        imageUrl =
          await uploadProductImage(selectedFile);
      }

      const payload = {
        product_code: productCode,
        product_name: productName,
        product_group:
          form.product_group.trim() || null,
        purchase_price:
          Number(form.purchase_price) || 0,
        profit_margin:
          Number(form.profit_margin) || 0,
        vat: Number(form.vat) || 20,
        sale_price: Number(form.sale_price) || 0,
        stock: Number(form.stock) || 0,
        image_url: imageUrl || null,
      };

      const wasEditing = Boolean(editingProduct);

      const requestUrl = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products';

      const requestMethod = editingProduct
        ? 'PUT'
        : 'POST';

      const response = await fetch(requestUrl, {
        method: requestMethod,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await readJsonResponse<{
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(
          result.error || 'Ürün kaydedilemedi.'
        );
      }

      resetModalState();

      setSuccess(
        wasEditing
          ? 'Ürün başarıyla güncellendi.'
          : 'Ürün başarıyla eklendi.'
      );

      if (!wasEditing && page !== 1) {
        setPage(1);
      } else {
        await loadProducts();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Ürün kaydedilemedi.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(
    product: Product
  ) {
    const confirmed = window.confirm(
      `${product.product_code} kodlu ürünü silmek istediğine emin misin?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);
      clearMessages();

      const response = await fetch(
        `/api/products/${product.id}`,
        {
          method: 'DELETE',
        }
      );

      const result = await readJsonResponse<{
        error?: string;
      }>(response);

      if (!response.ok) {
        throw new Error(
          result.error || 'Ürün silinemedi.'
        );
      }

      setSuccess('Ürün başarıyla silindi.');

      if (products.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadProducts();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Ürün silinemedi.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  function submitSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setPage(1);
    setActiveSearch(searchInput.trim());
  }

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <a href="/admin" style={styles.backLink}>
          ← Yönetim paneli
        </a>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Ürün Yönetimi
            </h1>

            <p style={styles.subtitle}>
              Toplam {total} ürün
            </p>
          </div>

          <div style={styles.headerButtons}>
            <a
              href="/admin/excel-yukle"
              style={styles.excelButton}
            >
              Excel Yükle
            </a>

            <a
              href="/api/products/export"
              style={styles.exportButton}
            >
              Dışa Aktar
            </a>

            <button
              type="button"
              onClick={openNewProduct}
              style={styles.newButton}
            >
              + Yeni Ürün
            </button>
          </div>
        </div>

        <form
          onSubmit={submitSearch}
          style={styles.searchForm}
        >
          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            placeholder="Ürün kodu, parça adı veya grup ara"
            style={styles.searchInput}
          />

          <button
            type="submit"
            style={styles.searchButton}
          >
            Ara
          </button>
        </form>

        {error ? (
          <div style={styles.errorMessage}>
            {error}
          </div>
        ) : null}

        {success ? (
          <div style={styles.successMessage}>
            {success}
          </div>
        ) : null}

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>
                  Görsel
                </th>
                <th style={styles.tableHeader}>
                  Kod
                </th>
                <th style={styles.tableHeader}>
                  Parça
                </th>
                <th style={styles.tableHeader}>
                  Grup
                </th>
                <th style={styles.tableHeader}>
                  Alış
                </th>
                <th style={styles.tableHeader}>
                  Satış
                </th>
                <th style={styles.tableHeader}>
                  Stok
                </th>
                <th style={styles.tableHeader}>
                  İşlem
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={styles.emptyCell}
                  >
                    Ürünler yükleniyor...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={styles.emptyCell}
                  >
                    Ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.tableCell}>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.product_name}
                          style={styles.productImage}
                        />
                      ) : (
                        <div style={styles.noImage}>
                          Görsel yok
                        </div>
                      )}
                    </td>

                    <td style={styles.tableCell}>
                      <strong>
                        {product.product_code}
                      </strong>
                    </td>

                    <td style={styles.tableCell}>
                      {product.product_name}
                    </td>

                    <td style={styles.tableCell}>
                      {product.product_group || '-'}
                    </td>

                    <td style={styles.tableCell}>
                      {formatMoney(
                        product.purchase_price
                      )}
                    </td>

                    <td style={styles.tableCell}>
                      <strong>
                        {formatMoney(
                          product.sale_price
                        )}
                      </strong>
                    </td>

                    <td style={styles.tableCell}>
                      {product.stock}
                    </td>

                    <td style={styles.tableCell}>
                      <div style={styles.actionButtons}>
                        <button
                          type="button"
                          onClick={() =>
                            openEditProduct(product)
                          }
                          style={styles.editButton}
                        >
                          Düzenle
                        </button>

                        <button
                          type="button"
                          disabled={
                            deletingId === product.id
                          }
                          onClick={() =>
                            void deleteProduct(product)
                          }
                          style={styles.deleteButton}
                        >
                          {deletingId === product.id
                            ? 'Siliniyor...'
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
            onClick={() =>
              setPage((current) =>
                Math.max(1, current - 1)
              )
            }
            style={styles.pageButton}
          >
            ← Önceki
          </button>

          <strong>
            {page} / {totalPages}
          </strong>

          <button
            type="button"
            disabled={
              page >= totalPages || loading
            }
            onClick={() =>
              setPage((current) =>
                Math.min(
                  totalPages,
                  current + 1
                )
              )
            }
            style={styles.pageButton}
          >
            Sonraki →
          </button>
        </div>
      </section>

      {modalOpen ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editingProduct
                ? 'Ürün Düzenle'
                : 'Yeni Ürün Ekle'}
            </h2>

            <form onSubmit={saveProduct}>
              <div style={styles.formGrid}>
                <label style={styles.label}>
                  Ürün Kodu

                  <input
                    required
                    value={form.product_code}
                    onChange={(event) =>
                      updateField(
                        'product_code',
                        event.target.value
                      )
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Parça Adı

                  <input
                    required
                    value={form.product_name}
                    onChange={(event) =>
                      updateField(
                        'product_name',
                        event.target.value
                      )
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Ürün Grubu

                  <input
                    value={form.product_group}
                    onChange={(event) =>
                      updateField(
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
                    min="0"
                    step="0.01"
                    value={form.purchase_price}
                    onChange={(event) =>
                      updateField(
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
                    min="0"
                    step="0.01"
                    value={form.profit_margin}
                    onChange={(event) =>
                      updateField(
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
                    min="0"
                    step="0.01"
                    value={form.vat}
                    onChange={(event) =>
                      updateField(
                        'vat',
                        event.target.value
                      )
                    }
                    style={styles.input}
                  />
                </label>

                <label style={styles.label}>
                  Satış Fiyatı

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sale_price}
                    onChange={(event) =>
                      updateField(
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
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      updateField(
                        'stock',
                        event.target.value
                      )
                    }
                    style={styles.input}
                  />
                </label>
              </div>

              <div style={styles.imageArea}>
                <label style={styles.label}>
                  Ürün Görseli

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                  />
                </label>

                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Ürün ön izlemesi"
                    style={styles.previewImage}
                  />
                ) : null}
              </div>

              <div style={styles.modalButtons}>
                <button
                  type="submit"
                  disabled={saving}
                  style={styles.saveButton}
                >
                  {saving
                    ? 'Kaydediliyor...'
                    : 'Kaydet'}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={closeModal}
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

const styles: Record<string, CSSProperties> = {
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

  backLink: {
    display: 'inline-block',
    marginBottom: '28px',
    color: '#0f172a',
    textDecoration: 'none',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '25px',
  },

  title: {
    margin: 0,
    color: '#0f172a',
    fontSize: '36px',
  },

  subtitle: {
    margin: '5px 0 0',
    color: '#475569',
  },

  headerButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
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
    background: '#334155',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 700,
  },

  newButton: {
    padding: '11px 16px',
    border: 0,
    borderRadius: '8px',
    background: '#047857',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  },

  searchForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '18px',
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '13px 14px',
    fontSize: '16px',
  },

  searchButton: {
    border: 0,
    borderRadius: '8px',
    padding: '12px 20px',
    background: '#0f172a',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  },

  errorMessage: {
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    background: '#fee2e2',
    color: '#991b1b',
    fontWeight: 700,
  },

  successMessage: {
    padding: '12px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    background: '#dcfce7',
    color: '#166534',
    fontWeight: 700,
  },

  tableContainer: {
    overflowX: 'auto',
    border: '1px solid #dbe3ec',
    borderRadius: '12px',
  },

  table: {
    width: '100%',
    minWidth: '980px',
    borderCollapse: 'collapse',
  },

  tableHeader: {
    padding: '14px 12px',
    textAlign: 'left',
    background: '#f8fafc',
    borderBottom: '1px solid #dbe3ec',
    color: '#0f172a',
  },

  tableCell: {
    padding: '13px 12px',
    borderBottom: '1px solid #eef2f7',
    verticalAlign: 'middle',
  },

  emptyCell: {
    padding: '40px 12px',
    textAlign: 'center',
    color: '#475569',
  },

  productImage: {
    width: '64px',
    height: '64px',
    objectFit: 'contain',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
  },

  noImage: {
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    background: '#f1f5f9',
    color: '#64748b',
    fontSize: '11px',
    textAlign: 'center',
  },

  actionButtons: {
    display: 'flex',
    gap: '8px',
  },

  editButton: {
    padding: '8px 11px',
    border: 0,
    borderRadius: '7px',
    background: '#1d4ed8',
    color: '#ffffff',
    cursor: 'pointer',
  },

  deleteButton: {
    padding: '8px 11px',
    border: 0,
    borderRadius: '7px',
    background: '#b91c1c',
    color: '#ffffff',
    cursor: 'pointer',
  },

  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '14px',
    marginTop: '20px',
  },

  pageButton: {
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'rgba(0,0,0,0.58)',
    overflowY: 'auto',
  },

  modal: {
    width: '100%',
    maxWidth: '760px',
    maxHeight: '92vh',
    overflowY: 'auto',
    padding: '26px',
    borderRadius: '16px',
    background: '#ffffff',
    boxShadow:
      '0 24px 80px rgba(0,0,0,0.28)',
  },

  modalTitle: {
    margin: '0 0 20px',
    color: '#0f172a',
    fontSize: '28px',
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '14px',
  },

  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    color: '#1e293b',
    fontWeight: 700,
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 11px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '16px',
  },

  imageArea: {
    marginTop: '18px',
  },

  previewImage: {
    width: '140px',
    height: '140px',
    objectFit: 'contain',
    marginTop: '12px',
    border: '1px solid #dbe3ec',
    borderRadius: '10px',
  },

  modalButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '22px',
  },

  saveButton: {
    padding: '11px 18px',
    border: 0,
    borderRadius: '8px',
    background: '#047857',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  },

  cancelButton: {
    padding: '11px 18px',
    border: 0,
    borderRadius: '8px',
    background: '#64748b',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
  },
};

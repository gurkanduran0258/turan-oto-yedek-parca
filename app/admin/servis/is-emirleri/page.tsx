import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  q?: string;
  durum?: string;
  sirala?: string;
};

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) || {};

  const q = String(params.q || "").trim();
  const durum = String(params.durum || "TUMU").trim();

  // DEFAULT = EN YENİ İŞ EMRİ
  const sirala = String(params.sirala || "ikk-yeni").trim();

  const supabase = getSupabaseAdmin();

  const { data: orders, error } = await supabase
    .from("service_work_orders")
    .select(`
      *,
      service_work_order_parts(*),
      service_work_order_labor(*)
    `)
    .order("work_order_no", {
      ascending: false,
    })
    .limit(1000);

  if (error) {
    return (
      <div style={{ padding: 28 }}>
        <h1>İş Emirleri</h1>

        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: 14,
            borderRadius: 10,
            border: "1px solid #fecaca",
          }}
        >
          {error.message}
        </div>
      </div>
    );
  }

  const allOrders = Array.isArray(orders)
    ? orders
    : [];

  const counts = {
    TUMU: allOrders.length,

    FATURA: allOrders.filter(
      (x: any) => getStatus(x) === "FATURA"
    ).length,

    ATOLYE: allOrders.filter(
      (x: any) => getStatus(x) === "ATÖLYE"
    ).length,

    BEKLEMEDE: allOrders.filter(
      (x: any) => getStatus(x) === "BEKLEMEDE"
    ).length,

    TASLAK: allOrders.filter(
      (x: any) => getStatus(x) === "TASLAK"
    ).length,

    IPTAL: allOrders.filter(
      (x: any) => getStatus(x) === "İPTAL"
    ).length,
  };

  let filteredOrders = [...allOrders];

  // ============================================
  // DURUM FİLTRESİ
  // ============================================

  if (durum !== "TUMU") {
    filteredOrders = filteredOrders.filter(
      (wo: any) => {
        const status = getStatus(wo);

        if (durum === "ATOLYE") {
          return status === "ATÖLYE";
        }

        if (durum === "IPTAL") {
          return status === "İPTAL";
        }

        return status === durum;
      }
    );
  }

  // ============================================
  // ARAMA
  // ============================================

  if (q) {
    const needle = normalize(q);

    filteredOrders = filteredOrders.filter(
      (wo: any) => {
        const searchable = [
          wo.work_order_no,
          wo.plate,
          wo.vin,
          wo.customer_name,
          wo.customer_code,
          wo.customer_phone,
          wo.vehicle_description,
          wo.advisor_name,
          wo.model_year,
        ]
          .map((x) => normalize(x))
          .join(" ");

        return searchable.includes(needle);
      }
    );
  }

  // ============================================
  // SIRALAMA
  // ============================================

  filteredOrders.sort((a: any, b: any) => {
    // EN YENİ İŞ EMRİ
    if (sirala === "ikk-yeni") {
      return compareWorkOrderDesc(
        a.work_order_no,
        b.work_order_no
      );
    }

    // EN ESKİ İŞ EMRİ
    if (sirala === "ikk-eski") {
      return compareWorkOrderAsc(
        a.work_order_no,
        b.work_order_no
      );
    }

    // EN YENİ SENKRON
    if (sirala === "yeni") {
      return (
        dateValue(b.updated_at) -
        dateValue(a.updated_at)
      );
    }

    // EN ESKİ SENKRON
    if (sirala === "eski") {
      return (
        dateValue(a.updated_at) -
        dateValue(b.updated_at)
      );
    }

    // TUTAR YÜKSEK
    if (sirala === "tutar-yuksek") {
      return (
        safeNumber(b.grand_total) -
        safeNumber(a.grand_total)
      );
    }

    // TUTAR DÜŞÜK
    if (sirala === "tutar-dusuk") {
      return (
        safeNumber(a.grand_total) -
        safeNumber(b.grand_total)
      );
    }

    // DEFAULT
    return compareWorkOrderDesc(
      a.work_order_no,
      b.work_order_no
    );
  });

  return (
    <div
      style={{
        padding: 28,
        minHeight: "100vh",
        background: "#f6f8fb",
      }}
    >
      {/* ========================================
          BAŞLIK
      ======================================== */}

      <div
        style={{
          color: "#c90020",
          fontWeight: 900,
          fontSize: 12,
        }}
      >
        SERVİS
      </div>

      <h1
        style={{
          margin: "4px 0 0",
          fontSize: 30,
        }}
      >
        İş Emirleri
      </h1>

      <p
        style={{
          color: "#64748b",
          marginTop: 5,
        }}
      >
        TOFAŞ&apos;tan okunan araç, müşteri,
        yedek parça ve işçilik bilgileri.
      </p>

      {/* ========================================
          DURUM KARTLARI
      ======================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(6, minmax(120px, 1fr))",
          gap: 10,
          marginTop: 20,
        }}
      >
        <CountCard
          title="Tümü"
          count={counts.TUMU}
          active={durum === "TUMU"}
          href={makeUrl({
            q,
            durum: "TUMU",
            sirala,
          })}
        />

        <CountCard
          title="Fatura"
          count={counts.FATURA}
          active={durum === "FATURA"}
          href={makeUrl({
            q,
            durum: "FATURA",
            sirala,
          })}
          color="#16a34a"
        />

        <CountCard
          title="Atölye"
          count={counts.ATOLYE}
          active={durum === "ATOLYE"}
          href={makeUrl({
            q,
            durum: "ATOLYE",
            sirala,
          })}
          color="#2563eb"
        />

        <CountCard
          title="Beklemede"
          count={counts.BEKLEMEDE}
          active={durum === "BEKLEMEDE"}
          href={makeUrl({
            q,
            durum: "BEKLEMEDE",
            sirala,
          })}
          color="#d97706"
        />

        <CountCard
          title="Taslak"
          count={counts.TASLAK}
          active={durum === "TASLAK"}
          href={makeUrl({
            q,
            durum: "TASLAK",
            sirala,
          })}
          color="#64748b"
        />

        <CountCard
          title="İptal"
          count={counts.IPTAL}
          active={durum === "IPTAL"}
          href={makeUrl({
            q,
            durum: "IPTAL",
            sirala,
          })}
          color="#dc2626"
        />
      </div>

      {/* ========================================
          ARAMA / FİLTRE
      ======================================== */}

      <form
        method="get"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(250px,1fr) 190px 230px 110px",
          gap: 10,
          marginTop: 16,
          background: "#fff",
          padding: 12,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
        }}
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="İş emri, plaka, şase, müşteri, model ara..."
          style={inputStyle}
        />

        <select
          name="durum"
          defaultValue={durum}
          style={inputStyle}
        >
          <option value="TUMU">
            Tüm Durumlar
          </option>

          <option value="FATURA">
            Fatura
          </option>

          <option value="ATOLYE">
            Atölye
          </option>

          <option value="BEKLEMEDE">
            Beklemede
          </option>

          <option value="TASLAK">
            Taslak
          </option>

          <option value="KK">
            KK
          </option>

          <option value="KK2">
            KK2
          </option>

          <option value="KK2 BEKLEMEDE">
            KK2 Beklemede
          </option>

          <option value="FATURASIZ">
            Faturasız
          </option>

          <option value="IPTAL">
            İptal
          </option>
        </select>

        <select
          name="sirala"
          defaultValue={sirala}
          style={inputStyle}
        >
          <option value="ikk-yeni">
            En Yeni İş Emri
          </option>

          <option value="ikk-eski">
            En Eski İş Emri
          </option>

          <option value="yeni">
            En Yeni Senkron
          </option>

          <option value="eski">
            En Eski Senkron
          </option>

          <option value="tutar-yuksek">
            Tutar: Yüksekten Düşüğe
          </option>

          <option value="tutar-dusuk">
            Tutar: Düşükten Yükseğe
          </option>
        </select>

        <button
          type="submit"
          style={{
            border: 0,
            borderRadius: 9,
            background: "#0f172a",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Uygula
        </button>
      </form>

      <div
        style={{
          marginTop: 10,
          color: "#64748b",
          fontSize: 13,
        }}
      >
        <b>{filteredOrders.length}</b> iş emri
        gösteriliyor.
      </div>

      {/* ========================================
          TABLO BAŞLIĞI
      ======================================== */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "165px 115px 145px 110px minmax(190px,1fr) 135px 145px",

          gap: 12,
          alignItems: "center",

          marginTop: 12,

          padding: "11px 16px",

          background: "#e9eef5",

          border: "1px solid #d5deea",

          borderRadius: 10,

          fontSize: 12,

          fontWeight: 950,

          color: "#334155",

          textTransform: "uppercase",

          letterSpacing: 0.3,
        }}
      >
        <span>İş Emri</span>

        <span>Plaka</span>

        <span>Şase</span>

        <span>Model</span>

        <span>Müşteri</span>

        <span>Durum</span>

        <span
          style={{
            textAlign: "right",
          }}
        >
          Toplam
        </span>
      </div>

      {/* ========================================
          İŞ EMİRLERİ
      ======================================== */}

      <div
        style={{
          display: "grid",
          gap: 10,
          marginTop: 8,
        }}
      >
        {filteredOrders.map((wo: any) => {
          const parts = Array.isArray(
            wo.service_work_order_parts
          )
            ? wo.service_work_order_parts
            : [];

          const labor = Array.isArray(
            wo.service_work_order_labor
          )
            ? wo.service_work_order_labor
            : [];

          const status = getStatus(wo);

          return (
            <details
              key={wo.id}
              style={{
                background: "#fff",

                border:
                  "1px solid #dbe3ee",

                borderRadius: 12,

                overflow: "hidden",
              }}
            >
              {/* =================================
                  KAPALI KART
              ================================= */}

              <summary
                style={{
                  cursor: "pointer",

                  display: "grid",

                  gridTemplateColumns:
                    "165px 115px 145px 110px minmax(190px,1fr) 135px 145px",

                  gap: 12,

                  alignItems: "center",

                  padding: "14px 16px",

                  listStyle: "none",
                }}
              >
                {/* İŞ EMRİ */}

                <b>
                  {safeText(
                    wo.work_order_no
                  )}
                </b>

                {/* PLAKA */}

                <b>
                  {safeText(
                    wo.plate
                  )}
                </b>

                {/* ŞASE */}

                <span>
                  {safeText(
                    wo.vin
                  )}
                </span>

                {/* MODEL */}

                <span
                  style={{
                    fontWeight: 850,

                    overflow: "hidden",

                    textOverflow:
                      "ellipsis",

                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {safeText(
                    wo.vehicle_description ||
                      wo.model_year
                  )}
                </span>

                {/* MÜŞTERİ */}

                <span
                  title={
                    wo.customer_name ||
                    ""
                  }
                  style={{
                    fontWeight: 750,

                    overflow: "hidden",

                    textOverflow:
                      "ellipsis",

                    whiteSpace:
                      "nowrap",

                    color: "#334155",
                  }}
                >
                  {safeText(
                    wo.customer_name
                  )}
                </span>

                {/* DURUM */}

                <StatusBadge
                  status={status}
                />

                {/* TOPLAM */}

                <b
                  style={{
                    textAlign: "right",

                    fontSize: 15,
                  }}
                >
                  {money(
                    wo.grand_total
                  )}
                </b>
              </summary>

              {/* =================================
                  AÇILAN DETAY
              ================================= */}

              <div
                style={{
                  padding:
                    "0 16px 18px",

                  borderTop:
                    "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{
                    display: "grid",

                    gridTemplateColumns:
                      "repeat(3, minmax(0,1fr))",

                    gap: 12,

                    marginTop: 14,
                  }}
                >
                  {/* ARAÇ */}

                  <Box title="Araç">
                    <Line
                      k="Plaka"
                      v={wo.plate}
                    />

                    <Line
                      k="Şase"
                      v={wo.vin}
                    />

                    <Line
                      k="Motor No"
                      v={wo.engine_no}
                    />

                    <Line
                      k="Ünite No"
                      v={wo.unit_no}
                    />

                    <Line
                      k="Model/Yıl"
                      v={wo.model_year}
                    />

                    <Line
                      k="Araç"
                      v={
                        wo.vehicle_description
                      }
                    />

                    <Line
                      k="Renk"
                      v={wo.color}
                    />

                    <Line
                      k="KM"
                      v={wo.mileage}
                    />
                  </Box>

                  {/* MÜŞTERİ */}

                  <Box title="Müşteri / Servis">
                    <Line
                      k="Müşteri"
                      v={
                        wo.customer_name
                      }
                    />

                    <Line
                      k="Müşteri Kodu"
                      v={
                        wo.customer_code
                      }
                    />

                    <Line
                      k="Telefon"
                      v={
                        wo.customer_phone
                      }
                    />

                    <Line
                      k="Danışman"
                      v={
                        wo.advisor_name
                      }
                    />

                    <Line
                      k="Teslim Eden"
                      v={
                        wo.delivery_person
                      }
                    />

                    <Line
                      k="İKK Türü"
                      v={wo.ikk_type}
                    />

                    <Line
                      k="İKK Sınıfı"
                      v={wo.ikk_class}
                    />

                    <Line
                      k="Durum"
                      v={
                        <StatusBadge
                          status={status}
                          small
                        />
                      }
                    />
                  </Box>

                  {/* TUTAR */}

                  <Box title="Tutarlar">
                    <Line
                      k="Parça KDV Hariç"
                      v={money(
                        wo.parts_subtotal
                      )}
                    />

                    <Line
                      k="İşçilik KDV Hariç"
                      v={money(
                        wo.labor_subtotal
                      )}
                    />

                    <Line
                      k="İskonto"
                      v={money(
                        wo.discount_total
                      )}
                    />

                    <Line
                      k="KDV"
                      v={money(
                        wo.vat_total
                      )}
                    />

                    <Line
                      k="Genel Toplam"
                      v={money(
                        wo.grand_total
                      )}
                    />

                    <Line
                      k="TOFAŞ Son Okuma"
                      v={formatDate(
                        wo.tofas_last_sync_at
                      )}
                    />
                  </Box>
                </div>

                {/* MÜŞTERİ İSTEĞİ */}

                {wo.customer_request ? (
                  <div
                    style={{
                      marginTop: 12,

                      background:
                        "#fff7ed",

                      border:
                        "1px solid #fed7aa",

                      borderRadius: 9,

                      padding: 11,
                    }}
                  >
                    <b>
                      Müşteri İsteği:
                    </b>{" "}
                    {safeText(
                      wo.customer_request
                    )}
                  </div>
                ) : null}

                {/* =================================
                    YEDEK PARÇALAR
                ================================= */}

                <h3
                  style={{
                    marginTop: 20,
                  }}
                >
                  Yedek Parçalar
                </h3>

                <div
                  style={{
                    overflowX: "auto",
                  }}
                >
                  <table
                    style={table}
                  >
                    <thead>
                      <tr>
                        <Th>
                          İş Satırı
                        </Th>

                        <Th>
                          OEM
                        </Th>

                        <Th>
                          Parça
                        </Th>

                        <Th>
                          Adet
                        </Th>

                        <Th>
                          KDV Hariç Birim
                        </Th>

                        <Th>
                          İsk.
                        </Th>

                        <Th>
                          KDV
                        </Th>

                        <Th>
                          KDV Tutarı
                        </Th>

                        <Th>
                          KDV Dahil Toplam
                        </Th>
                      </tr>
                    </thead>

                    <tbody>
                      {parts.map(
                        (p: any) => (
                          <tr key={p.id}>
                            <Td>
                              {safeText(
                                p.row_ref
                              )}
                            </Td>

                            <Td>
                              <b>
                                {safeText(
                                  p.product_code
                                )}
                              </b>
                            </Td>

                            <Td>
                              {safeText(
                                p.description
                              )}
                            </Td>

                            <Td>
                              {safeText(
                                p.quantity
                              )}
                            </Td>

                            <Td>
                              {money(
                                p.unit_price
                              )}
                            </Td>

                            <Td>
                              %
                              {safePercent(
                                p.discount_rate
                              )}
                            </Td>

                            <Td>
                              %
                              {safePercent(
                                p.vat_rate ||
                                  20
                              )}
                            </Td>

                            <Td>
                              {money(
                                p.line_vat
                              )}
                            </Td>

                            <Td>
                              <b>
                                {money(
                                  p.line_total
                                )}
                              </b>
                            </Td>
                          </tr>
                        )
                      )}

                      {!parts.length && (
                        <tr>
                          <Td
                            colSpan={9}
                          >
                            <span
                              style={{
                                color:
                                  "#94a3b8",
                              }}
                            >
                              Yedek parça
                              kaydı yok.
                            </span>
                          </Td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* =================================
                    İŞÇİLİKLER
                ================================= */}

                <h3
                  style={{
                    marginTop: 20,
                  }}
                >
                  İşçilikler
                </h3>

                <div
                  style={{
                    overflowX: "auto",
                  }}
                >
                  <table
                    style={table}
                  >
                    <thead>
                      <tr>
                        <Th>
                          İş Satırı
                        </Th>

                        <Th>
                          Kod
                        </Th>

                        <Th>
                          İşçilik
                        </Th>

                        <Th>
                          Saat / Adet
                        </Th>

                        <Th>
                          KDV Hariç Birim
                        </Th>

                        <Th>
                          İsk.
                        </Th>

                        <Th>
                          KDV
                        </Th>

                        <Th>
                          KDV Tutarı
                        </Th>

                        <Th>
                          KDV Dahil Toplam
                        </Th>
                      </tr>
                    </thead>

                    <tbody>
                      {labor.map(
                        (p: any) => (
                          <tr key={p.id}>
                            <Td>
                              {safeText(
                                p.row_ref
                              )}
                            </Td>

                            <Td>
                              <b>
                                {safeText(
                                  p.labor_code
                                )}
                              </b>
                            </Td>

                            <Td>
                              {safeText(
                                p.description
                              )}
                            </Td>

                            <Td>
                              {safeText(
                                p.quantity
                              )}
                            </Td>

                            <Td>
                              {money(
                                p.unit_price
                              )}
                            </Td>

                            <Td>
                              %
                              {safePercent(
                                p.discount_rate
                              )}
                            </Td>

                            <Td>
                              %
                              {safePercent(
                                p.vat_rate ||
                                  20
                              )}
                            </Td>

                            <Td>
                              {money(
                                p.line_vat
                              )}
                            </Td>

                            <Td>
                              <b>
                                {money(
                                  p.line_total
                                )}
                              </b>
                            </Td>
                          </tr>
                        )
                      )}

                      {!labor.length && (
                        <tr>
                          <Td
                            colSpan={9}
                          >
                            <span
                              style={{
                                color:
                                  "#94a3b8",
                              }}
                            >
                              İşçilik kaydı
                              yok.
                            </span>
                          </Td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          );
        })}

        {!filteredOrders.length && (
          <div
            style={{
              background: "#fff",

              border:
                "1px solid #e2e8f0",

              padding: 40,

              borderRadius: 12,

              textAlign: "center",

              color: "#64748b",
            }}
          >
            Bu filtrelere uygun iş emri
            bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SAYAC KARTLARI
========================================================= */

function CountCard({
  title,
  count,
  href,
  color = "#0f172a",
  active = false,
}: {
  title: string;
  count: number;
  href: string;
  color?: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        textDecoration: "none",

        color: "#0f172a",

        background: "#fff",

        border: active
          ? `2px solid ${color}`
          : "1px solid #e2e8f0",

        borderRadius: 12,

        padding: "13px 14px",

        boxShadow: active
          ? `0 0 0 2px ${color}15`
          : "none",
      }}
    >
      <div
        style={{
          fontSize: 12,

          color: "#64748b",

          fontWeight: 800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 3,

          fontSize: 24,

          fontWeight: 950,

          color,
        }}
      >
        {count}
      </div>
    </a>
  );
}

/* =========================================================
   DURUM BADGE
========================================================= */

function StatusBadge({
  status,
  small = false,
}: {
  status?: string | null;
  small?: boolean;
}) {
  const value =
    normalizeStatus(status);

  const style =
    statusStyle(value);

  return (
    <span
      style={{
        display: "inline-flex",

        justifyContent: "center",

        alignItems: "center",

        width: "fit-content",

        minWidth:
          small ? 80 : 105,

        padding: small
          ? "4px 8px"
          : "6px 12px",

        borderRadius: 999,

        background:
          style.background,

        color:
          style.color,

        border:
          `1px solid ${style.border}`,

        fontSize:
          small ? 10 : 11,

        fontWeight: 950,

        letterSpacing: 0.25,

        whiteSpace: "nowrap",
      }}
    >
      {value}
    </span>
  );
}

/* =========================================================
   BOX
========================================================= */

function Box({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",

        borderRadius: 10,

        padding: 12,
      }}
    >
      <b>{title}</b>

      <div
        style={{
          marginTop: 8,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* =========================================================
   LINE
========================================================= */

function Line({
  k,
  v,
}: {
  k: string;
  v: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",

        justifyContent:
          "space-between",

        alignItems: "center",

        gap: 15,

        padding: "4px 0",

        fontSize: 13,
      }}
    >
      <span
        style={{
          color: "#64748b",

          flexShrink: 0,
        }}
      >
        {k}
      </span>

      <div
        style={{
          textAlign: "right",

          fontWeight: 700,
        }}
      >
        {isPrimitive(v)
          ? safeText(v)
          : v}
      </div>
    </div>
  );
}

/* =========================================================
   TABLE
========================================================= */

function Th({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      style={{
        textAlign: "left",

        padding: 8,

        background: "#f8fafc",

        borderBottom:
          "1px solid #e2e8f0",

        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  colSpan,
}: {
  children: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: 8,

        borderBottom:
          "1px solid #f1f5f9",

        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

/* =========================================================
   STYLES
========================================================= */

const table: React.CSSProperties = {
  width: "100%",

  borderCollapse: "collapse",

  fontSize: 13,

  minWidth: 950,
};

const inputStyle: React.CSSProperties = {
  width: "100%",

  boxSizing: "border-box",

  border: "1px solid #cbd5e1",

  borderRadius: 9,

  padding: "10px 12px",

  background: "#fff",

  color: "#0f172a",

  outline: "none",

  fontSize: 14,
};

/* =========================================================
   STATUS
========================================================= */

function getStatus(wo: any) {
  return normalizeStatus(
    wo.acceptance_status ||
      wo.status ||
      "BİLİNMİYOR"
  );
}

function normalizeStatus(v: any) {
  const value = String(
    v || "BİLİNMİYOR"
  )
    .trim()
    .toLocaleUpperCase("tr-TR");

  if (value === "ATOLYE") {
    return "ATÖLYE";
  }

  if (value === "IPTAL") {
    return "İPTAL";
  }

  return value;
}

function statusStyle(
  value: string
) {
  if (value === "FATURA") {
    return {
      background: "#dcfce7",
      border: "#16a34a",
      color: "#166534",
    };
  }

  if (value === "ATÖLYE") {
    return {
      background: "#dbeafe",
      border: "#2563eb",
      color: "#1e40af",
    };
  }

  if (value === "BEKLEMEDE") {
    return {
      background: "#fef3c7",
      border: "#d97706",
      color: "#92400e",
    };
  }

  if (value === "TASLAK") {
    return {
      background: "#f1f5f9",
      border: "#94a3b8",
      color: "#475569",
    };
  }

  if (
    value === "KK" ||
    value === "KK2" ||
    value.includes(
      "KK2 BEKLEMEDE"
    )
  ) {
    return {
      background: "#ede9fe",
      border: "#7c3aed",
      color: "#5b21b6",
    };
  }

  if (value === "İPTAL") {
    return {
      background: "#fee2e2",
      border: "#dc2626",
      color: "#991b1b",
    };
  }

  if (value === "FATURASIZ") {
    return {
      background: "#ffedd5",
      border: "#f97316",
      color: "#9a3412",
    };
  }

  return {
    background: "#f1f5f9",
    border: "#94a3b8",
    color: "#475569",
  };
}

/* =========================================================
   SAFE VALUES
========================================================= */

function safeText(v: any) {
  if (
    v === null ||
    v === undefined ||
    v === ""
  ) {
    return "-";
  }

  if (
    typeof v === "string" ||
    typeof v === "number"
  ) {
    return String(v);
  }

  return "-";
}

function safeNumber(v: any) {
  const n = Number(v);

  if (!Number.isFinite(n)) {
    return 0;
  }

  if (
    Math.abs(n) >
    999999999
  ) {
    return 0;
  }

  return n;
}

function safePercent(v: any) {
  return safeNumber(
    v
  ).toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   MONEY
========================================================= */

function money(v: any) {
  return (
    safeNumber(v).toLocaleString(
      "tr-TR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ) + " ₺"
  );
}

/* =========================================================
   DATE
========================================================= */

function formatDate(v: any) {
  if (!v) {
    return "-";
  }

  const d =
    new Date(v);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return "-";
  }

  return d.toLocaleString(
    "tr-TR"
  );
}

function dateValue(v: any) {
  if (!v) {
    return 0;
  }

  const n =
    new Date(v).getTime();

  return Number.isNaN(n)
    ? 0
    : n;
}

/* =========================================================
   WORK ORDER SIRALAMA
========================================================= */

function compareWorkOrderDesc(
  a: any,
  b: any
) {
  const A =
    BigInt(
      String(a || "0").replace(
        /\D/g,
        ""
      ) || "0"
    );

  const B =
    BigInt(
      String(b || "0").replace(
        /\D/g,
        ""
      ) || "0"
    );

  if (A > B) {
    return -1;
  }

  if (A < B) {
    return 1;
  }

  return 0;
}

function compareWorkOrderAsc(
  a: any,
  b: any
) {
  const A =
    BigInt(
      String(a || "0").replace(
        /\D/g,
        ""
      ) || "0"
    );

  const B =
    BigInt(
      String(b || "0").replace(
        /\D/g,
        ""
      ) || "0"
    );

  if (A > B) {
    return 1;
  }

  if (A < B) {
    return -1;
  }

  return 0;
}

/* =========================================================
   SEARCH NORMALIZE
========================================================= */

function normalize(v: any) {
  return String(v || "")
    .trim()
    .toLocaleLowerCase(
      "tr-TR"
    );
}

/* =========================================================
   REACT VALUE
========================================================= */

function isPrimitive(
  v: React.ReactNode
) {
  return (
    typeof v === "string" ||
    typeof v === "number" ||
    v === null ||
    v === undefined
  );
}

/* =========================================================
   URL
========================================================= */

function makeUrl({
  q,
  durum,
  sirala,
}: {
  q?: string;
  durum?: string;
  sirala?: string;
}) {
  const params =
    new URLSearchParams();

  if (q) {
    params.set(
      "q",
      q
    );
  }

  if (
    durum &&
    durum !== "TUMU"
  ) {
    params.set(
      "durum",
      durum
    );
  }

  if (
    sirala &&
    sirala !== "ikk-yeni"
  ) {
    params.set(
      "sirala",
      sirala
    );
  }

  const query =
    params.toString();

  return query
    ? `/admin/servis/is-emirleri?${query}`
    : "/admin/servis/is-emirleri";
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase-client";

type Address = {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  address_line: string;
  postal_code: string | null;
  is_default: boolean;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function createOrderNo() {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const timePart = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const randomPart = Math.floor(
    1000 + Math.random() * 9000
  );

  return `TO-${datePart}-${timePart}-${randomPart}`;
}

export default function CheckoutPage() {
  const router = useRouter();

  const {
    items,
    total,
    clear,
  } = useCart();

  const [userId, setUserId] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState("Havale / EFT");

  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] =
    useState(false);

  const [error, setError] = useState("");

  const shipping =
    total === 0 || total >= 1500
      ? 0
      : 99.9;

  const grandTotal =
    total + shipping;

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) =>
          address.id === selectedAddressId
      ) || null,
    [addresses, selectedAddressId]
  );

  useEffect(() => {
    async function loadCheckout() {
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/giris");
        return;
      }

      setUserId(user.id);

      const { data, error } =
        await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const loadedAddresses =
        (data || []) as Address[];

      setAddresses(loadedAddresses);

      const defaultAddress =
        loadedAddresses.find(
          (address) =>
            address.is_default
        );

      if (defaultAddress) {
        setSelectedAddressId(
          defaultAddress.id
        );
      } else if (
        loadedAddresses.length > 0
      ) {
        setSelectedAddressId(
          loadedAddresses[0].id
        );
      }

      setLoading(false);
    }

    void loadCheckout();
  }, [router]);

  async function createOrder() {
    if (!userId) {
      router.push("/giris");
      return;
    }

    if (!items.length) {
      setError(
        "Sepetiniz boş."
      );
      return;
    }

    if (!selectedAddress) {
      setError(
        "Siparişi tamamlamak için teslimat adresi seçmelisiniz."
      );
      return;
    }

    setCreatingOrder(true);
    setError("");

    try {
      const orderNo =
        createOrderNo();

      const addressSnapshot = {
        title: selectedAddress.title,
        first_name:
          selectedAddress.first_name,
        last_name:
          selectedAddress.last_name,
        phone:
          selectedAddress.phone,
        city:
          selectedAddress.city,
        district:
          selectedAddress.district,
        neighborhood:
          selectedAddress.neighborhood,
        address_line:
          selectedAddress.address_line,
        postal_code:
          selectedAddress.postal_code,
      };

      const {
        data: orderData,
        error: orderError,
      } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          order_no: orderNo,
          status: "Yeni",
          subtotal: Number(
            total.toFixed(2)
          ),
          shipping: Number(
            shipping.toFixed(2)
          ),
          total: Number(
            grandTotal.toFixed(2)
          ),
          payment_method:
            paymentMethod,
          address_snapshot:
            addressSnapshot,
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      const orderItems = items.map(
        (item) => ({
          order_id: orderData.id,
          product_id: item.id,
          product_code: item.oem,
          product_name: item.name,
          image_url: item.image,
          unit_price: Number(
            Number(
              item.price || 0
            ).toFixed(2)
          ),
          quantity: item.qty,
          line_total: Number(
            (
              Number(
                item.price || 0
              ) * item.qty
            ).toFixed(2)
          ),
        })
      );

      const {
        error: itemsError,
      } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        await supabase
          .from("orders")
          .delete()
          .eq("id", orderData.id);

        throw itemsError;
      }

      clear();

      router.push(
        `/siparis-basarili?order=${encodeURIComponent(
          orderNo
        )}`
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Sipariş oluşturulamadı."
      );
    } finally {
      setCreatingOrder(false);
    }
  }

  if (loading) {
    return (
      <main
        className="container"
        style={{
          padding: "60px 0",
        }}
      >
        Ödeme bilgileri yükleniyor...
      </main>
    );
  }

  return (
    <>
      <section className="pageTitle">
        <div className="container">
          <small>
            Sepet / Ödeme
          </small>

          <h1>
            Ödeme ve Teslimat
          </h1>
        </div>
      </section>

      <main
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0,1.6fr) minmax(320px,.7fr)",
          gap: "28px",
          paddingTop: "35px",
          paddingBottom: "70px",
          alignItems: "start",
        }}
      >
        <section>
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: "7px",
                  }}
                >
                  Teslimat Adresi
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    margin: 0,
                  }}
                >
                  Siparişinizin
                  gönderileceği adresi
                  seçin.
                </p>
              </div>

              <Link
                href="/hesabim/adresler"
                className="primary"
              >
                + ADRES EKLE
              </Link>
            </div>

            {addresses.length ? (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginTop: "22px",
                }}
              >
                {addresses.map(
                  (address) => {
                    const selected =
                      selectedAddressId ===
                      address.id;

                    return (
                      <label
                        key={
                          address.id
                        }
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "auto minmax(0,1fr)",
                          gap: "13px",
                          border: selected
                            ? "2px solid #c90020"
                            : "1px solid #e2e8f0",
                          borderRadius:
                            "10px",
                          padding: "16px",
                          cursor:
                            "pointer",
                          background:
                            selected
                              ? "#fff7f8"
                              : "#ffffff",
                        }}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={
                            selected
                          }
                          onChange={() =>
                            setSelectedAddressId(
                              address.id
                            )
                          }
                        />

                        <div>
                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              gap: "10px",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <strong>
                              {
                                address.title
                              }
                            </strong>

                            {address.is_default ? (
                              <span
                                style={{
                                  background:
                                    "#dcfce7",
                                  color:
                                    "#166534",
                                  borderRadius:
                                    "999px",
                                  padding:
                                    "3px 8px",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    800,
                                }}
                              >
                                Varsayılan
                              </span>
                            ) : null}
                          </div>

                          <p
                            style={{
                              margin:
                                "8px 0 4px",
                            }}
                          >
                            {
                              address.first_name
                            }{" "}
                            {
                              address.last_name
                            }
                          </p>

                          <p
                            style={{
                              color:
                                "#64748b",
                              lineHeight:
                                1.5,
                              margin:
                                "4px 0",
                            }}
                          >
                            {address.neighborhood
                              ? `${address.neighborhood}, `
                              : ""}

                            {
                              address.address_line
                            }
                          </p>

                          <p
                            style={{
                              color:
                                "#64748b",
                              margin:
                                "4px 0",
                            }}
                          >
                            {
                              address.district
                            }{" "}
                            /{" "}
                            {
                              address.city
                            }
                          </p>

                          <p
                            style={{
                              color:
                                "#64748b",
                              margin:
                                "4px 0",
                            }}
                          >
                            {
                              address.phone
                            }
                          </p>
                        </div>
                      </label>
                    );
                  }
                )}
              </div>
            ) : (
              <div
                style={{
                  marginTop: "20px",
                  padding: "22px",
                  background:
                    "#fff7ed",
                  color: "#9a3412",
                  borderRadius:
                    "10px",
                }}
              >
                <strong>
                  Kayıtlı adresiniz
                  bulunmuyor.
                </strong>

                <p>
                  Sipariş verebilmek
                  için önce teslimat
                  adresi ekleyin.
                </p>

                <Link
                  href="/hesabim/adresler"
                  className="primary"
                >
                  ADRES EKLE
                </Link>
              </div>
            )}
          </div>

          <div
            style={{
              ...cardStyle,
              marginTop: "20px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Ödeme Yöntemi
            </h2>

            <div
              style={{
                display: "grid",
                gap: "12px",
                marginTop: "18px",
              }}
            >
              <label style={paymentStyle}>
                <input
                  type="radio"
                  name="payment"
                  value="Havale / EFT"
                  checked={
                    paymentMethod ===
                    "Havale / EFT"
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                />

                <div>
                  <strong>
                    🏦 Havale / EFT
                  </strong>

                  <small
                    style={{
                      display: "block",
                      color: "#64748b",
                      marginTop: "5px",
                    }}
                  >
                    Sipariş sonrası
                    banka bilgilerimiz
                    gösterilecektir.
                  </small>
                </div>
              </label>

              <label style={paymentStyle}>
                <input
                  type="radio"
                  name="payment"
                  value="B2B Cari Hesap"
                  checked={
                    paymentMethod ===
                    "B2B Cari Hesap"
                  }
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target.value
                    )
                  }
                />

                <div>
                  <strong>
                    🧾 B2B Cari Hesap
                  </strong>

                  <small
                    style={{
                      display: "block",
                      color: "#64748b",
                      marginTop: "5px",
                    }}
                  >
                    Onaylı kurumsal
                    müşteriler için.
                  </small>
                </div>
              </label>

              <div
                style={{
                  padding: "15px",
                  borderRadius:
                    "9px",
                  background:
                    "#f8fafc",
                  border:
                    "1px dashed #cbd5e1",
                }}
              >
                <strong>
                  💳 Kredi Kartı
                </strong>

                <p
                  style={{
                    color: "#64748b",
                    marginBottom: 0,
                  }}
                >
                  Kredi kartı ödeme
                  sistemi sonraki
                  aşamada PayTR veya
                  iyzico ile
                  bağlanacaktır.
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside style={cardStyle}>
          <h2
            style={{
              marginTop: 0,
            }}
          >
            Sipariş Özeti
          </h2>

          <div
            style={{
              display: "grid",
              gap: "13px",
              marginTop: "20px",
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "54px minmax(0,1fr) auto",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <img
                  src={
                    item.image ||
                    "/opar-filtre-banner.png"
                  }
                  alt={item.name}
                  style={{
                    width: "54px",
                    height: "54px",
                    objectFit:
                      "contain",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius:
                      "7px",
                  }}
                />

                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize:
                        "13px",
                    }}
                  >
                    {item.name}
                  </strong>

                  <small
                    style={{
                      color:
                        "#64748b",
                    }}
                  >
                    {item.qty} adet
                  </small>
                </div>

                <strong
                  style={{
                    fontSize: "13px",
                  }}
                >
                  {formatMoney(
                    Number(
                      item.price || 0
                    ) * item.qty
                  )}{" "}
                  TL
                </strong>
              </div>
            ))}
          </div>

          <hr
            style={{
              border: 0,
              borderTop:
                "1px solid #e2e8f0",
              margin: "22px 0",
            }}
          />

          <p style={summaryRow}>
            <span>
              Ara Toplam
            </span>

            <b>
              {formatMoney(total)} TL
            </b>
          </p>

          <p style={summaryRow}>
            <span>
              Kargo
            </span>

            <b>
              {shipping === 0
                ? "Ücretsiz"
                : `${formatMoney(
                    shipping
                  )} TL`}
            </b>
          </p>

          <p
            style={{
              ...summaryRow,
              fontSize: "20px",
              paddingTop: "12px",
              borderTop:
                "1px solid #e2e8f0",
            }}
          >
            <span>
              Toplam
            </span>

            <b>
              {formatMoney(
                grandTotal
              )}{" "}
              TL
            </b>
          </p>

          {error ? (
            <div
              style={{
                padding: "12px",
                margin: "15px 0",
                background:
                  "#fee2e2",
                color: "#991b1b",
                borderRadius: "8px",
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="button"
            className="primary"
            disabled={
              creatingOrder ||
              !items.length ||
              !selectedAddress
            }
            onClick={() =>
              void createOrder()
            }
            style={{
              width: "100%",
              marginTop: "15px",
              opacity:
                creatingOrder ||
                !items.length ||
                !selectedAddress
                  ? 0.55
                  : 1,
            }}
          >
            {creatingOrder
              ? "SİPARİŞ OLUŞTURULUYOR..."
              : "SİPARİŞİ TAMAMLA"}
          </button>

          <p
            style={{
              color: "#64748b",
              fontSize: "12px",
              lineHeight: 1.5,
              marginTop: "13px",
            }}
          >
            Siparişi tamamlayarak
            mesafeli satış ve ön
            bilgilendirme koşullarını
            kabul etmiş olursunuz.
          </p>
        </aside>
      </main>
    </>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "24px",
  background: "#ffffff",
};

const paymentStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0,1fr)",
  gap: "12px",
  alignItems: "start",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  padding: "15px",
  cursor: "pointer",
};

const summaryRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "15px",
};

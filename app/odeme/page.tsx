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

type PaymentMethod =
  | "Kredi Kartı"
  | "Havale / EFT"
  | "B2B Cari Hesap";

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

  const randomPart = Math.floor(
    100000 + Math.random() * 900000
  );

  return `TO-${datePart}-${randomPart}`;
}

export default function CheckoutPage() {
  const router = useRouter();

  const { items, total, clear } = useCart();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("Kredi Kartı");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const shipping =
    total === 0 || total >= 1500 ? 0 : 99.9;

  const grandTotal = total + shipping;

  const selectedAddress = useMemo(
    () =>
      addresses.find(
        (address) => address.id === selectedAddressId
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
      setEmail(user.email || "");

      const { data, error } = await supabase
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
          (address) => address.is_default
        );

      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (loadedAddresses.length > 0) {
        setSelectedAddressId(
          loadedAddresses[0].id
        );
      }

      setLoading(false);
    }

    void loadCheckout();
  }, [router]);

  async function startIyzicoPayment() {
    if (!selectedAddress) {
      throw new Error(
        "Teslimat adresi seçmelisiniz."
      );
    }

    const response = await fetch(
      "/api/iyzico/initialize",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          email,
          address: {
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
            address_line:
              selectedAddress.address_line,
            postal_code:
              selectedAddress.postal_code,
          },
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            oem: item.oem,
            price: Number(item.price || 0),
            qty: item.qty,
          })),
        }),
      }
    );

    const text = await response.text();

    let result: {
      success?: boolean;
      paymentPageUrl?: string;
      checkoutFormContent?: string;
      token?: string;
      error?: string;
      errorCode?: string | null;
    };

    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(
        `iyzico geçersiz cevap verdi. HTTP ${response.status}`
      );
    }

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ||
          "iyzico ödeme ekranı açılamadı."
      );
    }

    if (result.paymentPageUrl) {
      window.location.href =
        result.paymentPageUrl;
      return;
    }

    if (result.checkoutFormContent) {
      const paymentWindow =
        window.open("", "_self");

      if (!paymentWindow) {
        throw new Error(
          "Ödeme ekranı açılamadı."
        );
      }

      paymentWindow.document.open();
      paymentWindow.document.write(
        result.checkoutFormContent
      );
      paymentWindow.document.close();
      return;
    }

    throw new Error(
      "iyzico ödeme bağlantısı döndürmedi."
    );
  }

  async function createOfflineOrder() {
    if (!selectedAddress) {
      throw new Error(
        "Teslimat adresi seçmelisiniz."
      );
    }

    const orderNo = createOrderNo();

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
        status:
          paymentMethod === "Havale / EFT"
            ? "Ödeme Bekleniyor"
            : "Yeni",
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

    const { error: itemsError } =
      await supabase
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
  }

  async function handleCheckout() {
    if (!userId) {
      router.push("/giris");
      return;
    }

    if (!items.length) {
      setError("Sepetiniz boş.");
      return;
    }

    if (!selectedAddress) {
      setError(
        "Siparişi tamamlamak için teslimat adresi seçmelisiniz."
      );
      return;
    }

    try {
      setProcessing(true);
      setError("");

      if (
        paymentMethod === "Kredi Kartı"
      ) {
        await startIyzicoPayment();
        return;
      }

      await createOfflineOrder();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "İşlem tamamlanamadı."
      );
    } finally {
      setProcessing(false);
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
                flexWrap: "wrap",
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
                        key={address.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "auto minmax(0,1fr)",
                          gap: "13px",
                          border: selected
                            ? "2px solid #c90020"
                            : "1px solid #e2e8f0",
                          borderRadius:
                            "10px",
                          padding: "16px",
                          cursor: "pointer",
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
                          <strong>
                            {address.title}
                          </strong>

                          <p>
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
                  Önce teslimat adresi
                  ekleyin.
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
              <label
                style={
                  paymentMethod ===
                  "Kredi Kartı"
                    ? selectedPaymentStyle
                    : paymentStyle
                }
              >
                <input
                  type="radio"
                  name="payment"
                  value="Kredi Kartı"
                  checked={
                    paymentMethod ===
                    "Kredi Kartı"
                  }
                  onChange={() =>
                    setPaymentMethod(
                      "Kredi Kartı"
                    )
                  }
                />

                <div>
                  <strong>
                    💳 Kredi / Banka Kartı
                  </strong>

                  <small
                    style={{
                      display: "block",
                      color: "#64748b",
                      marginTop: "5px",
                    }}
                  >
                    iyzico Sandbox güvenli
                    ödeme ekranına
                    yönlendirileceksiniz.
                  </small>
                </div>
              </label>

              <label
                style={
                  paymentMethod ===
                  "Havale / EFT"
                    ? selectedPaymentStyle
                    : paymentStyle
                }
              >
                <input
                  type="radio"
                  name="payment"
                  value="Havale / EFT"
                  checked={
                    paymentMethod ===
                    "Havale / EFT"
                  }
                  onChange={() =>
                    setPaymentMethod(
                      "Havale / EFT"
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
                    Sipariş ödeme bekliyor
                    olarak oluşturulur.
                  </small>
                </div>
              </label>

              <label
                style={
                  paymentMethod ===
                  "B2B Cari Hesap"
                    ? selectedPaymentStyle
                    : paymentStyle
                }
              >
                <input
                  type="radio"
                  name="payment"
                  value="B2B Cari Hesap"
                  checked={
                    paymentMethod ===
                    "B2B Cari Hesap"
                  }
                  onChange={() =>
                    setPaymentMethod(
                      "B2B Cari Hesap"
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
                    objectFit: "contain",
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "7px",
                  }}
                />

                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "13px",
                    }}
                  >
                    {item.name}
                  </strong>

                  <small
                    style={{
                      color: "#64748b",
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
            <span>Ara Toplam</span>
            <b>
              {formatMoney(total)} TL
            </b>
          </p>

          <p style={summaryRow}>
            <span>Kargo</span>

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
            <span>Toplam</span>

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
                background: "#fee2e2",
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
              processing ||
              !items.length ||
              !selectedAddress
            }
            onClick={() =>
              void handleCheckout()
            }
            style={{
              width: "100%",
              marginTop: "15px",
              opacity:
                processing ||
                !items.length ||
                !selectedAddress
                  ? 0.55
                  : 1,
            }}
          >
            {processing
              ? "İŞLEM BAŞLATILIYOR..."
              : paymentMethod ===
                  "Kredi Kartı"
                ? "IYZICO İLE ÖDE"
                : "SİPARİŞİ TAMAMLA"}
          </button>

          {paymentMethod ===
          "Kredi Kartı" ? (
            <p
              style={{
                marginTop: "12px",
                fontSize: "12px",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Şu an Sandbox/test
              ortamındasınız. Gerçek
              para çekilmez.
            </p>
          ) : null}
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
  gridTemplateColumns:
    "auto minmax(0,1fr)",
  gap: "12px",
  alignItems: "start",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  padding: "15px",
  cursor: "pointer",
};

const selectedPaymentStyle: React.CSSProperties = {
  ...paymentStyle,
  border: "2px solid #c90020",
  background: "#fff7f8",
};

const summaryRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "15px",
};

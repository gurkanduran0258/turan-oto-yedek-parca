"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function OrderSuccessContent() {
  const searchParams = useSearchParams();

  const orderNo =
    searchParams.get("order") ||
    searchParams.get("basketId") ||
    "-";

  const paymentId =
    searchParams.get("paymentId");

  return (
    <main
      className="container"
      style={{
        padding: "80px 20px",
        minHeight: "60vh",
      }}
    >
      <section
        style={{
          maxWidth: "650px",
          margin: "0 auto",
          padding: "40px",
          textAlign: "center",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
            background: "#dcfce7",
            color: "#166534",
            fontSize: "34px",
            fontWeight: 900,
          }}
        >
          ✓
        </div>

        <h1
          style={{
            marginBottom: "10px",
          }}
        >
          Siparişiniz Alındı
        </h1>

        <p
          style={{
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          İşleminiz başarıyla tamamlandı.
        </p>

        <div
          style={{
            margin: "22px 0",
            padding: "17px",
            background: "#f8fafc",
            borderRadius: "9px",
          }}
        >
          <small
            style={{
              color: "#64748b",
            }}
          >
            Sipariş / Sepet Numaranız
          </small>

          <strong
            style={{
              display: "block",
              marginTop: "6px",
              fontSize: "20px",
            }}
          >
            {orderNo}
          </strong>

          {paymentId ? (
            <small
              style={{
                display: "block",
                marginTop: "8px",
                color: "#64748b",
              }}
            >
              Ödeme ID: {paymentId}
            </small>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/hesabim/siparisler"
            className="primary"
          >
            SİPARİŞLERİM
          </Link>

          <Link
            href="/urunler"
            style={{
              padding: "12px 16px",
              border: "1px solid #cbd5e1",
              borderRadius: "7px",
              color: "#0f172a",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ALIŞVERİŞE DEVAM ET
          </Link>
        </div>
      </section>
    </main>
  );
}

function Loading() {
  return (
    <main
      className="container"
      style={{
        padding: "80px 20px",
        minHeight: "60vh",
        textAlign: "center",
      }}
    >
      Sipariş bilgileri yükleniyor...
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrderSuccessContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CartPage() {
  const {
    items,
    remove,
    setQty,
    total,
  } = useCart();

  const shipping =
    total === 0 || total >= 1500
      ? 0
      : 99.9;

  const grandTotal =
    total + shipping;

  return (
    <>
      <section className="pageTitle">
        <div className="container">
          <h1>Sepetim</h1>
        </div>
      </section>

      <main className="container cartLayout">
        <section className="cartTable">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                className="cartRow"
                key={item.id}
              >
                <Link
                  href={`/urun/${item.id}`}
                >
                  <img
                    src={
                      item.image ||
                      "/opar-filtre-banner.png"
                    }
                    alt={item.name}
                  />
                </Link>

                <div>
                  <Link
                    href={`/urun/${item.id}`}
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                    }}
                  >
                    <b>
                      {item.name}
                    </b>
                  </Link>

                  <small>
                    OEM: {item.oem}
                  </small>
                </div>

                <input
                  type="number"
                  min={1}
                  max={Math.max(
                    1,
                    Number(item.stock || 1)
                  )}
                  value={item.qty}
                  onChange={(event) => {
                    const quantity =
                      Number(
                        event.target.value
                      );

                    setQty(
                      item.id,
                      Number.isFinite(
                        quantity
                      )
                        ? Math.max(
                            1,
                            quantity
                          )
                        : 1
                    );
                  }}
                />

                <strong>
                  {formatMoney(
                    Number(
                      item.price || 0
                    ) * item.qty
                  )}{" "}
                  TL
                </strong>

                <button
                  type="button"
                  onClick={() =>
                    remove(item.id)
                  }
                >
                  Sil
                </button>
              </div>
            ))
          ) : (
            <div className="empty">
              <p>
                Sepetiniz boş.
              </p>

              <Link
                href="/urunler"
                className="primary"
              >
                ALIŞVERİŞE DEVAM ET
              </Link>
            </div>
          )}
        </section>

        <aside className="summary">
          <h3>
            Sipariş Özeti
          </h3>

          <p>
            <span>
              Ara Toplam
            </span>

            <b>
              {formatMoney(total)} TL
            </b>
          </p>

          <p>
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

          <p className="grand">
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

          {items.length > 0 ? (
            <Link
              href="/odeme"
              className="primary"
            >
              ÖDEMEYE GEÇ
            </Link>
          ) : null}
        </aside>
      </main>
    </>
  );
}

"use client";

import {
  useMemo,
  useState,
} from "react";

type Supplier = {
  id: number;
  name: string;
};

type Row = {
  product_code: string;
  quantity: number;
  purchase_price: number;
  vat: number;
  profit_margin: number;
};

const num = (value: unknown) =>
  Number.isFinite(Number(value))
    ? Number(value)
    : 0;

const money = (value: number) =>
  num(value).toLocaleString(
    "tr-TR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

export default function CostManager({
  suppliers,
  defaultMargin,
}: {
  suppliers: Supplier[];
  defaultMargin: number;
}) {
  const [receiptNo, setReceiptNo] =
    useState("");

  const [
    supplierId,
    setSupplierId,
  ] = useState("");

  const [shipping, setShipping] =
    useState(0);

  const [extra, setExtra] =
    useState(0);

  const [message, setMessage] =
    useState("");

  const [rows, setRows] = useState<
    Row[]
  >([
    {
      product_code: "",
      quantity: 1,
      purchase_price: 0,
      vat: 20,
      profit_margin:
        defaultMargin,
    },
  ]);

  const calc = useMemo(() => {
    const net = rows.reduce(
      (sum, row) =>
        sum +
        num(row.quantity) *
          num(
            row.purchase_price
          ),
      0
    );

    const costs =
      num(shipping) +
      num(extra);

    return rows.map((row) => {
      const line =
        num(row.quantity) *
        num(
          row.purchase_price
        );

      const allocated =
        net > 0
          ? costs *
            (line / net)
          : 0;

      const unit =
        (line + allocated) /
        Math.max(
          1,
          num(row.quantity)
        );

      const sale =
        unit *
        (1 +
          num(
            row.profit_margin
          ) /
            100) *
        (1 +
          num(row.vat) /
            100);

      return {
        allocated,
        unit,
        sale,
      };
    });
  }, [
    rows,
    shipping,
    extra,
  ]);

  function update(
    index: number,
    patch: Partial<Row>
  ) {
    setRows((current) =>
      current.map(
        (row, rowIndex) =>
          rowIndex === index
            ? {
                ...row,
                ...patch,
              }
            : row
      )
    );
  }

  async function save() {
    setMessage("");

    const response = await fetch(
      "/api/admin/maliyet",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          receiptNo,
          supplierId:
            supplierId
              ? Number(
                  supplierId
                )
              : null,
          shippingCost:
            shipping,
          extraCost: extra,
          items: rows,
        }),
      }
    );

    const result =
      await response.json();

    setMessage(
      response.ok
        ? `Kaydedildi. ${result.updatedProducts} ürün stoğa işlendi.`
        : result.error || "Hata"
    );

    if (response.ok) {
      setTimeout(
        () =>
          location.reload(),
        800
      );
    }
  }

  return (
    <>
      <div style={box}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1.2fr 1.5fr 1fr 1fr",
            gap: 8,
          }}
        >
          <input
            placeholder="İrsaliye No"
            value={receiptNo}
            onChange={(event) =>
              setReceiptNo(
                event.target.value
              )
            }
          />

          <select
            value={supplierId}
            onChange={(event) =>
              setSupplierId(
                event.target.value
              )
            }
          >
            <option value="">
              Tedarikçi seç
            </option>

            {suppliers.map(
              (supplier) => (
                <option
                  key={supplier.id}
                  value={
                    supplier.id
                  }
                >
                  {
                    supplier.name
                  }
                </option>
              )
            )}
          </select>

          <input
            type="number"
            value={shipping}
            onChange={(event) =>
              setShipping(
                num(
                  event.target
                    .value
                )
              )
            }
            placeholder="Kargo"
          />

          <input
            type="number"
            value={extra}
            onChange={(event) =>
              setExtra(
                num(
                  event.target
                    .value
                )
              )
            }
            placeholder="Ek masraf"
          />
        </div>
      </div>

      <div
        style={{
          ...box,
          marginTop: 12,
          overflow: "auto",
        }}
      >
        <button
          onClick={() =>
            setRows(
              (current) => [
                ...current,
                {
                  product_code:
                    "",
                  quantity: 1,
                  purchase_price:
                    0,
                  vat: 20,
                  profit_margin:
                    defaultMargin,
                },
              ]
            )
          }
        >
          + Satır Ekle
        </button>

        <table
          style={{
            width: "100%",
            minWidth: 900,
            borderCollapse:
              "collapse",
            marginTop: 10,
          }}
        >
          <thead>
            <tr>
              <th>OEM</th>
              <th>Adet</th>
              <th>Alış</th>
              <th>KDV</th>
              <th>Kâr</th>
              <th>Masraf Payı</th>
              <th>Gerçek Maliyet</th>
              <th>Önerilen Satış</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      value={
                        row.product_code
                      }
                      onChange={(
                        event
                      ) =>
                        update(
                          index,
                          {
                            product_code:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={
                        row.quantity
                      }
                      onChange={(
                        event
                      ) =>
                        update(
                          index,
                          {
                            quantity:
                              Math.max(
                                1,
                                num(
                                  event
                                    .target
                                    .value
                                )
                              ),
                          }
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={
                        row.purchase_price
                      }
                      onChange={(
                        event
                      ) =>
                        update(
                          index,
                          {
                            purchase_price:
                              num(
                                event
                                  .target
                                  .value
                              ),
                          }
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={
                        row.vat
                      }
                      onChange={(
                        event
                      ) =>
                        update(
                          index,
                          {
                            vat: num(
                              event
                                .target
                                .value
                            ),
                          }
                        )
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={
                        row.profit_margin
                      }
                      onChange={(
                        event
                      ) =>
                        update(
                          index,
                          {
                            profit_margin:
                              num(
                                event
                                  .target
                                  .value
                              ),
                          }
                        )
                      }
                    />
                  </td>

                  <td>
                    {money(
                      calc[index]
                        ?.allocated ||
                        0
                    )}{" "}
                    TL
                  </td>

                  <td>
                    <b>
                      {money(
                        calc[index]
                          ?.unit ||
                          0
                      )}{" "}
                      TL
                    </b>
                  </td>

                  <td>
                    <b
                      style={{
                        color:
                          "#166534",
                      }}
                    >
                      {money(
                        calc[index]
                          ?.sale ||
                          0
                      )}{" "}
                      TL
                    </b>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {message ? (
        <div
          style={{
            marginTop: 10,
            fontWeight: 800,
          }}
        >
          {message}
        </div>
      ) : null}

      <button
        onClick={() =>
          void save()
        }
        style={{
          marginTop: 12,
          background: "#c90020",
          color: "#fff",
          padding: "11px 14px",
          border: 0,
          borderRadius: 8,
          fontWeight: 900,
        }}
      >
        İRSALİYEYİ KAYDET VE
        STOĞA İŞLE
      </button>
    </>
  );
}

const box: React.CSSProperties = {
  background: "#fff",
  border:
    "1px solid #e2e8f0",
  borderRadius: 11,
  padding: 14,
};

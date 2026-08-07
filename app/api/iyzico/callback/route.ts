import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENDPOINT =
  "/payment/iyzipos/checkoutform/auth/ecom/detail";

function createAuthorization(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  bodyText: string
) {
  const randomKey = `${Date.now()}${Math.floor(
    Math.random() * 1_000_000_000
  )}`;

  const signature = createHmac(
    "sha256",
    secretKey
  )
    .update(
      randomKey + uriPath + bodyText,
      "utf8"
    )
    .digest("hex");

  const authorizationString =
    `apiKey:${apiKey}` +
    `&randomKey:${randomKey}` +
    `&signature:${signature}`;

  return {
    authorization:
      "IYZWSv2 " +
      Buffer.from(
        authorizationString,
        "utf8"
      ).toString("base64"),

    randomKey,
  };
}

function getSiteUrl(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const url = new URL(request.url);

  return `${url.protocol}//${url.host}`;
}

function createOrderNo() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `TO-${year}${month}${day}-${random}`;
}

export async function POST(request: Request) {
  const siteUrl = getSiteUrl(request);

  try {
    /*
     * ENVIRONMENT VARIABLES
     */
    const apiKey =
      process.env.IYZICO_API_KEY?.trim();

    const secretKey =
      process.env.IYZICO_SECRET_KEY?.trim();

    const baseUrl =
      process.env.IYZICO_BASE_URL?.trim();

    if (!apiKey || !secretKey || !baseUrl) {
      console.error(
        "iyzico environment variable eksik."
      );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=config-error`,
        303
      );
    }

    /*
     * IYZICO CALLBACK'TEN TOKEN AL
     */
    const formData =
      await request.formData();

    const token = String(
      formData.get("token") || ""
    ).trim();

    if (!token) {
      console.error(
        "iyzico callback token bulunamadı."
      );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=token-yok`,
        303
      );
    }

    /*
     * IYZICO ÖDEME SONUCUNU
     * SUNUCU TARAFINDA TEKRAR DOĞRULA
     */
    const retrieveBody = {
      locale: "tr",
      token,
    };

    const bodyText =
      JSON.stringify(retrieveBody);

    const {
      authorization,
      randomKey,
    } = createAuthorization(
      apiKey,
      secretKey,
      ENDPOINT,
      bodyText
    );

    const response = await fetch(
      `${baseUrl.replace(
        /\/$/,
        ""
      )}${ENDPOINT}`,
      {
        method: "POST",

        headers: {
          Authorization: authorization,

          "x-iyzi-rnd":
            randomKey,

          "Content-Type":
            "application/json",
        },

        body: bodyText,

        cache: "no-store",
      }
    );

    const result = await response.json();

    console.log(
      "iyzico ödeme sonucu:",
      {
        status: result.status,
        paymentStatus:
          result.paymentStatus,
        paymentId:
          result.paymentId,
        basketId:
          result.basketId,
      }
    );

    /*
     * ÖDEME GERÇEKTEN BAŞARILI MI?
     */
    const paid =
      response.ok &&
      result.status === "success" &&
      result.paymentStatus ===
        "SUCCESS" &&
      Number(result.fraudStatus) === 1;

    if (!paid) {
      const message =
        encodeURIComponent(
          result.errorMessage ||
            "Ödeme onaylanmadı."
        );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=failed&message=${message}`,
        303
      );
    }

    /*
     * SUPABASE ADMIN
     */
    const supabase =
      getSupabaseAdmin();

    /*
     * ÖDEME BAŞLATILIRKEN
     * KAYDETTİĞİMİZ CHECKOUT SESSION
     */
    const {
      data: checkout,
      error: checkoutError,
    } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (checkoutError) {
      console.error(
        "Checkout session hatası:",
        checkoutError
      );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=checkout-error`,
        303
      );
    }

    if (!checkout) {
      console.error(
        "Checkout session bulunamadı."
      );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=checkout-yok`,
        303
      );
    }

    /*
     * BASKET ID KONTROLÜ
     */
    if (
      result.basketId &&
      checkout.basket_id &&
      String(result.basketId) !==
        String(checkout.basket_id)
    ) {
      console.error(
        "Basket ID uyuşmuyor.",
        {
          iyzico:
            result.basketId,
          checkout:
            checkout.basket_id,
        }
      );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=basket-error`,
        303
      );
    }

    /*
     * AYNI CALLBACK İKİ KEZ GELİRSE
     * İKİNCİ SİPARİŞ OLUŞTURMA.
     */
    if (
      checkout.status === "paid" &&
      checkout.order_id
    ) {
      const {
        data: existingOrder,
      } = await supabase
        .from("orders")
        .select(
          "id,order_no"
        )
        .eq(
          "id",
          checkout.order_id
        )
        .maybeSingle();

      if (existingOrder) {
        return NextResponse.redirect(
          `${siteUrl}/siparis-basarili?order=${encodeURIComponent(
            existingOrder.order_no
          )}&paymentId=${encodeURIComponent(
            String(
              result.paymentId || ""
            )
          )}`,
          303
        );
      }
    }

    /*
     * CHECKOUT ITEMS
     */
    const checkoutItems =
      Array.isArray(checkout.items)
        ? checkout.items
        : [];

    if (
      checkoutItems.length === 0
    ) {
      console.error(
        "Checkout ürünleri bulunamadı."
      );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=items-yok`,
        303
      );
    }

    /*
     * SİPARİŞ NUMARASI
     */
    const orderNo =
      createOrderNo();

    /*
     * ORDERS TABLOSUNA SİPARİŞİ EKLE
     */
    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .insert({
        user_id:
          checkout.user_id,

        order_no:
          orderNo,

        status:
          "Ödendi",

        subtotal:
          Number(
            checkout.subtotal || 0
          ),

        shipping:
          Number(
            checkout.shipping || 0
          ),

        total:
          Number(
            checkout.total || 0
          ),

        payment_method:
          "Kredi Kartı / iyzico",

        address_snapshot:
          checkout.address_snapshot,
      })
      .select(
        "id,order_no"
      )
      .single();

    if (orderError || !order) {
      console.error(
        "Sipariş oluşturulamadı:",
        orderError
      );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=order-error`,
        303
      );
    }

    /*
     * ORDER_ITEMS HAZIRLA
     */
    const orderItems =
      checkoutItems.map(
        (item: any) => {
          const quantity =
            Math.max(
              1,
              Number(
                item.qty || 1
              )
            );

          const price =
            Number(
              item.price || 0
            );

          return {
            order_id:
              order.id,

            product_id:
              Number(item.id),

            product_code:
              item.oem || null,

            product_name:
              item.name ||
              "Ürün",

            image_url:
              item.image ||
              null,

            unit_price:
              price,

            quantity,

            line_total:
              Number(
                (
                  price *
                  quantity
                ).toFixed(2)
              ),
          };
        }
      );

    /*
     * ORDER_ITEMS TABLOSUNA YAZ
     */
    const {
      error: itemError,
    } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemError) {
      console.error(
        "Sipariş ürünleri eklenemedi:",
        itemError
      );

      /*
       * YARIM OLUŞAN SİPARİŞİ SİL.
       */
      await supabase
        .from("orders")
        .delete()
        .eq(
          "id",
          order.id
        );

      return NextResponse.redirect(
        `${siteUrl}/odeme?iyzico=items-error`,
        303
      );
    }

    /*
     * =====================================
     * STOK DÜŞÜRME
     * =====================================
     */
    for (
      const item of checkoutItems
    ) {
      const productId =
        Number(item.id);

      const quantity =
        Math.max(
          1,
          Number(
            item.qty || 1
          )
        );

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {
        console.error(
          "Geçersiz product id:",
          item.id
        );

        continue;
      }

      /*
       * MEVCUT STOK
       */
      const {
        data: product,
        error: productError,
      } = await supabase
        .from("products")
        .select(
          "id,product_code,product_name,stock"
        )
        .eq(
          "id",
          productId
        )
        .maybeSingle();

      if (
        productError ||
        !product
      ) {
        console.error(
          "Stok ürünü bulunamadı:",
          productId,
          productError
        );

        continue;
      }

      const currentStock =
        Number(
          product.stock || 0
        );

      /*
       * STOK 0'IN ALTINA DÜŞMESİN
       */
      const newStock =
        Math.max(
          0,
          currentStock -
            quantity
        );

      /*
       * PRODUCTS TABLOSUNU GÜNCELLE
       */
      const {
        error: stockError,
      } = await supabase
        .from("products")
        .update({
          stock:
            newStock,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          productId
        );

      if (stockError) {
        console.error(
          "Stok güncellenemedi:",
          productId,
          stockError
        );
      } else {
        console.log(
          `Stok güncellendi: ${product.product_code} | ${currentStock} -> ${newStock}`
        );
      }
    }

    /*
     * CHECKOUT SESSION'I
     * ÖDENDİ OLARAK İŞARETLE
     */
    const {
      error:
        sessionUpdateError,
    } = await supabase
      .from(
        "checkout_sessions"
      )
      .update({
        status:
          "paid",

        payment_id:
          String(
            result.paymentId ||
              ""
          ),

        order_id:
          order.id,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        checkout.id
      );

    if (
      sessionUpdateError
    ) {
      console.error(
        "Checkout session güncellenemedi:",
        sessionUpdateError
      );
    }

    /*
     * BAŞARILI
     */
    return NextResponse.redirect(
      `${siteUrl}/siparis-basarili?order=${encodeURIComponent(
        order.order_no
      )}&paymentId=${encodeURIComponent(
        String(
          result.paymentId || ""
        )
      )}`,
      303
    );
  } catch (error) {
    console.error(
      "iyzico callback genel hata:",
      error
    );

    return NextResponse.redirect(
      `${siteUrl}/odeme?iyzico=callback-error`,
      303
    );
  }
}

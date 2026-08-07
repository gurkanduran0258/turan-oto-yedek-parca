import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutItem = {
  id: number;
  name: string;
  oem?: string;
  price: number;
  qty: number;
};

type CheckoutBody = {
  userId: string;
  email: string;
  address: {
    first_name: string;
    last_name: string;
    phone: string;
    city: string;
    district: string;
    address_line: string;
    postal_code?: string | null;
  };
  items: CheckoutItem[];
};

const ENDPOINT =
  "/payment/iyzipos/checkoutform/initialize/auth/ecom";

function formatAmount(value: number) {
  return Number(value || 0).toFixed(2);
}

function createAuthorization(
  apiKey: string,
  secretKey: string,
  uriPath: string,
  bodyText: string
) {
  const randomKey = `${Date.now()}${Math.floor(
    Math.random() * 1_000_000_000
  )}`;

  const payload = randomKey + uriPath + bodyText;

  const signature = createHmac("sha256", secretKey)
    .update(payload, "utf8")
    .digest("hex");

  const authorizationString =
    `apiKey:${apiKey}` +
    `&randomKey:${randomKey}` +
    `&signature:${signature}`;

  const encoded = Buffer.from(
    authorizationString,
    "utf8"
  ).toString("base64");

  return {
    authorization: `IYZWSv2 ${encoded}`,
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

function normalizePhone(phone: string) {
  let value = String(phone || "")
    .replace(/[^\d+]/g, "")
    .trim();

  if (value.startsWith("0")) {
    value = `+90${value.slice(1)}`;
  } else if (
    value.startsWith("90") &&
    !value.startsWith("+")
  ) {
    value = `+${value}`;
  }

  return value || "+905000000000";
}

export async function POST(request: Request) {
  try {
    const apiKey =
      process.env.IYZICO_API_KEY?.trim();

    const secretKey =
      process.env.IYZICO_SECRET_KEY?.trim();

    const baseUrl =
      process.env.IYZICO_BASE_URL?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: "IYZICO_API_KEY tanımlı değil." },
        { status: 500 }
      );
    }

    if (!secretKey) {
      return NextResponse.json(
        { error: "IYZICO_SECRET_KEY tanımlı değil." },
        { status: 500 }
      );
    }

    if (!baseUrl) {
      return NextResponse.json(
        { error: "IYZICO_BASE_URL tanımlı değil." },
        { status: 500 }
      );
    }

    const body =
      (await request.json()) as CheckoutBody;

    if (!body.userId || !body.email) {
      return NextResponse.json(
        {
          error:
            "Kullanıcı kimliği ve e-posta zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!body.address) {
      return NextResponse.json(
        { error: "Teslimat adresi bulunamadı." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        { error: "Sepetiniz boş." },
        { status: 400 }
      );
    }

    const subtotal = body.items.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Math.max(1, Number(item.qty || 1)),
      0
    );

    const shipping =
      subtotal === 0 || subtotal >= 1500
        ? 0
        : 99.9;

    const total = subtotal + shipping;

    const conversationId =
      crypto.randomUUID();

    const basketId =
      `TO-${Date.now()}`;

    const basketItems = body.items.map(
      (item) => ({
        id: String(item.id),
        name: String(item.name || "Ürün").slice(
          0,
          100
        ),
        category1: "Oto Yedek Parça",
        category2: String(
          item.oem || "Diğer"
        ).slice(0, 100),
        itemType: "PHYSICAL",
        price: Number(
          formatAmount(
            Number(item.price || 0) *
              Math.max(
                1,
                Number(item.qty || 1)
              )
          )
        ),
      })
    );

    if (shipping > 0) {
      basketItems.push({
        id: "shipping",
        name: "Kargo",
        category1: "Kargo",
        category2: "Teslimat",
        itemType: "PHYSICAL",
        price: Number(
          formatAmount(shipping)
        ),
      });
    }

    const siteUrl = getSiteUrl(request);

    const iyzicoBody = {
      locale: "tr",
      conversationId,
      price: Number(formatAmount(total)),
      paidPrice: Number(
        formatAmount(total)
      ),
      currency: "TRY",
      basketId,
      paymentGroup: "PRODUCT",
      callbackUrl:
        `${siteUrl}/api/iyzico/callback`,
      enabledInstallments: [
        1, 2, 3, 6, 9,
      ],
      paymentSource: "TuranOtoWeb",
      buyer: {
        id: body.userId,
        name:
          body.address.first_name ||
          "Turan",
        surname:
          body.address.last_name ||
          "Oto",
        identityNumber: "11111111111",
        email: body.email,
        gsmNumber: normalizePhone(
          body.address.phone
        ),
        registrationAddress:
          body.address.address_line,
        ip:
          request.headers
            .get("x-forwarded-for")
            ?.split(",")[0]
            ?.trim() || "127.0.0.1",
        city:
          body.address.city ||
          "Istanbul",
        country: "Turkey",
        zipCode:
          body.address.postal_code ||
          "34000",
      },
      shippingAddress: {
        contactName:
          `${body.address.first_name} ${body.address.last_name}`.trim(),
        city:
          body.address.city ||
          "Istanbul",
        country: "Turkey",
        address:
          `${body.address.address_line} ${body.address.district}`.trim(),
        zipCode:
          body.address.postal_code ||
          "34000",
      },
      billingAddress: {
        contactName:
          `${body.address.first_name} ${body.address.last_name}`.trim(),
        city:
          body.address.city ||
          "Istanbul",
        country: "Turkey",
        address:
          `${body.address.address_line} ${body.address.district}`.trim(),
        zipCode:
          body.address.postal_code ||
          "34000",
      },
      basketItems,
    };

    // İmza hesaplanırken gönderilecek JSON ile birebir aynı
    // string kullanılmalıdır.
    const bodyText =
      JSON.stringify(iyzicoBody);

    const { authorization, randomKey } =
      createAuthorization(
        apiKey,
        secretKey,
        ENDPOINT,
        bodyText
      );

    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}${ENDPOINT}`,
      {
        method: "POST",
        headers: {
          Authorization: authorization,
          "x-iyzi-rnd": randomKey,
          "Content-Type": "application/json",
        },
        body: bodyText,
        cache: "no-store",
      }
    );

    const responseText =
      await response.text();

    let result: any;

    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error:
            "iyzico geçersiz cevap döndürdü.",
          detail:
            responseText.slice(0, 500),
        },
        { status: 502 }
      );
    }

    if (
      !response.ok ||
      result.status !== "success"
    ) {
      return NextResponse.json(
        {
          error:
            result.errorMessage ||
            "iyzico ödeme ekranı oluşturulamadı.",
          errorCode:
            result.errorCode || null,
          conversationId,
        },
        {
          status:
            response.status >= 400
              ? response.status
              : 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      conversationId,
      basketId,
      token: result.token,
      paymentPageUrl:
        result.paymentPageUrl,
      checkoutFormContent:
        result.checkoutFormContent,
    });
  } catch (error) {
    console.error(
      "iyzico initialize hatası:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ödeme başlatılamadı.",
      },
      { status: 500 }
    );
  }
}

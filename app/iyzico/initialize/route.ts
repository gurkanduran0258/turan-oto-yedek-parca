import { NextResponse } from "next/server";
import Iyzipay from "iyzipay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutItem = {
  id: number;
  name: string;
  oem: string;
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
  };

  items: CheckoutItem[];
};

function money(value: number) {
  return Number(value || 0).toFixed(2);
}

function getBaseUrl(request: Request) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const url = new URL(request.url);

  return `${url.protocol}//${url.host}`;
}

export async function POST(request: Request) {
  try {
    const apiKey =
      process.env.IYZICO_API_KEY;

    const secretKey =
      process.env.IYZICO_SECRET_KEY;

    const baseUrl =
      process.env.IYZICO_BASE_URL;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "IYZICO_API_KEY tanımlı değil.",
        },
        {
          status: 500,
        }
      );
    }

    if (!secretKey) {
      return NextResponse.json(
        {
          error:
            "IYZICO_SECRET_KEY tanımlı değil.",
        },
        {
          status: 500,
        }
      );
    }

    if (!baseUrl) {
      return NextResponse.json(
        {
          error:
            "IYZICO_BASE_URL tanımlı değil.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      (await request.json()) as CheckoutBody;

    if (!body.userId) {
      return NextResponse.json(
        {
          error:
            "Kullanıcı bilgisi bulunamadı.",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.email) {
      return NextResponse.json(
        {
          error:
            "E-posta bilgisi bulunamadı.",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.address) {
      return NextResponse.json(
        {
          error:
            "Teslimat adresi bulunamadı.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Sepetiniz boş.",
        },
        {
          status: 400,
        }
      );
    }

    const iyzipay = new Iyzipay({
      apiKey,
      secretKey,
      uri: baseUrl,
    });

    const subtotal =
      body.items.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Number(item.qty || 0),
        0
      );

    const shipping =
      subtotal >= 1500
        ? 0
        : 99.9;

    const total =
      subtotal + shipping;

    const conversationId =
      crypto.randomUUID();

    const basketId =
      `TO-${Date.now()}`;

    const siteUrl =
      getBaseUrl(request);

    const buyerName =
      body.address.first_name ||
      "Turan";

    const buyerSurname =
      body.address.last_name ||
      "Oto";

    const phone =
      body.address.phone
        .replace(/\s/g, "")
        .replace(/^0/, "+90");

    const basketItems = body.items.map(
      (item) => ({
        id: String(item.id),
        name:
          item.name.slice(0, 100),
        category1:
          "Oto Yedek Parça",
        category2:
          item.oem || "Diğer",
        itemType:
          Iyzipay.BASKET_ITEM_TYPE
            .PHYSICAL,

        price: money(
          Number(item.price || 0) *
            Number(item.qty || 0)
        ),
      })
    );

    if (shipping > 0) {
      basketItems.push({
        id: "shipping",
        name: "Kargo",
        category1: "Kargo",
        category2: "Teslimat",
        itemType:
          Iyzipay.BASKET_ITEM_TYPE
            .PHYSICAL,
        price: money(shipping),
      });
    }

    const iyzicoRequest = {
      locale:
        Iyzipay.LOCALE.TR,

      conversationId,

      price:
        money(total),

      paidPrice:
        money(total),

      currency:
        Iyzipay.CURRENCY.TRY,

      basketId,

      paymentGroup:
        Iyzipay.PAYMENT_GROUP
          .PRODUCT,

      callbackUrl:
        `${siteUrl}/api/iyzico/callback`,

      enabledInstallments: [
        1,
        2,
        3,
        6,
        9,
      ],

      buyer: {
        id: body.userId,

        name: buyerName,

        surname: buyerSurname,

        gsmNumber:
          phone || "+905000000000",

        email: body.email,

        identityNumber:
          "11111111111",

        registrationAddress:
          body.address.address_line,

        ip:
          request.headers
            .get("x-forwarded-for")
            ?.split(",")[0]
            ?.trim() ||
          "127.0.0.1",

        city:
          body.address.city,

        country:
          "Turkey",

        zipCode:
          "34000",
      },

      shippingAddress: {
        contactName:
          `${buyerName} ${buyerSurname}`.trim(),

        city:
          body.address.city,

        country:
          "Turkey",

        address:
          `${body.address.address_line} ${body.address.district}`,

        zipCode:
          "34000",
      },

      billingAddress: {
        contactName:
          `${buyerName} ${buyerSurname}`.trim(),

        city:
          body.address.city,

        country:
          "Turkey",

        address:
          `${body.address.address_line} ${body.address.district}`,

        zipCode:
          "34000",
      },

      basketItems,
    };

    const result =
      await new Promise<any>(
        (resolve, reject) => {
          iyzipay.checkoutFormInitialize.create(
            iyzicoRequest,
            (
              error: unknown,
              response: any
            ) => {
              if (error) {
                reject(error);
                return;
              }

              resolve(response);
            }
          );
        }
      );

    if (
      result.status !== "success"
    ) {
      return NextResponse.json(
        {
          error:
            result.errorMessage ||
            "iyzico ödeme ekranı oluşturulamadı.",

          errorCode:
            result.errorCode,

          result,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,

      conversationId,

      basketId,

      token:
        result.token,

      paymentPageUrl:
        result.paymentPageUrl,

      checkoutFormContent:
        result.checkoutFormContent,
    });
  } catch (error) {
    console.error(
      "iyzico initialize:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ödeme başlatılamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * YooKassa payment integration module
 */

interface CreatePaymentParams {
  amount: number;
  description: string;
  userId: string;
  returnUrl: string;
}

interface CreatePaymentResponse {
  id: string;
  status: string;
  confirmation: {
    type: string;
    confirmation_url: string;
  };
}

/**
 * Create a payment in YooKassa
 */
export async function createPayment(params: CreatePaymentParams): Promise<CreatePaymentResponse | null> {
  const shopId = Deno.env.get("YOOKASSA_SHOP_ID_RUTINA") ?? Deno.env.get("YOOKASSA_SHOP_ID");
  const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY_RUTINA") ?? Deno.env.get("YOOKASSA_SECRET_KEY");

  if (!shopId || !secretKey) {
    console.log("YooKassa credentials not configured");
    return null;
  }

  try {
    const idempotenceKey = crypto.randomUUID();

    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        "Authorization": `Basic ${btoa(`${shopId}:${secretKey}`)}`,
      },
      body: JSON.stringify({
        amount: {
          value: params.amount.toFixed(2),
          currency: "RUB",
        },
        confirmation: {
          type: "redirect",
          return_url: params.returnUrl,
        },
        capture: true,
        description: params.description,
        metadata: {
          user_id: params.userId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`YooKassa create payment error: ${response.status} ${error}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log(`YooKassa create payment exception: ${error}`);
    return null;
  }
}

/**
 * Get payment status from YooKassa
 */
export async function getPayment(paymentId: string): Promise<any> {
  const shopId = Deno.env.get("YOOKASSA_SHOP_ID_RUTINA") ?? Deno.env.get("YOOKASSA_SHOP_ID");
  const secretKey = Deno.env.get("YOOKASSA_SECRET_KEY_RUTINA") ?? Deno.env.get("YOOKASSA_SECRET_KEY");

  if (!shopId || !secretKey) {
    console.log("YooKassa credentials not configured");
    return null;
  }

  try {
    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${btoa(`${shopId}:${secretKey}`)}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`YooKassa get payment error: ${response.status} ${error}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.log(`YooKassa get payment exception: ${error}`);
    return null;
  }
}

/**
 * Verify webhook signature (optional, for security)
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  // YooKassa doesn't require webhook signature verification by default
  // You can implement it if needed using a shared secret
  return true;
}

import uuid
import requests
import hmac
import hashlib


# ================== CONFIG ==================

MOMO_ENDPOINT = "https://test-payment.momo.vn/v2/gateway/api/create"

PARTNER_CODE = "MOMO"
ACCESS_KEY = "F8BBA842ECF85"
SECRET_KEY = "K951B6PE1waDMi640xX08PD3vg6EkVlz"

REDIRECT_URL = "http://localhost:5173/cart"
IPN_URL = "https://fondly-husked-tubular.ngrok-free.dev/api/payments/momo/ipn"


# ================== CREATE PAYMENT ==================

def create_momo_payment(amount, order_id):
    """
    amount: int
    order_id: string (map với payment.transaction_id)
    """

    request_id = str(uuid.uuid4())
    order_info = "Thanh toán khóa học"
    extra_data = ""
    request_type = "payWithATM"

    # 🔥 RAW SIGNATURE (GIỮ NGUYÊN FORMAT MOMO)
    raw_signature = (
        "accessKey=" + ACCESS_KEY +
        "&amount=" + str(amount) +
        "&extraData=" + extra_data +
        "&ipnUrl=" + IPN_URL +
        "&orderId=" + order_id +
        "&orderInfo=" + order_info +
        "&partnerCode=" + PARTNER_CODE +
        "&redirectUrl=" + REDIRECT_URL +
        "&requestId=" + request_id +
        "&requestType=" + request_type
    )

    # 🔐 SIGNATURE
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        raw_signature.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    # 📦 PAYLOAD
    payload = {
        "partnerCode": PARTNER_CODE,
        "partnerName": "Elearning",
        "storeId": "ElearningStore",
        "requestId": request_id,
        "amount": str(amount),
        "orderId": order_id,
        "orderInfo": order_info,
        "redirectUrl": REDIRECT_URL,
        "ipnUrl": IPN_URL,
        "lang": "vi",
        "extraData": extra_data,
        "requestType": request_type,
        "signature": signature
    }

    # 🚀 CALL MOMO
    response = requests.post(
        MOMO_ENDPOINT,
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    data = response.json()

    return {
        "payUrl": data.get("payUrl"),
        "orderId": order_id,
        "requestId": request_id,
        "raw": data
    }

def verify_momo_signature(data):
    raw_signature = (
        "accessKey=" + ACCESS_KEY +
        "&amount=" + str(data.get("amount")) +
        "&extraData=" + str(data.get("extraData")) +
        "&message=" + str(data.get("message")) +
        "&orderId=" + str(data.get("orderId")) +
        "&orderInfo=" + str(data.get("orderInfo")) +
        "&orderType=" + str(data.get("orderType")) +
        "&partnerCode=" + str(data.get("partnerCode")) +
        "&payType=" + str(data.get("payType")) +
        "&requestId=" + str(data.get("requestId")) +
        "&responseTime=" + str(data.get("responseTime")) +
        "&resultCode=" + str(data.get("resultCode")) +
        "&transId=" + str(data.get("transId"))
    )

    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        raw_signature.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return signature == data.get("signature")
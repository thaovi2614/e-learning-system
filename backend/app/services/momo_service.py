import json
import uuid
import hmac
import hashlib
import requests

ENDPOINT     = "https://test-payment.momo.vn/v2/gateway/api/create"
PARTNER_CODE = "MOMO"
ACCESS_KEY   = "F8BBA842ECF85"
SECRET_KEY   = "K951B6PE1waDMi640xX08PD3vg6EkVlz"
REDIRECT_URL = "https://arena-italics-shrug.ngrok-free.dev/payment-success"
IPN_URL      = "https://arena-italics-shrug.ngrok-free.dev/api/payments/momo/ipn"


def create_momo_payment(amount, order_id=None, description="Thanh toan khoa hoc"):
    order_id     = str(order_id) if order_id else str(uuid.uuid4())
    request_id   = str(uuid.uuid4())
    request_type = "captureWallet"
    extra_data   = ""

    raw_signature = (
        "accessKey="    + ACCESS_KEY            +
        "&amount="      + str(int(amount))       +
        "&extraData="   + extra_data             +
        "&ipnUrl="      + IPN_URL                +
        "&orderId="     + order_id               +
        "&orderInfo="   + description            +
        "&partnerCode=" + PARTNER_CODE           +
        "&redirectUrl=" + REDIRECT_URL           +
        "&requestId="   + request_id             +
        "&requestType=" + request_type
    )

    h = hmac.new(
        bytes(SECRET_KEY, 'utf-8'),
        bytes(raw_signature, 'utf-8'),
        hashlib.sha256
    )
    signature = h.hexdigest()

    data = {
        "partnerCode": PARTNER_CODE,
        "partnerName": "Test",
        "storeId":     "MomoTestStore",
        "requestId":   request_id,
        "amount":      str(int(amount)),
        "orderId":     order_id,
        "orderInfo":   description,
        "redirectUrl": REDIRECT_URL,
        "ipnUrl":      IPN_URL,
        "lang":        "vi",
        "extraData":   extra_data,
        "requestType": request_type,
        "signature":   signature
    }

    try:
        data_str = json.dumps(data)
        response = requests.post(
            ENDPOINT,
            data=data_str,
            headers={
                "Content-Type":   "application/json",
                "Content-Length": str(len(data_str))
            },
            timeout=20
        )
        result = response.json()
        print("=== MoMo response ===", result)
        return result
    except Exception as e:
        print("=== MoMo error ===", str(e))
        return {"message": "Lỗi khi gọi MoMo", "error": str(e)}
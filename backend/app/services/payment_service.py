import uuid
from app.models.payment import Payment
from app.models.payment_item import PaymentItem
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.enums.payment_status import PaymentStatus
from app.configs.database_config import db
from app.services.momo_service import create_momo_payment, verify_momo_signature
import app.services.payment_item_service as PaymentItemService


def create_payment(user_id, cart):
    # 1. Kiểm tra khóa học tồn tại
    courses = Course.query.filter(Course.id.in_(cart)).all()
    if not courses:
        return {"message": "Không có khóa học nào"}, 404

    # 2. Check đã mua
    owned = Enrollment.query.filter(
        Enrollment.user_id == user_id,
        Enrollment.course_id.in_(cart)
    ).all()

    if owned:
        owned_ids = [e.course_id for e in owned]
        return {"message": f"Đã mua các khóa: {owned_ids}"}, 400

    # 3. Tạo payment PENDING
    total = sum(c.price for c in courses)
    payment = Payment(
        user_id = user_id,
        total_price = total,
        status = PaymentStatus.PENDING,
        method = "MOMO"
    )
    db.session.add(payment)
    db.session.flush()

    # 4. Tạo PaymentItem
    PaymentItemService.create_items(payment.id, courses)
    
    # 5. Gọi MoMo
    momo_res = create_momo_payment(
        amount=int(total),
        order_id=str(uuid.uuid4())
    )
    
    if not momo_res or not momo_res.get("payUrl"):
        payment.status = PaymentStatus.FAILED
        db.session.commit()
        return {"message": "Không tạo được link thanh toán"}, 400

    # 6. Lưu mapping
    payment.transaction_id = momo_res.get("orderId")

    db.session.commit()

    return {
        "payUrl": momo_res.get("payUrl"),
        "paymentId": payment.id
    }, 200


def handle_momo_ipn(data):
    if not verify_momo_signature(data):
        return {"message": "Sai chữ ký MoMo"}, 403

    order_id = data.get("orderId")
    result_code = data.get("resultCode")
    trans_id = data.get("transId")

    if not order_id:
        return {"message": "Thiếu orderId"}, 400

    payment = Payment.query.filter_by(
        transaction_id=order_id
    ).first()

    if not payment:
        return {"message": "Payment không tồn tại"}, 404

    if payment.status == PaymentStatus.SUCCESS:
        return {"message": "Đã xử lý trước đó"}, 200

    # ================= SUCCESS =================
    if str(result_code) == "0":
        payment.status = PaymentStatus.SUCCESS
        payment.gateway_trans_id = str(trans_id) if trans_id else None

        items = PaymentItem.query.filter_by(
            payment_id=payment.id
        ).all()

        for item in items:
            existed = Enrollment.query.filter_by(
                user_id=payment.user_id,
                course_id=item.course_id
            ).first()

            if not existed:
                enrollment = Enrollment(
                    user_id=payment.user_id,
                    course_id=item.course_id,
                )
                db.session.add(enrollment)

    # ================= FAIL =================
    else:
        payment.status = PaymentStatus.FAILED

    db.session.commit()
    return {"message": "OK"}, 200
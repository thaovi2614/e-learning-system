from datetime import datetime

from app.models.payment import Payment
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.configs.database_config import db
from app.services.momo_service import create_momo_payment


def create_payment(user_id, course_id):
    # 1. Kiểm tra khóa học tồn tại
    course = Course.query.get(course_id)
    if not course:
        return {"message": "Khóa học không tồn tại"}, 404

    # 2. Kiểm tra đã mua chưa
    existed_enrollment = Enrollment.query.filter_by(
        user_id=user_id,
        course_id=course_id
    ).first()
    if existed_enrollment:
        return {"message": "Bạn đã mua khóa học này rồi"}, 400

    # 3. Tạo payment PENDING
    payment = Payment(
        user_id=user_id,
        course_id=course_id,
        price=course.price,
        status="PENDING",
        method="MOMO",
        created_at=datetime.utcnow()
    )
    db.session.add(payment)
    db.session.commit()

    # 4. Gọi MoMo tạo QR
    # momo_res = create_momo_payment(
    #     amount=course.price,
    #     order_id=str(payment.id),
    #     description=f"Thanh toan khoa hoc {course.id}"
    # )
    momo_res = create_momo_payment(
    amount=course.price,
    description=f"Thanh toan khoa hoc {course.id}"
    )

    # 5. MoMo lỗi
    if not momo_res or not momo_res.get("payUrl"):
        payment.status = "FAILED"
        db.session.commit()
        return {
            "message": "Không tạo được link thanh toán MoMo",
            "momo_response": momo_res
        }, 400

    # 6. Lưu thông tin MoMo trả về
    payment.order_id   = momo_res.get("orderId")
    payment.request_id = momo_res.get("requestId")
    payment.pay_url    = momo_res.get("payUrl")
    db.session.commit()

    return {
        "message":   "Tạo link thanh toán thành công",
        "payUrl":    payment.pay_url,
        "orderId":   payment.order_id,
        "requestId": payment.request_id,
        "paymentId": payment.id
    }, 200


def handle_momo_ipn(data):
    order_id    = data.get("orderId")
    result_code = data.get("resultCode")
    trans_id    = data.get("transId")

    if not order_id:
        return {"message": "Thiếu orderId"}, 400

    payment = Payment.query.filter_by(order_id=order_id).first()
    if not payment:
        return {"message": "Payment không tồn tại"}, 404

    if payment.status == "SUCCESS":
        return {"message": "Payment đã được xác nhận trước đó"}, 200

    if str(result_code) == "0":
        payment.status         = "SUCCESS"
        payment.transaction_id = str(trans_id) if trans_id else None

        existed = Enrollment.query.filter_by(
            user_id=payment.user_id,
            course_id=payment.course_id
        ).first()

        if not existed:
            enrollment = Enrollment(
                user_id=payment.user_id,
                course_id=payment.course_id,
                status="ACTIVE",
                created_at=datetime.utcnow()
            )
            db.session.add(enrollment)
    else:
        payment.status = "FAILED"

    db.session.commit()
    return {"message": "OK"}, 200
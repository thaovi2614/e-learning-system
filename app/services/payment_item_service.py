from app.models.payment_item import PaymentItem
from app.configs.database_config import db


def create_items(payment_id, courses):
    items = []

    for course in courses:
        item = PaymentItem(
            payment_id=payment_id,
            course_id=course.id,
            price=course.price
        )
        items.append(item)

    db.session.add_all(items)
    return items
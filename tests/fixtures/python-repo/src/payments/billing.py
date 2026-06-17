from .stripe import retry_payment


def charge_invoice(user_id: str, amount: float) -> dict:
    return {"user_id": user_id, "amount": amount, "status": "charged"}


def retry_failed_invoice(invoice_id: str) -> bool:
    return retry_payment(invoice_id)

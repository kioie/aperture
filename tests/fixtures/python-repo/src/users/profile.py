from ..auth.login import validate_credentials


def get_user_profile(user_id: str) -> dict | None:
    if not user_id:
        return None
    return {"id": user_id, "email": f"{user_id}@example.com"}


def update_profile(user_id: str, fields: dict) -> dict:
    if not validate_credentials(user_id):
        raise ValueError("Invalid user")
    return {"id": user_id, **fields}

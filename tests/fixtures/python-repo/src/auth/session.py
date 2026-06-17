def create_session(user: str) -> dict:
    return {"user": user, "token": f"tok_{user}"}

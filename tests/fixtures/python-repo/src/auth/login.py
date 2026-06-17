def login(user: str) -> bool:
    return validate_credentials(user)


def validate_credentials(user: str) -> bool:
    if not user:
        return False
    return len(user) > 2

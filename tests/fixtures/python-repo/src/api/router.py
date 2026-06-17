from ..auth import login, create_session
from ..users.profile import update_profile, get_user_profile
from ..payments import handle_stripe_webhook, validate_webhook_signature, charge_invoice


async def handle_login(req: dict) -> dict:
    ok = login(req["body"]["user"])
    if not ok:
        return {"status": 401, "body": {"error": "Unauthorized"}}
    session = create_session(req["body"]["user"])
    return {"status": 200, "body": session}


async def handle_get_user(req: dict) -> dict:
    profile = get_user_profile(req["params"]["id"])
    if not profile:
        return {"status": 404, "body": {"error": "Not found"}}
    return {"status": 200, "body": profile}


async def handle_webhook(req: dict) -> dict:
    valid = validate_webhook_signature(
        req["body"], req["headers"].get("stripe-signature", ""), "whsec_test"
    )
    if not valid:
        return {"status": 400, "body": {"error": "Invalid signature"}}
    return {"status": 200, "body": {"received": True}}

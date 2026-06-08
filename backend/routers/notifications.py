"""
Routers para notificaciones push PWA.
"""
import os
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pywebpush import webpush, WebPushException

from core.database import get_db
from core.dependencies import get_current_user
from core.models import User, PushSubscription

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS = {"sub": "mailto:soporte@docai.teleredtv.com"}


@router.post("/subscribe")
async def subscribe(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Guarda la suscripción push del usuario."""
    try:
        data = await request.json()
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="JSON inválido")

    endpoint = data.get("endpoint")
    keys = data.get("keys", {})

    if not endpoint or not keys.get("p256dh") or not keys.get("auth"):
        raise HTTPException(status_code=400, detail="Faltan campos de suscripción")

    # Evitar duplicados
    existing = db.query(PushSubscription).filter_by(
        user_id=user.id, endpoint=endpoint
    ).first()

    if existing:
        existing.p256dh = keys["p256dh"]
        existing.auth = keys["auth"]
    else:
        sub = PushSubscription(
            user_id=user.id,
            endpoint=endpoint,
            p256dh=keys["p256dh"],
            auth=keys["auth"],
        )
        db.add(sub)

    db.commit()
    return {"status": "ok", "message": "Suscripción guardada"}


def send_push_notification(user_id: int, title: str, body: str, db: Session):
    """Envía notificación push a todas las suscripciones de un usuario."""
    subscriptions = (
        db.query(PushSubscription)
        .filter_by(user_id=user_id)
        .all()
    )

    if not subscriptions:
        logger.info(f"Usuario {user_id} no tiene suscripciones push")
        return

    payload = json.dumps({
        "title": title,
        "body": body,
        "icon": "/LOGO.png",
        "badge": "/favicon.png",
        "data": {"url": "/"}
    })

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth,
                    },
                },
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS,
            )
        except WebPushException as ex:
            logger.warning(f"Error enviando push a {sub.endpoint}: {ex}")
            if ex.response and ex.response.status_code in (404, 410):
                # Suscripción inválida, eliminarla
                db.delete(sub)

    db.commit()
"""
routers/pagos.py
================
Endpoints de pagos: PayPal, Binance Pay y Pago Móvil.
"""

from datetime import datetime, timezone

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.models import User, Plan, Subscription, BinanceTransaction, TokenPack, PagoMovilTransaction
from core.dependencies import get_current_user
from core.token_service import assign_monthly_tokens, add_extra_tokens
from core.paypal import create_order, capture_order
from core.binance_pay import verify_binance_payment
from core.bcv_scraper import get_bcv_rate
from core.constants import SUBSCRIPTION_PRICES, TOKENS_PER_MONTH_PRO
from core.schemas import (
    SuscripcionRequest, ConfirmarPagoRequest,
    PackRequest, ConfirmarPackRequest,
    VerifyBinanceRequest, ReportPagoMovilRequest,
)

router = APIRouter(prefix="/pago")


# ─── PayPal ───────────────────────────────────────────────

@router.post("/suscripcion")
async def crear_orden_suscripcion(
    data: SuscripcionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.months not in SUBSCRIPTION_PRICES:
        raise HTTPException(status_code=400, detail="Duración no válida. Usa 1, 3, 6 o 12.")

    amount      = SUBSCRIPTION_PRICES[data.months]
    description = f"DocAI Pro — {data.months} mes(es) | {TOKENS_PER_MONTH_PRO} tokens/mes"
    custom_id   = f"sub:{current_user.id}:{data.months}"

    try:
        order = create_order(amount=amount, description=description, custom_id=custom_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error con PayPal: {e}")

    return {
        "status": "success",
        "order_id": order["order_id"],
        "approval_url": order["approval_url"],
        "amount": amount,
        "months": data.months,
    }


@router.post("/confirmar-suscripcion")
async def confirmar_suscripcion(
    data: ConfirmarPagoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = capture_order(data.order_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error capturando pago: {e}")

    if result.get("status") != "COMPLETED":
        raise HTTPException(status_code=402, detail="El pago no fue completado por PayPal.")

    pro_plan = db.query(Plan).filter(Plan.name == "pro").first()
    current_user.plan_id = pro_plan.id

    now = datetime.now(timezone.utc)
    db.add(Subscription(
        user_id=current_user.id,
        paypal_order_id=data.order_id,
        months_paid=data.months,
        tokens_per_month=TOKENS_PER_MONTH_PRO,
        started_at=now,
        ends_at=now + relativedelta(months=data.months),
        status="active",
    ))
    db.commit()
    assign_monthly_tokens(current_user.id, TOKENS_PER_MONTH_PRO, db)

    return {
        "status": "success",
        "message": f"Suscripción Pro activada por {data.months} mes(es).",
        "tokens_assigned": TOKENS_PER_MONTH_PRO,
    }


# ─── Binance Pay ──────────────────────────────────────────

@router.post("/verify-binance")
async def verify_binance(
    data: VerifyBinanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.type == 'subscription':
        if data.item_id not in SUBSCRIPTION_PRICES:
            raise HTTPException(status_code=400, detail="Duración no válida.")
        expected_amount = float(SUBSCRIPTION_PRICES[data.item_id])
    elif data.type == 'pack':
        pack = db.query(TokenPack).filter(TokenPack.id == data.item_id).first()
        if not pack:
            raise HTTPException(status_code=404, detail="Paquete no encontrado.")
        expected_amount = float(pack.price)
    else:
        raise HTTPException(status_code=400, detail="Tipo de pago no válido.")

    if db.query(BinanceTransaction).filter(BinanceTransaction.order_id == data.order_id).first():
        raise HTTPException(status_code=400, detail="Este comprobante ya fue procesado.")

    is_valid, msg = verify_binance_payment(data.order_id, expected_amount)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    db.add(BinanceTransaction(
        user_id=current_user.id,
        order_id=data.order_id,
        amount=expected_amount,
        currency="USDT",
    ))

    if data.type == 'subscription':
        pro_plan = db.query(Plan).filter(Plan.name == "pro").first()
        current_user.plan_id = pro_plan.id
        now = datetime.now(timezone.utc)
        db.add(Subscription(
            user_id=current_user.id,
            paypal_order_id=f"binance_{data.order_id}",
            months_paid=data.item_id,
            tokens_per_month=TOKENS_PER_MONTH_PRO,
            started_at=now,
            ends_at=now + relativedelta(months=data.item_id),
            status="active",
        ))
        assign_monthly_tokens(current_user.id, TOKENS_PER_MONTH_PRO, db)
        message = f"Pago verificado. ¡Pro activado por {data.item_id} mes(es)!"
    else:
        add_extra_tokens(current_user.id, pack.tokens, db)
        message = f"Pago verificado. ¡+{pack.tokens} tokens añadidos!"

    db.commit()
    return {"status": "success", "message": message}


# ─── Pago Móvil ───────────────────────────────────────────

@router.get("/tasa-bcv")
async def obtener_tasa_bcv():
    rate = get_bcv_rate()
    if rate is None:
        raise HTTPException(status_code=503, detail="No se pudo obtener la tasa BCV en este momento.")
    return {"tasa": rate}


@router.post("/reportar-pagomovil")
async def reportar_pago_movil(
    data: ReportPagoMovilRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rate = get_bcv_rate()
    if rate is None:
        raise HTTPException(status_code=503, detail="No se pudo obtener la tasa BCV.")

    if data.type == 'subscription':
        if data.item_id not in SUBSCRIPTION_PRICES:
            raise HTTPException(status_code=400, detail="Duración no válida.")
        amount_usd = float(SUBSCRIPTION_PRICES[data.item_id])
    elif data.type == 'pack':
        pack = db.query(TokenPack).filter(TokenPack.id == data.item_id).first()
        if not pack:
            raise HTTPException(status_code=404, detail="Paquete no encontrado.")
        amount_usd = float(pack.price)
    else:
        raise HTTPException(status_code=400, detail="Tipo de pago no válido.")

    amount_ves = round(amount_usd * rate, 2)

    existing = (
        db.query(PagoMovilTransaction)
        .filter(PagoMovilTransaction.reference_number == data.reference_number)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Esta referencia ya ha sido reportada.")

    nuevo_pago = PagoMovilTransaction(
        user_id=current_user.id,
        reference_number=data.reference_number,
        phone_number=data.phone_number,
        amount_ves=amount_ves,
        amount_usd=amount_usd,
        item_type=data.type,
        item_id=data.item_id,
        status='pending',
    )
    db.add(nuevo_pago)
    db.commit()
    db.refresh(nuevo_pago)
    return {
        "status": "success",
        "message": "Reporte enviado. Un administrador verificará tu pago pronto.",
        "transaction_id": nuevo_pago.id,
    }


# ─── Packs de tokens ──────────────────────────────────────

@router.post("/pack-tokens")
async def crear_orden_pack(
    data: PackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pack = db.query(TokenPack).filter(TokenPack.id == data.pack_id, TokenPack.is_active == True).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado.")

    try:
        order = create_order(
            amount=float(pack.price),
            description=f"DocAI — {pack.name} ({pack.tokens} tokens extra)",
            custom_id=f"pack:{current_user.id}:{pack.id}",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error con PayPal: {e}")

    return {
        "status": "success",
        "order_id": order["order_id"],
        "approval_url": order["approval_url"],
        "pack": {"name": pack.name, "tokens": pack.tokens, "price": float(pack.price)},
    }


@router.post("/confirmar-pack")
async def confirmar_pack(
    data: ConfirmarPackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = capture_order(data.order_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error capturando pago: {e}")

    if result.get("status") != "COMPLETED":
        raise HTTPException(status_code=402, detail="El pago no fue completado por PayPal.")

    pack = db.query(TokenPack).filter(TokenPack.id == data.pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado.")

    add_extra_tokens(current_user.id, pack.tokens, db)
    return {
        "status": "success",
        "message": f"+{pack.tokens} tokens extra añadidos.",
        "pack": pack.name,
    }

from fastapi import FastAPI
from database import engine, SessionLocal
from models import Base, Transaction
from datetime import date
from fastapi import Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os


app = FastAPI()

Base.metadata.create_all(bind=engine)

# Servir frontend desde /static
frontend_path = os.path.join(os.path.dirname(__file__), "../frontend")
app.mount("/static", StaticFiles(directory=frontend_path), name="frontend")



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "API de Finanzas funcionando"}

@app.get("/transactions")
def get_transactions():
    db = SessionLocal()
    transactions = db.query(Transaction).all()
    db.close()

    result = []
    for t in transactions:
        result.append({
            "id": t.id,
            "date": t.date.isoformat(),
            "amount": t.amount,
            "type": t.type,
            "category": t.category,
            "description": t.description
        })
    return result



@app.post("/transactions")
def create_transaction(
    date: date = Body(...),
    amount: float = Body(...),
    type: str = Body(...),
    category: str = Body(...),
    description: str = Body("")
):
    db = SessionLocal()

    transaction = Transaction(
        date=date,
        amount=amount,
        type=type,
        category=category,
        description=description
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    db.close()

    return transaction


@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int):
    db = SessionLocal()
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        db.close()
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(transaction)
    db.commit()
    db.close()
    return {"ok": True}


@app.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    date: date = Body(...),
    amount: float = Body(...),
    type: str = Body(...),
    category: str = Body(...),
    description: str = Body("")
):
    db = SessionLocal()
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        db.close()
        raise HTTPException(status_code=404, detail="Transaction not found")

    transaction.date = date
    transaction.amount = amount
    transaction.type = type
    transaction.category = category
    transaction.description = description

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    db.close()

    return {
        "id": transaction.id,
        "date": transaction.date.isoformat(),
        "amount": transaction.amount,
        "type": transaction.type,
        "category": transaction.category,
        "description": transaction.description
    }
from sqlalchemy import Column, Integer, Float, String, Date
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date)
    amount = Column(Float)
    type = Column(String)  # income | expense
    category = Column(String)
    description = Column(String)

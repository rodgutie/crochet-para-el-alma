from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field


# ---------- Users / Auth ----------

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Literal["customer", "admin"]
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Hero slides ----------

class HeroSlideIn(BaseModel):
    order: int = 0
    image_url: str
    headline: str
    subtext: Optional[str] = ""
    cta_text: Optional[str] = ""
    cta_link: Optional[str] = ""
    active: bool = True


class HeroSlideOut(HeroSlideIn):
    id: str


# ---------- Products ----------

ProductType = Literal["physical", "digital", "course"]


class ProductIn(BaseModel):
    type: ProductType
    name: str
    description: Optional[str] = ""
    price: float = Field(ge=0)
    currency: str = "USD"
    images: list[str] = []
    active: bool = True
    # Physical-only
    stock: Optional[int] = None
    # Digital-only (Phase 2: single downloadable file link; multi-file comes later if needed)
    digital_file_url: Optional[str] = None
    # Course-only: lessons are managed separately in Phase 3; this just
    # reserves the product as a course container for now.


class ProductOut(ProductIn):
    id: str
    created_at: datetime

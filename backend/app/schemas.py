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

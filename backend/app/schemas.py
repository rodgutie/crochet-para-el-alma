from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator


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

class HeroSlideBase(BaseModel):
    order: int = 0
    image_url: str
    headline: str = ""
    subtext: Optional[str] = ""
    cta_text: Optional[str] = ""
    cta_link: Optional[str] = ""
    active: bool = True
    focal_point: Literal["top", "center", "bottom"] = "center"
    focal_x: Literal["left", "center", "right"] = "center"
    eyebrow: Optional[str] = ""
    image_side: Literal["left", "right", "auto"] = "auto"
    accent: Literal["none", "navidad"] = "none"



class HeroSlideIn(HeroSlideBase):
    """Validated admin input. Output (HeroSlideOut) is deliberately lenient so
    legacy documents never break the public list."""

    @field_validator("eyebrow", "subtext", "cta_text", "cta_link", "headline", mode="before")
    @classmethod
    def _text_defaults(cls, v):
        # The editor may send null/whitespace for untouched optional fields.
        return "" if v is None else str(v).strip()

    @field_validator("image_url", mode="before")
    @classmethod
    def _image_url_ok(cls, v):
        v = "" if v is None else str(v).strip()
        if not v:
            raise ValueError("Falta la imagen: sube una o pega su URL.")
        if not (v.startswith("/") or v.lower().startswith(("http://", "https://"))):
            raise ValueError("La URL de la imagen debe empezar con https:// (o con / para imágenes del sitio).")
        return v

    @field_validator("cta_link", mode="after")
    @classmethod
    def _cta_link_ok(cls, v):
        if v and not (v.startswith("/") or v.lower().startswith(("http://", "https://"))):
            raise ValueError("El enlace del botón debe empezar con / (una página del sitio, ej. /tienda) o con https://")
        return v


class HeroSlideOut(HeroSlideBase):
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


# ---------- Course lessons ----------

class CourseLessonIn(BaseModel):
    order: int = 0
    title: str
    video_key: Optional[str] = None       # internal R2 object key, never a public URL
    attachments: list[str] = []           # R2 keys or URLs for PDFs / supplementary files
    duration_seconds: Optional[int] = None


class CourseLessonOut(CourseLessonIn):
    id: str
    product_id: str
    created_at: datetime
    video_status: Literal["none", "processing", "ready", "error"] = "none"


class ReorderIn(BaseModel):
    ordered_ids: list[str]


# ---------- Entitlements ----------

class EntitlementGrantIn(BaseModel):
    user_id: str
    product_id: str


class EntitlementOut(BaseModel):
    id: str
    user_id: str
    product_id: str
    order_id: Optional[str] = None
    granted_at: datetime
    # Denormalized display fields — populated by the admin list endpoint
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    product_name: Optional[str] = None


class MyEntitlementOut(BaseModel):
    """Customer-facing view of their own entitlements, with product info."""
    id: str
    product_id: str
    order_id: Optional[str] = None
    granted_at: datetime
    product_name: str = ""
    product_type: str = ""
    product_images: list[str] = []
    product_description: str = ""

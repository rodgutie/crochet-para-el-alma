from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "crochet_para_el_alma"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    admin_token_expire_minutes: int = 120

    cors_origins: str = "http://localhost:5173"

    first_admin_email: str = "admin@crochetparaelalma.com"
    first_admin_password: str = "change-me-immediately"

    # Cloudflare R2 (S3-compatible) — private bucket for videos/PDFs/attachments
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = ""
    r2_endpoint: str = ""  # https://<account_id>.r2.cloudflarestorage.com

    # Public images bucket — separate R2 bucket with public access enabled.
    # Set R2_IMAGES_BUCKET_NAME to the public bucket name and
    # R2_PUBLIC_IMAGES_URL to its public base URL (e.g. https://pub-xxx.r2.dev
    # or a custom domain).  If left empty the image upload endpoint falls back
    # to the private bucket and serves images through the backend proxy.
    r2_images_bucket_name: str = ""
    r2_public_images_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

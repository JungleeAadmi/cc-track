from pydantic import BaseModel


class UserOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class CardOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class NtfyConfigBase(BaseModel):
    server_url: str
    topic: str


class NtfyConfigOut(NtfyConfigBase):
    id: int

    class Config:
        from_attributes = True

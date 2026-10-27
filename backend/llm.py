"""Calls to OpenAI: written answers (Responses API) and embeddings.

The API key comes from OPENAI_API_KEY, read from .env.local in the project root.
"""
import os
from functools import cache

from dotenv import load_dotenv
from openai import OpenAI

from .catalog import PROJECT_ROOT

load_dotenv(PROJECT_ROOT / ".env.local")

ANSWER_MODEL = "gpt-4.1-mini"


def has_api_key() -> bool:
    return bool(os.environ.get("OPENAI_API_KEY"))


@cache
def client() -> OpenAI:
    return OpenAI()


def generate_answer(instructions: str, input: str | list[dict]) -> str | None:
    """Returns None when no key is configured; raises when the call fails.

    `input` is either one prompt or a chat history: [{"role": "user" | "assistant", "content": "..."}].
    """
    if not has_api_key():
        return None
    response = client().responses.create(model=ANSWER_MODEL, instructions=instructions, input=input)
    return response.output_text

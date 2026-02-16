"""OpenAI GPT AI provider."""

from typing import AsyncGenerator, Optional

from openai import AsyncOpenAI

import config
from ai.providers.base import AIProvider


class OpenAIProvider(AIProvider):
    """AI provider backed by the OpenAI API."""

    DEFAULT_MODEL = "gpt-4o"

    def __init__(
        self,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        **kwargs,
    ):
        self.model = model or config.DEFAULT_MODEL or self.DEFAULT_MODEL
        client_kwargs = {}
        if api_key or config.OPENAI_API_KEY:
            client_kwargs["api_key"] = api_key or config.OPENAI_API_KEY
        if base_url:
            client_kwargs["base_url"] = base_url
        self.client = AsyncOpenAI(**client_kwargs)

    def _build_messages(
        self, prompt: str, system_prompt: Optional[str] = None
    ) -> list[dict]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return messages

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=self._build_messages(prompt, system_prompt),
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content or ""

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 8192,
        temperature: float = 0.3,
    ) -> dict:
        json_prompt = (
            f"{prompt}\n\n"
            "You MUST respond with ONLY valid JSON. "
            "No markdown fences, no explanation, just the JSON object."
        )
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=self._build_messages(json_prompt, system_prompt),
            max_tokens=max_tokens,
            temperature=temperature,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        return self._extract_json(raw)

    async def stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=self._build_messages(prompt, system_prompt),
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content

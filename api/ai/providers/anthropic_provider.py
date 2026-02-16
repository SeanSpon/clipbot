"""Anthropic Claude AI provider."""

from typing import AsyncGenerator, Optional

import anthropic

import config
from ai.providers.base import AIProvider


class AnthropicProvider(AIProvider):
    """AI provider backed by the Anthropic Claude API."""

    DEFAULT_MODEL = "claude-sonnet-4-5-20250929"

    def __init__(
        self,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        **kwargs,
    ):
        self.model = model or config.DEFAULT_MODEL or self.DEFAULT_MODEL
        self.client = anthropic.AsyncAnthropic(
            api_key=api_key or config.ANTHROPIC_API_KEY
        )

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> str:
        kwargs = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system_prompt:
            kwargs["system"] = system_prompt

        response = await self.client.messages.create(**kwargs)
        return response.content[0].text

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 8192,
        temperature: float = 0.3,
    ) -> dict:
        # Append explicit JSON instruction
        json_prompt = (
            f"{prompt}\n\n"
            "You MUST respond with ONLY valid JSON. "
            "No markdown fences, no explanation, just the JSON object."
        )
        raw = await self.generate(
            prompt=json_prompt,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return self._extract_json(raw)

    async def stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        kwargs = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system_prompt:
            kwargs["system"] = system_prompt

        async with self.client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text

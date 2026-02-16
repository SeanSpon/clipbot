"""Local model AI provider (Ollama / any OpenAI-compatible local server)."""

from typing import AsyncGenerator, Optional

from openai import AsyncOpenAI

import config
from ai.providers.base import AIProvider


class LocalProvider(AIProvider):
    """AI provider that connects to a local OpenAI-compatible API.

    Works with Ollama, LM Studio, vLLM, text-generation-webui, etc.
    """

    def __init__(
        self,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        api_key: str = "not-needed",
        **kwargs,
    ):
        self.model = model or config.LOCAL_AI_MODEL
        self.client = AsyncOpenAI(
            base_url=base_url or config.LOCAL_AI_BASE_URL,
            api_key=api_key,
        )

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

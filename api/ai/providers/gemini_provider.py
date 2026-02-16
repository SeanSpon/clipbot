"""Google Gemini AI provider."""

import asyncio
from typing import AsyncGenerator, Optional

import google.generativeai as genai

import config
from ai.providers.base import AIProvider


class GeminiProvider(AIProvider):
    """AI provider backed by the Google Gemini API."""

    DEFAULT_MODEL = "gemini-2.0-flash"

    def __init__(
        self,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
        **kwargs,
    ):
        self.model_name = model or config.DEFAULT_MODEL or self.DEFAULT_MODEL
        genai.configure(api_key=api_key or config.GEMINI_API_KEY)
        self._generation_config = genai.GenerationConfig

    def _get_model(
        self,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> genai.GenerativeModel:
        gen_config = self._generation_config(
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
        kwargs = {
            "model_name": self.model_name,
            "generation_config": gen_config,
        }
        if system_prompt:
            kwargs["system_instruction"] = system_prompt
        return genai.GenerativeModel(**kwargs)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> str:
        model = self._get_model(system_prompt, temperature, max_tokens)
        # google-generativeai's generate_content is synchronous,
        # so we run it in a thread pool to stay async.
        response = await asyncio.to_thread(
            model.generate_content, prompt
        )
        return response.text

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
        model = self._get_model(system_prompt, temperature, max_tokens)
        # Gemini's streaming is synchronous, so we generate full then
        # yield in chunks to keep the async interface consistent.
        response = await asyncio.to_thread(
            model.generate_content, prompt, stream=True
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text

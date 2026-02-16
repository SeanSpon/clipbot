"""Abstract base class for all AI providers."""

import json
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional


class AIProvider(ABC):
    """Base interface that every AI provider must implement."""

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> str:
        """Generate a text completion.

        Args:
            prompt: The user prompt.
            system_prompt: Optional system-level instruction.
            max_tokens: Maximum tokens in the response.
            temperature: Sampling temperature (0.0 - 1.0).

        Returns:
            The model's text response.
        """
        ...

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 8192,
        temperature: float = 0.3,
    ) -> dict:
        """Generate a response and parse it as JSON.

        The prompt should instruct the model to output valid JSON.
        This method extracts the first JSON object or array found
        in the response text.

        Args:
            prompt: The user prompt (should request JSON output).
            system_prompt: Optional system-level instruction.
            max_tokens: Maximum tokens in the response.
            temperature: Lower temperature recommended for structured output.

        Returns:
            Parsed dict from the JSON response.
        """
        raw = await self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return self._extract_json(raw)

    @abstractmethod
    async def stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """Stream text chunks from the model.

        Args:
            prompt: The user prompt.
            system_prompt: Optional system-level instruction.
            max_tokens: Maximum tokens in the response.
            temperature: Sampling temperature.

        Yields:
            Text chunks as they arrive.
        """
        ...
        # Make this an async generator for type checking
        yield ""  # pragma: no cover

    @staticmethod
    def _extract_json(text: str) -> dict:
        """Extract and parse the first JSON object or array from text.

        Handles cases where the model wraps JSON in markdown code fences.
        """
        cleaned = text.strip()

        # Strip markdown code fences
        if cleaned.startswith("```"):
            first_newline = cleaned.index("\n") if "\n" in cleaned else 3
            cleaned = cleaned[first_newline + 1:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

        # Try direct parse first
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Find the first { or [
        for i, ch in enumerate(cleaned):
            if ch in ("{", "["):
                bracket = "}" if ch == "{" else "]"
                depth = 0
                for j in range(i, len(cleaned)):
                    if cleaned[j] == ch:
                        depth += 1
                    elif cleaned[j] == bracket:
                        depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(cleaned[i:j + 1])
                        except json.JSONDecodeError:
                            break
                break

        raise ValueError(f"Could not extract valid JSON from model response: {text[:200]}...")

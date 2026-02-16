from ai.providers.anthropic_provider import AnthropicProvider
from ai.providers.openai_provider import OpenAIProvider
from ai.providers.gemini_provider import GeminiProvider
from ai.providers.local_provider import LocalProvider


_PROVIDERS = {
    "anthropic": AnthropicProvider,
    "claude": AnthropicProvider,
    "openai": OpenAIProvider,
    "gpt": OpenAIProvider,
    "gemini": GeminiProvider,
    "google": GeminiProvider,
    "local": LocalProvider,
    "ollama": LocalProvider,
}


def get_provider(name: str = "anthropic", **kwargs):
    """Factory function to get an AI provider by name.

    Args:
        name: Provider name - one of: anthropic, claude, openai, gpt,
              gemini, google, local, ollama.
        **kwargs: Provider-specific configuration (model, api_key, etc.)

    Returns:
        An initialized AIProvider instance.
    """
    name_lower = name.lower().strip()
    provider_cls = _PROVIDERS.get(name_lower)
    if provider_cls is None:
        available = ", ".join(sorted(set(k for k in _PROVIDERS)))
        raise ValueError(
            f"Unknown AI provider '{name}'. Available: {available}"
        )
    return provider_cls(**kwargs)


__all__ = [
    "get_provider",
    "AnthropicProvider",
    "OpenAIProvider",
    "GeminiProvider",
    "LocalProvider",
]

"""
LLM Provider for NETHRA AI — Google Gemini via google-genai SDK.

Authentication notes (verified against official docs, 2026):
  - Google AI Studio now issues "AQ." prefixed API keys (Authorization Keys).
    These replaced the legacy "AIza" format and are fully supported by
    google-genai >= 1.0.0.  Do NOT assume AQ. keys are invalid.
  - Pass the key via `api_key=` in genai.Client().  The SDK handles the
    correct HTTP Authorization header internally.
  - Do NOT pass the key as a Bearer token manually; the SDK does this.
  - Reference: https://ai.google.dev/gemini-api/docs/api-key

Model notes:
  - "gemini-1.5-pro" is still valid but being deprecated in favour of
    the Gemini 2.x generation.
  - "gemini-2.5-flash" is the current recommended cost-efficient model.
  - "gemini-2.5-pro"  is the current recommended high-quality model.
  - To list all models available to your key:
      for m in client.models.list(): print(m.name)
"""

import logging
import traceback

from google import genai

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMProvider:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None

        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning("Failed to initialize Gemini client: %s", e)
        else:
            logger.info("GEMINI_API_KEY is not set. Operating in local forensic fallback mode.")

    def generate_response(
        self,
        context: str,
        question: str,
        instructions: str,
        history: list = None,
    ) -> str:
        if self.client:
            prompt_parts = [context]

            if history:
                prompt_parts.append("\n=== Conversation History ===")
                for msg in history[-5:]:
                    role = "Investigator" if msg.get("role") == "user" else "Assistant"
                    prompt_parts.append(f"{role}: {msg.get('content')}")

            prompt_parts.append(
                f"\n=== Investigator Question ===\n{question}\n\n{instructions}"
                "\n\nREMINDER: Do NOT include a Sources, References, or Citations "
                "section. The system appends source attribution automatically."
            )
            prompt = "\n".join(prompt_parts)

            # Valid models in google-genai SDK
            models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
            for model_name in models_to_try:
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                    )
                    if response and response.text:
                        return response.text
                except Exception as e:
                    logger.warning("Gemini API call failed with model %s: %s", model_name, e)

        return self._heuristic_investigation_response(context, question)

    def _heuristic_investigation_response(self, context: str, question: str) -> str:
        """
        Generate a structured, evidence-based investigation response directly from the 
        retrieved forensic context when Gemini API is unavailable or GEMINI_API_KEY is not set.
        """
        lines = [f"### NETHRA Forensic Intelligence Response\n"]
        
        sections_found = False
        
        if "=== RETRIEVED EVIDENCE ===" in context:
            try:
                evidence_section = context.split("=== RETRIEVED EVIDENCE ===")[1].split("===")[0].strip()
                if evidence_section:
                    lines.append("#### Evidence Analysis")
                    lines.append(evidence_section)
                    sections_found = True
            except Exception:
                pass

        if "=== ENTITIES & INDICATORS ===" in context:
            try:
                entities_section = context.split("=== ENTITIES & INDICATORS ===")[1].split("===")[0].strip()
                if entities_section:
                    lines.append("\n#### Identified Entities & Indicators")
                    lines.append(entities_section)
                    sections_found = True
            except Exception:
                pass

        if "=== THREAT INTELLIGENCE ===" in context:
            try:
                threats_section = context.split("=== THREAT INTELLIGENCE ===")[1].split("===")[0].strip()
                if threats_section:
                    lines.append("\n#### Threat Intelligence")
                    lines.append(threats_section)
                    sections_found = True
            except Exception:
                pass

        if not sections_found:
            lines.append("No active evidence or entities selected. Select an evidence item from the sidebar focus dropdown or upload new evidence to perform targeted forensic analysis.")

        lines.append("\n*Generated by NETHRA Local Forensic Engine.*")
        return "\n".join(lines)

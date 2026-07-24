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
        self.client_genai = None
        self.client_legacy = None

        if self.api_key:
            # 1. Try google-genai SDK (newest)
            try:
                from google import genai
                self.client_genai = genai.Client(api_key=self.api_key)
                logger.info("Initialized google-genai Client successfully.")
            except Exception as e:
                logger.warning("Could not initialize google-genai Client: %s", e)

            # 2. Try google.generativeai SDK (legacy fallback)
            try:
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=self.api_key)
                self.client_legacy = legacy_genai
                logger.info("Initialized legacy google.generativeai SDK successfully.")
            except Exception as e:
                logger.warning("Could not initialize legacy google.generativeai SDK: %s", e)
        else:
            logger.info("GEMINI_API_KEY is not set. Operating in local forensic fallback mode.")

    def generate_response(
        self,
        context: str,
        question: str,
        instructions: str,
        history: list = None,
    ) -> str:
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

        models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"]

        # Try google-genai SDK first
        if self.client_genai:
            for model_name in models_to_try:
                try:
                    res = self.client_genai.models.generate_content(
                        model=model_name,
                        contents=prompt,
                    )
                    if res and hasattr(res, "text") and res.text:
                        logger.info("Generated response using google-genai | model=%s", model_name)
                        return res.text
                except Exception as e:
                    logger.warning("google-genai call failed for model %s: %s", model_name, e)

        # Try legacy google.generativeai SDK second
        if self.client_legacy:
            for model_name in models_to_try:
                try:
                    gmodel = self.client_legacy.GenerativeModel(model_name)
                    res = gmodel.generate_content(prompt)
                    if res and hasattr(res, "text") and res.text:
                        logger.info("Generated response using legacy google.generativeai | model=%s", model_name)
                        return res.text
                except Exception as e:
                    logger.warning("legacy google.generativeai call failed for model %s: %s", model_name, e)

        return self._heuristic_investigation_response(context, question)

    def _heuristic_investigation_response(self, context: str, question: str) -> str:
        """
        Generate a structured, evidence-based investigation response directly from the 
        retrieved forensic context when Gemini API is unavailable or GEMINI_API_KEY is not set.
        """
        lines = ["### NETHRA Forensic Intelligence Response\n"]
        sections_found = False

        # Match exact ContextBuilder headers
        if "=== Relevant Evidence ===" in context:
            try:
                ev_part = context.split("=== Relevant Evidence ===")[1].split("===")[0].strip()
                if ev_part and "[NO EVIDENCE FOUND" not in ev_part:
                    lines.append("#### Evidence Analysis")
                    lines.append(ev_part)
                    sections_found = True
            except Exception:
                pass

        if "=== Extracted Entities ===" in context:
            try:
                ent_part = context.split("=== Extracted Entities ===")[1].split("===")[0].strip()
                if ent_part and "[None found]" not in ent_part:
                    lines.append("\n#### Identified Entities & Indicators")
                    lines.append(ent_part)
                    sections_found = True
            except Exception:
                pass

        if "=== Relationships ===" in context:
            try:
                rel_part = context.split("=== Relationships ===")[1].split("===")[0].strip()
                if rel_part and "[None found]" not in rel_part:
                    lines.append("\n#### Relationship Network")
                    lines.append(rel_part)
                    sections_found = True
            except Exception:
                pass

        if "=== Threat Intelligence ===" in context:
            try:
                threat_part = context.split("=== Threat Intelligence ===")[1].split("===")[0].strip()
                if threat_part:
                    lines.append("\n#### Threat Intelligence")
                    lines.append(threat_part)
                    sections_found = True
            except Exception:
                pass

        if not sections_found:
            lines.append("No specific evidence or entity matches found for the active query. Upload evidence files or select a specific evidence item in the sidebar focus dropdown to perform targeted forensic analysis.")

        lines.append("\n*Generated by NETHRA Local Forensic Engine.*")
        return "\n".join(lines)

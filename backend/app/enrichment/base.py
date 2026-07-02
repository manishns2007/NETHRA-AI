"""
Base Provider interface for Threat Intelligence Enrichment.
"""
from abc import ABC, abstractmethod
from typing import Any

from app.models.graph import Entity


class BaseProvider(ABC):
    """
    Abstract base class for all threat intelligence providers.
    
    All providers must inherit from this class. The dispatcher will automatically
    discover and execute them for matching entity types.
    """
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """
        The unique name of the provider (e.g., 'whois', 'virustotal').
        This will be used as the key in the Entity.properties dictionary.
        """
        ...
        
    @abstractmethod
    def supported_entity_types(self) -> list[str]:
        """
        Returns a list of entity types this provider supports enriching.
        Example: ["IP", "DOMAIN", "URL"]
        """
        ...

    @abstractmethod
    def enrich(self, entity: Entity) -> dict[str, Any]:
        """
        Execute the external API request to enrich the given entity.
        
        Args:
            entity: The Entity object to enrich (has entity_type, value, etc.)
            
        Returns:
            A dictionary of raw data retrieved from the provider.
            If no data is found or an error occurs (and is handled), return an empty dict.
        """
        ...
        
    @abstractmethod
    def normalize_response(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        """
        Format the raw API response into a standardized JSON structure.
        
        Args:
            raw_data: The output from enrich().
            
        Returns:
            A clean, minimal dictionary to be stored in Entity.properties[provider_name].
        """
        ...

    def run(self, entity: Entity) -> dict[str, Any]:
        """
        Main execution wrapper used by the dispatcher.
        Executes enrich() and then normalize_response().
        """
        raw = self.enrich(entity)
        if not raw:
            return {}
        return self.normalize_response(raw)

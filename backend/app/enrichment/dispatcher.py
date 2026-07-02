"""
Enrichment Dispatcher.

Responsible for auto-discovering providers and routing entities to applicable ones.
"""
import logging
import pkgutil
import importlib
import inspect
from typing import Any

from app.models.graph import Entity
from app.enrichment.base import BaseProvider
from app.enrichment import providers as providers_pkg

logger = logging.getLogger(__name__)

def _discover_providers() -> list[BaseProvider]:
    """
    Dynamically discover and instantiate all BaseProvider subclasses in the 
    `app.enrichment.providers` package.
    """
    discovered = []
    
    # Iterate over all modules in the providers package
    for _, module_name, _ in pkgutil.iter_modules(providers_pkg.__path__):
        full_module_name = f"{providers_pkg.__name__}.{module_name}"
        module = importlib.import_module(full_module_name)
        
        # Find all classes in the module that inherit from BaseProvider
        for name, obj in inspect.getmembers(module, inspect.isclass):
            if issubclass(obj, BaseProvider) and obj is not BaseProvider:
                try:
                    provider_instance = obj()
                    discovered.append(provider_instance)
                    logger.debug(f"Registered enrichment provider: {provider_instance.provider_name}")
                except Exception as e:
                    logger.error(f"Failed to instantiate provider {name}: {e}")
                    
    return discovered

# Singleton registry
_REGISTRY: list[BaseProvider] = _discover_providers()


def run_enrichment(entity: Entity) -> dict[str, Any]:
    """
    Dispatches the entity to all applicable providers and returns the merged result.
    
    Returns a dictionary of new properties to merge into Entity.properties.
    """
    new_properties = {}
    
    logger.info(f"Starting enrichment for entity {entity.id} ({entity.entity_type}: {entity.value})")
    
    for provider in _REGISTRY:
        if entity.entity_type in provider.supported_entity_types():
            logger.info(f"Running provider {provider.provider_name} for entity {entity.id}")
            try:
                result = provider.run(entity)
                if result:
                    new_properties[provider.provider_name] = result
                    logger.info(f"Provider {provider.provider_name} completed for entity {entity.id}")
                else:
                    logger.info(f"Provider {provider.provider_name} returned no data for entity {entity.id}")
            except Exception as e:
                logger.error(f"Provider {provider.provider_name} failed for entity {entity.id}: {e}")
                # We continue to the next provider gracefully
                
    return new_properties


def get_registered_providers() -> list[dict[str, Any]]:
    """
    Returns a list of all registered providers and their supported types.
    """
    return [
        {
            "name": p.provider_name,
            "supported_types": p.supported_entity_types()
        }
        for p in _REGISTRY
    ]

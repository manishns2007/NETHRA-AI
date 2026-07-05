from sqlalchemy.orm import Session
from typing import Dict, Any, List
from .retriever import BaseRetriever
from app.models.graph import Entity

class ThreatRetriever(BaseRetriever):
    def retrieve(self, entity_ids: List[str], max_threats: int = 10) -> Dict[str, Any]:
        # TODO: Accept and apply `investigation_id` filter when DB supports investigations/cases.
        threat_data = []
        
        entities_with_threats = self.db.query(Entity).filter(
            Entity.id.in_(entity_ids)
        ).limit(max_threats).all()
        
        for e in entities_with_threats:
            if e.properties and any(k in e.properties for k in ["WHOIS", "GeoIP", "VirusTotal", "AbuseIPDB"]):
                threat_data.append({
                    "entity": e.value,
                    "type": e.entity_type,
                    "intelligence": e.properties
                })

        return {
            "threats": threat_data
        }

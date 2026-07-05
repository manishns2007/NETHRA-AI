from abc import ABC, abstractmethod
from typing import Dict, Any, List
from sqlalchemy.orm import Session

class BaseRetriever(ABC):
    def __init__(self, db: Session):
        self.db = db

    @abstractmethod
    def retrieve(self, *args, **kwargs) -> Dict[str, Any]:
        """
        Retrieves data and returns a structured dictionary.
        TODO: In the future, once the Database schema supports investigations/cases, 
        add an `investigation_id` parameter to scope all SQL queries to the current case context.
        """
        pass

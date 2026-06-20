from pydantic import BaseModel
from typing import Dict, List


class TelemetryPayload(BaseModel):
    username: str
    session_id: str
    behavioral_data: Dict


class BehavioralAnalysis(BaseModel):
    anomaly_score: float
    confidence: float
    deviations: List[Dict]


class ContextualAnalysis(BaseModel):
    context_risk_score: float
    risk_factors: List[Dict]


class PrivilegeAudit(BaseModel):
    privilege_risk_score: float
    violations: List[Dict]
    banking_impact: float


class TrustScore(BaseModel):
    risk_score: float
    risk_level: str
    narrative: str
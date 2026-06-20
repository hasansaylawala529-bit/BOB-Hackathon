RESOURCE_IMPACT = {
    "Loan Database": 60,
    "KYC Repository": 75,
    "Treasury Database": 90,
    "SWIFT System": 95
}

QUERY_RISK = {
    "SELECT": 10,
    "INSERT": 30,
    "UPDATE": 40,
    "DELETE": 70,
    "DROP": 95,
    "GRANT": 95
}


class PrivilegeAuditor:

    def analyze(
        self,
        resource,
        query_type
    ):

        impact = RESOURCE_IMPACT.get(
            resource,
            50
        )

        query_risk = QUERY_RISK.get(
            query_type,
            20
        )

        privilege_risk = (
            impact *
            query_risk
        ) / 100

        return {
            "resource": resource,
            "query_type": query_type,
            "banking_impact": impact,
            "privilege_risk_score":
                round(privilege_risk, 2)
        }
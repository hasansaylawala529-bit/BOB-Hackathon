from agents.privilege_auditor import PrivilegeAuditor

agent = PrivilegeAuditor()

print(
    agent.analyze(
        resource="SWIFT System",
        query_type="GRANT"
    )
)
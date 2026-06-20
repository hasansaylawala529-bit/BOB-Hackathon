from agents.ticket_correlator import TicketCorrelator

agent = TicketCorrelator()

result = agent.analyze(
    username="ameya_admin",
    resource="Treasury Database"
)

print(result)
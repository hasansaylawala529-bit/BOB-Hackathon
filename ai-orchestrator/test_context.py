from agents.contextualizer import Contextualizer

agent = Contextualizer()

result = agent.analyze(
    username="john_priv",
    device_known=False,
    city="Delhi",
    country="India"
)

print(result)
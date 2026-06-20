from agents.trust_scorer import TrustScorer

scorer = TrustScorer()

result = scorer.calculate(
    behavioral_score=80,
    context_score=70,
    privilege_score=90,
    attack_score=60,
    trust_score=50
)

print(result)
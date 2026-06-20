from engines.continuous_trust_engine import ContinuousTrustEngine

engine = ContinuousTrustEngine()

trust = engine.calculate_trust_decay(
    initial_trust=100,
    hours_since_verification=24
)

print("Trust After Decay:", trust)

updated = engine.update_trust(
    previous_trust=trust,
    observed_trust=60
)

print("Updated Trust:", updated)
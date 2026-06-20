from agents.behavioral_profiler import BehavioralProfiler

agent = BehavioralProfiler()

result = agent.analyze(
    username="john_priv",
    keystroke_dwell=180,
    keystroke_flight=220,
    mouse_speed=500,
    scroll_speed=160
)

print(result)
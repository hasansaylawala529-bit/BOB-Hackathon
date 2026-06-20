from langgraph_flow import graph

payload = {

    "username": "john_priv",

    "role": "PRIVILEGED",

    "keystroke_dwell": 180,
    "keystroke_flight": 220,
    "mouse_speed": 500,
    "scroll_speed": 160,

    "device_known": False,

    "city": "Delhi",
    "country": "India",

    "resource": "Treasury Database",

    "query_type": "DELETE",

    "hours_since_verification": 24
}

result = graph.invoke({
    "payload": payload
})

print(result)
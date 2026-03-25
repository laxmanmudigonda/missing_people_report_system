from datetime import datetime

def calculate_priority(case):
    score = 0

    hours = (datetime.utcnow() - case["createdAt"]).total_seconds() / 3600
    score += hours

    age = case.get("age")
    if age is not None:
        if age < 15:       # Young children – highest risk
            score += 90
        elif age > 60:     # Senior citizens – high risk
            score += 80
        elif age < 18:     # Teenagers – moderate bonus
            score += 40

    return score
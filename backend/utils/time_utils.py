from datetime import datetime

def get_time_since(created_at):
    diff = datetime.utcnow() - created_at
    hours = diff.total_seconds() // 3600

    if hours < 1:
        return "Less than 1 hour"
    elif hours < 24:
        return f"{int(hours)} hours"
    else:
        return f"{int(hours // 24)} days"
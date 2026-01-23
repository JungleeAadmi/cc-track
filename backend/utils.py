import requests

def send_ntfy_alert(user, title, message, priority="default", tags=""):
    """
    Sends a push notification via ntfy.sh (or self-hosted server)
    """
    if not user.ntfy_topic:
        return

    server_url = user.ntfy_server or "https://ntfy.sh"
    # Ensure no trailing slash for clean URL construction
    if server_url.endswith("/"):
        server_url = server_url[:-1]
        
    url = f"{server_url}/{user.ntfy_topic}"
    
    headers = {
        "Title": title,
        "Priority": priority,
        "Tags": tags
    }
    
    try:
        requests.post(url, data=message.encode(encoding='utf-8'), headers=headers, timeout=5)
    except Exception as e:
        print(f"Failed to send ntfy alert: {e}")
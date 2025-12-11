import requests

def send_ntfy_alert(user, title, message, priority="default", tags=None):
    """
    Sends a notification using the user's configured Ntfy settings.
    """
    if not user.ntfy_topic:
        return # No topic set, skip
    
    server = user.ntfy_server or "https://ntfy.sh"
    # Ensure server url doesn't end with slash to avoid double slash
    if server.endswith("/"):
        server = server[:-1]
        
    url = f"{server}/{user.ntfy_topic}"
    
    try:
        headers = {"Title": title, "Priority": priority}
        if tags:
            headers["Tags"] = tags
            
        requests.post(url, data=message, headers=headers, timeout=5)
    except Exception as e:
        print(f"Failed to send Ntfy alert to {url}: {e}")
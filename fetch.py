from mcstatus.server import MinecraftServer
import sys
import json

def get_server_status(ip, port):
    try:
        server = MinecraftServer(ip, port)
        status = server.status()
        return {
            "motd": status.description["text"] if status.description else "N/A",
            "onlinePlayers": status.players.online if status.players.online is not None else "N/A",
            "maxPlayers": status.players.max if status.players.max is not None else "N/A"
        }
    except Exception as e:
        print(f"Error querying Minecraft server: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: fetch.py <ip> <port>")
        sys.exit(1)

    ip = sys.argv[1]
    port = int(sys.argv[2])

    server_status = get_server_status(ip, port)
    if server_status:
        print(json.dumps(server_status))
    else:
        sys.exit(1)

from channels.generic.websocket import AsyncWebsocketConsumer
import json

class AuctionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.auction_id = self.scope['url_route']['kwargs']['auction_id']
        self.group_name = f"auction_{self.auction_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Buraya sadece test amaçlı mesaj bırakabilirsin, istersen boş bırak
        print(f"[WS] Message received: {data}")

    async def broadcast_bid(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_bid",
            "bid": event["bid"]
        }))
    async def broadcast_auction_sold(self, event):
         await self.send(text_data=json.dumps({
            "type": "auction_sold",
            "auction_id": event["auction_id"]
    }))
         
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated:
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            "type": "notification",
            "message": event["message"],
            "link": event.get("link", "")
        }))
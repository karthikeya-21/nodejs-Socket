const WebSocket = require('ws');
const http = require('http');
const { MongoClient,ObjectId  } = require('mongodb');
const url = 'mongodb+srv://root:root@cluster0.1ekprvq.mongodb.net/?retryWrites=true&w=majority'; // replace with your MongoDB server URL
const dbName = 'sockets';
const server = http.createServer();
const wss = new WebSocket.Server({ server });
const { v4: uuidv4 } = require('uuid');

async function getCollection(){
  try{
  const client=new MongoClient(url);
  client.connect();
  return client.db('sockets').collection('users');
  }catch(err){
      console.error(err);
  }
}

async function getUsersWithoutMe(excludedUserId) {
  const userCollection = await getCollection();

  try {
    // Fetch all users except the one with the specified ID
    const users = await userCollection.find(
      { name: { $ne: new ObjectId(excludedUserId) } },
      { projection: { _id: 1, name: 1 } }
    ).toArray();

    return users;
  } catch (error) {
    console.error('Error fetching users', error);
    return [];
  }
}


const socketMap = new Map();

wss.on('connection', async (ws,req) => {
  const username = req.url.replace('/?username=', '');
  const userCollection = await getCollection();
  const socketId = uuidv4();
  socketMap.set(socketId, ws);
  try {
    await userCollection.updateOne({ name: username }, { $set: { connId: socketId } }, { upsert: true });
  } catch (error) {
    console.error('Error updating user');
  }
  ws.send(JSON.stringify({ type: 'connection',data:'Welcome to WebSockets'}));
  // let users =await userCollection.find().toArray() ;
  // const data={type:'userList',data:users};
  // ws.send(JSON.stringify(data));
  ws.on('message',async (message) => {
try {
      const data = JSON.parse(message);
      console.log(data);
      //If a message is recieived
      if(data.type=='message'){
      const recipientId = data.id;
      const messageContent = data.data;

      const recipient = await userCollection.findOne({ _id: new ObjectId(recipientId) });
      if (recipient && recipient.connId) {
        const recipientSocket = socketMap.get(recipient.connId);
        recipientSocket.send(JSON.stringify({
          type: 'message',
          username:username,
          data: `${messageContent}`,
        }));
      } else {
        console.error('Recipient not found or not connected');
      }
    }
    //send all the users
    if(data.type=='userList'){
      console.log("Sending Users List")
      const users = await getUsersWithoutMe(data.name);
      const list={type:'userList',data:users};
      ws.send(JSON.stringify(list));
    }


    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {

  });
});

const PORT = process.env.PORT || 3050;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
});

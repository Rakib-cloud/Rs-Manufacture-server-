const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4pjhf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}


async function run(){
    try{
        await client.connect();
        console.log('database connected');
        const serviceCollection = client.db('rscomparts').collection('parts');
        const orderCollection = client.db("rscomparts").collection("orders");
        const userCollection = client.db('rscomparts').collection('users');
        const reviewCollection = client.db('rscomparts').collection('reviews');
        const profileCollection = client.db('rscomparts').collection('profiles');
      

       

        app.get('/parts', async(req, res) =>{
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/parts',verifyJWT, async(req, res) =>{
          const doctors = await serviceCollection.find().toArray();
          res.send(doctors);
      });
      
      

        app.get('/parts/:id', async(req, res) =>{
            const id = req.params.id;
            const query={_id:ObjectId(id)}
            const parts=await serviceCollection.findOne(query)
            res.send(parts);
        });


        app.post('/uploadorder', async (req, res) => {
            const product = req.body;
            console.log(product)
            const result = await orderCollection.insertOne(product);
            res.send({ success: 'order done' })
        });

        app.post('/review', async (req, res) => {
          const product = req.body;
          console.log(product)
          const result = await reviewCollection.insertOne(product);
          res.send({ success: 'review done' })
      });

        app.get('/orders', async(req, res) =>{
           const query={};
            const order = await orderCollection.find(query).toArray();
            res.send(order);
          });
          app.get('/orders/:id',  async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const order = await orderCollection.findOne(query);
            res.send(order);
          });

          app.post('/create-payment-intent',  async(req, res) =>{
            const service = req.body;
            const price = service.price;
            const amount = price*100;
            const paymentIntent = await stripe.paymentIntents.create({
              amount : amount,
              currency: 'usd',
              payment_method_types:['card']
            });
            res.send({clientSecret: paymentIntent.client_secret})
          });

          app.get('/reviews', async(req, res) =>{
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })

        app.post('/addprofile', async (req, res) => {
          const product = req.body;
          console.log(product)
          const result = await profileCollection.insertOne(product);
          res.send(result)
      });

      app.post('/parts', async (req, res) => {
        const product = req.body;
        console.log(product)
        const result = await serviceCollection.insertOne(product);
        res.send(result)
    });

          app.get('/admin/:email', async(req, res) =>{
            const email = req.params.email;
            const user = await userCollection.findOne({email: email});
            const isAdmin = user.role === 'admin';
            res.send({admin: isAdmin})
          });

          app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
              const filter = { email: email };
              const updateDoc = {
                $set: { role: 'admin' },
              };
              const result = await userCollection.updateOne(filter, updateDoc);
              res.send(result);
            }
            else{
              res.status(403).send({message: 'forbidden'});
            }
      
          });
         

          app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
          });

          app.get('/user',  async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
          });

    }
    finally{

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello Rs computer!')
  })
  
  app.listen(port, () => {
    console.log(`Rs computer App listening on port ${port}`)
  })
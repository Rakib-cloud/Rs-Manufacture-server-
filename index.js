const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4pjhf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run(){
    try{
        await client.connect();
        console.log('database connected');
        const serviceCollection = client.db('rscomparts').collection('parts');
        const orderCollection = client.db("rscomparts").collection("orders");

        app.get('/parts', async(req, res) =>{
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })

        app.get('/parts/:id', async(req, res) =>{
            const id = req.params.id;
            const query={_id:ObjectId(id)}
            const parts=await serviceCollection.findOne(query)
            res.send(parts);
        })


        app.post('/uploadorder', async (req, res) => {
            const product = req.body;
            console.log(product)
            const result = await orderCollection.insertOne(product);
            res.send({ success: 'Product Upload Successfully' })
        })

        app.get('/orders', async(req, res) =>{
           const query={};
            const order = await orderCollection.find(query).toArray();
            res.send(order);
          })


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
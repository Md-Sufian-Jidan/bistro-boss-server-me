const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 8000;

//middlewares
app.use(cors());
app.use(express.json());
//---------------------

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qvjjrvn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const menuCollection = client.db("restaurantBistro").collection('bistroMenu')
        const reviewsCollection = client.db("restaurantBistro").collection('bistroReviews')
        const usersCollection = client.db("restaurantBistro").collection('users')
        const cartCollection = client.db("restaurantBistro").collection('carts')

        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // creating jwt token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
            res.send({ token });
        });

        // save a user in db
        app.post('/users', async (req, res) => {
            const user = req.body;

            // insert email if user doesn't exist:
            // you can do this many ways (1. email unique, 2. upsert, 3. simple checking)
            const query = { email: user.email };
            const existInUsers = await usersCollection.findOne(query);
            if (existInUsers) {
                return res.send({ message: 'user already exist' });
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
        // menu api
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        });
        // reviews api 
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result);
        });
        // get all the cart data
        app.get('/carts', async (req, res) => {
            const email = req?.query?.email;
            let query = {};
            if (query) {
                query = { email: email };
            }
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        });

        // save a cart in db
        app.post('/carts', async (req, res) => {
            const cardItem = req.body;
            console.log(cardItem);
            const result = await cartCollection.insertOne(cardItem);
            res.send(result);
        });

        // delete a cart
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
//------------------------


app.get('/', (req, res) => {
    res.send('bistro boss is running');
});

app.listen(port, () => {
    console.log('kitchen is running', port);
});
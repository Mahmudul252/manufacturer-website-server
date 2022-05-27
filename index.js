const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();
const strip = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c1vp23d.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db('toolsExpress').collection('tools');
        const reviewCollection = client.db('toolsExpress').collection('reviews');
        const orderCollection = client.db('toolsExpress').collection('orders');
        const userCollection = client.db('toolsExpress').collection('users');

        app.get('/tools', async (req, res) => {
            const query = {};
            const result = await toolsCollection.find(query).toArray();
            res.send(result);
        });

        app.get('/reviews', async (req, res) => {
            const query = {};
            const result = await reviewCollection.find(query).toArray();
            res.send(result);
        });

        app.get('/orders', async (req, res) => {
            const query = {};
            const result = await orderCollection.find(query).toArray();
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const query = {};
            const result = await userCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/create-payment-intents', async (req, res) => {
            const { totalPrice } = req.body;
            const amount = totalPrice * 100;
            const paymentIntent = await strip.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret });
        });

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const order = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedOrder = {
                $set: {
                    paid: order.paid
                }
            }
            const result = await orderCollection.updateOne(filter, updatedOrder, options);
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        app.post('/tools', async (req, res) => {
            const tool = req.body;
            const result = await toolsCollection.insertOne(tool);
            res.send(result);
        });

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        app.put('/users/:id', async (req, res) => {
            const id = req.params.id;
            const userInfo = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            let updatedUser;
            if (userInfo.role) {
                updatedUser = {
                    $set: {
                        role: userInfo.role
                    }
                }
            }
            else {
                updatedUser = {
                    $set: {
                        location: userInfo.location,
                        linkedIn: userInfo.linkedIn,
                        education: userInfo.education,
                        phone: userInfo.phone
                    }
                }
            }
            const result = await userCollection.updateOne(filter, updatedUser, options);
            res.send(result);
        });
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', async (req, res) => {
    res.send('Tools Express running');
});

app.listen(port, () => {
    console.log("Pip Pip, Tools express running on it's track", port);
});


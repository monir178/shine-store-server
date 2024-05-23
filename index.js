const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// Remove "/" from your production URL if needed
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            // Add your production frontend URL here
        ],
        credentials: true,
    })
);

// Middleware
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ulnoerh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

let client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const database = client.db('shineStore');
        const productsCollection = database.collection('products');



        app.get('/all-products', async (req, res) => {

            try {
                const allProducts = await productsCollection.find({}).toArray();
                res.status(200).json(allProducts)
            } catch (error) {
                res.status(500).json({ message: 'Error fetching flash sale products' });
            }
        })

        // Fetch flash sale products
        app.get('/flash-sale', async (req, res) => {
            try {
                const flashSaleProducts = await productsCollection.find({ flashSale: true }).toArray();
                res.status(200).json(flashSaleProducts);
            } catch (error) {
                res.status(500).json({ message: 'Error fetching flash sale products' });
            }
        });

        // Fetch trending products
        app.get('/trending-products', async (req, res) => {
            try {
                const trendingProducts = await productsCollection.find().sort({ ratings: -1 }).limit(6).toArray();
                res.status(200).json(trendingProducts);
            } catch (error) {
                res.status(500).json({ message: 'Error fetching trending products' });
            }
        });


        // Fetch single product by ID
        app.get('/products/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const product = await productsCollection.findOne({ _id: new ObjectId(id) });
                res.status(200).json(product);
            } catch (error) {
                res.status(500).json({ message: 'Error fetching product' });
            }
        });

        // Create a new product
        app.post('/products', async (req, res) => {
            try {
                const product = req.body;
                const result = await productsCollection.insertOne(product);
                res.status(201).json(result);
            } catch (error) {
                res.status(500).json({ message: 'Error creating product' });
            }
        });

        // Update a product by ID
        app.put('/products/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const updatedProduct = req.body;
                const result = await productsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedProduct }
                );
                res.status(200).json(result);
            } catch (error) {
                res.status(500).json({ message: 'Error updating product' });
            }
        });

        // Delete a product by ID
        app.delete('/products/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
                res.status(200).json(result);
            } catch (error) {
                res.status(500).json({ message: 'Error deleting product' });
            }
        });


        // Fetch all products with optional category, price, and ratings filtering
        app.get('/products', async (req, res) => {

            try {
                const category = req.query.category;

                const priceLow = parseFloat(req.query.priceLow);
                const priceHigh = parseFloat(req.query.priceHigh);
                const ratingsLow = parseFloat(req.query.ratingsLow);
                const ratingsHigh = parseFloat(req.query.ratingsHigh);

                const conditions = [];

                if (category) {
                    conditions.push({ category: category });
                }

                if (!isNaN(priceLow) && !isNaN(priceHigh)) {
                    conditions.push({ price: { $gte: priceLow, $lte: priceHigh } });
                } else if (!isNaN(priceLow)) {
                    conditions.push({ price: { $gte: priceLow } });
                } else if (!isNaN(priceHigh)) {
                    conditions.push({ price: { $lte: priceHigh } });
                }

                if (!isNaN(ratingsLow) && !isNaN(ratingsHigh)) {
                    conditions.push({ ratings: { $gte: ratingsLow, $lte: ratingsHigh } });
                } else if (!isNaN(ratingsLow)) {
                    conditions.push({ ratings: { $gte: ratingsLow } });
                } else if (!isNaN(ratingsHigh)) {
                    conditions.push({ ratings: { $lte: ratingsHigh } });
                }

                console.log({ conditions });

                if (conditions.length === 0) {
                    return res.status(200).json([]);
                }

                const products = await productsCollection.find({
                    $and: conditions
                }).toArray();

                res.status(200).json(products);
            } catch (error) {
                res.status(500).json({ message: 'Error fetching products' });
            }
        });


    } catch (error) {
        console.error(error);
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Shine Store Server is Running');
});

app.listen(port, () => console.log(`Shine Store Server running on port: ${port}`));

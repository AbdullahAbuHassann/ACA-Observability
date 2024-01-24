import enableAppInsights from './config';

enableAppInsights();

import express from 'express';
import { json } from 'body-parser';
import axios from 'axios';

// DAPR Configuration
const daprHost = process.env.DAPR_HOST || "http://localhost";
const daprHttpPort = process.env.DAPR_HTTP_PORT || "3500";
const port = 3002;

const app = express();

//Parse JSON
app.use(json());

//Define Product interface
interface Product {
    id: string;
    name: string;
    amount: number;
}

//Define Event interface
interface Event {
    type: string;
    data: {
        productId: string;
        amount: number;
    };
};

//Hardcoded list of products for demo purposes
const products: Record<string, Product> = {
    "1": { id: "1", name: "Product 1", amount: 3 },
    "2": { id: "2", name: "Product 2", amount: 5 },
    "3": { id: "3", name: "Product 3", amount: 8 },
};


//Get all products
app.get("/", (req, res) => {
    res.status(200).json(products);
});

//Event Handler
app.post("/events", (req, res) => {
    //Get event from request body
    const { type, data } = req.body;
    console.log("Received Event", type);

    //If event type is InventoryUpdated, update the product amount and send response
    if (type === "InventoryUpdated") {
        if (products[data.productId]) {
            products[data.productId].amount = data.amount;
            res.send({ status: "Event processed" });
        } else {
            console.log(`Product ID not found: ${data.productId}`);
            res.status(404).send({ error: "Product not found" });
        }
    } else {
        console.log(`Event type not recognized: ${type}`);
        res.status(400).send({ error: "Invalid event type" });
    }
});

app.listen(port, async () => {
    console.log(`Aggregator Server is listening on port ${port}`);
    
    // This code is executed when the server starts to fetch for missed events in case the server was down
    try {
        const response = await axios.get(`${daprHost}:${daprHttpPort}/v1.0/invoke/events/method/events`);
        const events: Event[] = response.data;
        events.forEach(event => {
            console.log('Processing event:', event.type);
            if (event.type === "InventoryUpdated" && products[event.data.productId]) {
                products[event.data.productId].amount = event.data.amount;
            }
        });
    } catch (error) {
        console.error('Error fetching events from Dapr:', error);
    }
});
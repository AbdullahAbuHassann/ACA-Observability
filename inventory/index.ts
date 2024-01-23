import enableAppInsights from '../config/appinsights'
enableAppInsights();

import express from 'express';
import { json } from 'body-parser';
import axios from 'axios';

const app = express();
const port = 3001;

const daprHost = process.env.DAPR_HOST || "http://localhost";
const daprHttpPort = process.env.DAPR_HTTP_PORT || "3500";

//InventoryItem interface
interface InventoryItem {
    id: string;
    amount: number;
}

//Inventory interface
interface Inventory {
    [productId: string]: InventoryItem;
}

//Hardcoded list of inventory for demo purposes
const inventoryList: Inventory = {
    "1": { id: "1", amount: 3 },
    "2": { id: "2", amount: 5 },
    "3": { id: "3", amount: 8 },
};

//Parse JSON
app.use(json());

//Get specific product inventory
app.get('/:productId/inventory', (req, res) => {
    const { productId } = req.params;
    const productInventory = inventoryList[productId];
    if (!productInventory) {
        return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(productInventory);
});

//Update specific product inventory
app.post('/:productId/inventory', async (req, res) => {
    const { productId } = req.params;
    const { amount } = req.body;

    if (!inventoryList[productId]) {
        return res.status(404).json({ error: "Product not found" });
    }

    inventoryList[productId].amount = amount;

    //Send event to event bus
    try {
        await axios.post(`${daprHost}:${daprHttpPort}/v1.0/invoke/events/method/events`, {
            type: 'InventoryUpdated',
            data: {
                productId,
                amount: inventoryList[productId].amount,
            }
        });
    } catch (error) {
        console.error("Error notifying inventory update:", error);
        return res.status(500).json({ error: "Error updating inventory" });
    }

    res.status(201).json({ productInventory: inventoryList[productId] });
});


app.listen(port, async () => {
    console.log(`Inventory Server is listening on port ${port}`);
});
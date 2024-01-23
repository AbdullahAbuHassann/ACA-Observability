import enableAppInsights from '../config/appinsights'
enableAppInsights();

import express from 'express';
import {json} from 'body-parser';
import axios from 'axios';

const app = express();

const DAPR_HOST = process.env.DAPR_HOST || "http://localhost";
const DAPR_HTTP_PORT = process.env.DAPR_HTTP_PORT || "3500";

const port = 4000;

//Event interface
interface Event {
    type: string;
    data: {
        productId: string;
        amount: number;
    };
};

//List of events for services who missed events
const events = [] as Event[];


//Parse JSON
app.use(json());

//Get all events
app.get("/events", (req, res) => {
    res.status(200).json(events);
  });  

//Send events to subscribers
app.post('/events', async (req, res) => {
    const event = req.body;
    console.log('Received Event', event.type);

    events.push(event);

    if (event.type === 'InventoryUpdated') {
        try {
            await axios.post(`${DAPR_HOST}:${DAPR_HTTP_PORT}/v1.0/invoke/aggregator/method/events`, event);
            res.status(200).json({message: "Inventory Updated Event Successfully Sent to Aggregator Service"})
        } catch (error) {
            console.error('Error invoking aggregator service:', error);
            res.status(500).send('Error invoking aggregator service for InventoryUpdated event');
        }
    }
});


app.listen(port, () => {
    console.log(`Event Bus is listening on port ${port}`);
});



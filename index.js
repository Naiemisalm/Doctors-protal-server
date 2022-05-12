const express = require('express')
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PROT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mk4p8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log('data connected')
        const serviceCllection = client.db('doctors-protal').collection('services')
 
        app.get('/service', async(req, res) =>{
            const query = {};
            const cursor = serviceCllection.find(query);
            const service = await cursor.toArray();
            res.send(service)

        })

    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello doctor!')
})

app.listen(port, () => {
    console.log(`doctor app listening on port ${port}`)
})
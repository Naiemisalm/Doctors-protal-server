const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = process.env.PROT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mk4p8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function veryfiyJWT(req, res, next) {
    const authHeader = req.headers.authoraization;
    console.log(authHeader)
    if (!authHeader) {
        return res.status(401).send({ message: 'unAuthorization access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token,'e122b7a6b8c5eecb94f993a4d63707b0664766c18669e123b1a6d4bf4d0799e8a13c6f97db3b45d5be5c07d13427db730c20ead62ca374f90daad7f765456545', function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden access" })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        await client.connect();
        console.log('data connected')
        const serviceCllection = client.db('doctors-protal').collection('services')
        const bookingCllection = client.db('doctors-protal').collection('bookings')
        const userCllection = client.db('doctors-protal').collection('users')

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCllection.find(query);
            const service = await cursor.toArray();
            res.send(service)
        });

        app.get('/user', async (req, res) =>{
            const users = await userCllection.find().toArray();
            res.send(users);
        })

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCllection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email },'e122b7a6b8c5eecb94f993a4d63707b0664766c18669e123b1a6d4bf4d0799e8a13c6f97db3b45d5be5c07d13427db730c20ead62ca374f90daad7f765456545', { expiresIn: '1h' })
            res.send({ result, token });
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date;

            // step 1: all service

            const services = await serviceCllection.find().toArray();

            //step 2: get the booking of the day
            const query = { date: date };
            const bookings = await bookingCllection.find(query).toArray();

            // step 3: for each service
            services.forEach(service => {
                // step 4: find bookings for that service. output: [{}, {}, {}, {}]
                const serviceBookings = bookings.filter(book => book.treatment === service.name);
                // step 5: select slots for the service Bookings: ['', '', '', '']
                const bookedSlots = serviceBookings.map(book => book.slot);
                // step 6: select those slots that are not in bookedSlots
                const available = service.slots.filter(slot => !bookedSlots.includes(slot));
                //step 7: set available to slots to make it easier 
                service.slots = available;

            })
            res.send(services);
        })


        app.get('/booking', veryfiyJWT, async (req, res) => {
            const patient = req.query.patient;
            const authoraization = req.headers.authoraization;
            console.log('auth headers', authoraization);

            const decodedEmail = req.decoded.email;
            if (patient === decodedEmail) {
                const query = { patient: patient }
                const bookings = await bookingCllection.find(query).toArray();
                res.send(bookings);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }

        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { tretment: booking.tretment, date: booking.date, patient: booking.patient }
            const exists = await bookingCllection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCllection.insertOne(booking);
            return res.send({ success: true, result });

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
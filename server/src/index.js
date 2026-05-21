const express = require('express')
const cors = require('cors')

const reportsRouter = require('./routes/reports.routes')
const authRouter = require('./routes/auth.routes')
const claimsRouter = require('./routes/claims.routes')

const app = express()

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('API working')
})

app.use('/reports', reportsRouter)
app.use('/auth', authRouter)
app.use('/claims', claimsRouter)

app.listen(5000, () => console.log('Server running'))

const express = require('express')
const cors = require('cors')

const reportsRouter = require('./routes/reports.routes')
const authRouter = require('./routes/auth.routes')
const claimsRouter = require('./routes/claims.routes')
const messagesRouter = require('./routes/messages.routes')
const matchesRouter = require('./routes/matches.routes')
const { router: notificationsRouter } = require('./routes/notifications.routes')

const app = express()

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('API working')
})

app.use('/reports', reportsRouter)
app.use('/auth', authRouter)
app.use('/claims', claimsRouter)
app.use('/messages', messagesRouter)
app.use('/matches', matchesRouter)
app.use('/notifications', notificationsRouter)

app.listen(30004, () => console.log('Server running on port 30004'))

import path from 'node:path'

import jsonServer from 'json-server'

const app = jsonServer.create()
const router = jsonServer.router(path.join(process.cwd(), 'db.json'))
const middlewares = jsonServer.defaults()

app.use(middlewares)
app.use(jsonServer.bodyParser)
app.use(router)

export default app

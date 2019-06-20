import { request } from "https"

const accessToken = "a43970caa5668b1418d7bdd3da5a10a1cc55ba49"

const headers = { Authorization: `Bearer ${accessToken}`, "user-agent": "node.js" }
const query = JSON.stringify({ query: "{ viewer { login name } }" })

const options = {
  hostname: "api.github.com",
  path: "/graphql",
  method: "POST",
  headers
}

const callback = resp => {
  let data = ""
  resp.on("data", chunk => (data += chunk))
  resp.on("end", () => process.stdout.write(data))
}

const req = request(options)
  .on("response", callback)
  .on("error", process.stdout.write)

req.write(query)
req.end()

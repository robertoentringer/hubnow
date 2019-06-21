import { request } from "https"

import util from "util"

const accessToken = "a43970caa5668b1418d7bdd3da5a10a1cc55ba49"

const query = `query repo($first: Int, $after: String) {
  viewer {
    login
    name
    repositories(first: $first, after: $after, isFork: false) {
      nodes {
        name
        sshUrl
      }
      edges {
        cursor
        node {
          id
          name
        }
      }
      totalCount
      pageInfo {
        startCursor
        hasNextPage
        endCursor
      }
    }
  }
}`
const variables = { first: 10, after: "Y3Vyc29yOnYyOpHOB3nnIg==" }
const graphql = { query, variables }

const headers = { Authorization: `Bearer ${accessToken}`, "user-agent": "node.js" }
const options = {
  hostname: "api.github.com",
  path: "/graphql",
  method: "POST",
  headers
}

const api = () =>
  new Promise((resolve, reject) => {
    const cb = (resp, data = "") => {
      resp.on("data", chunk => (data += chunk))
      resp.on("end", () => resolve(data))
    }
    const req = request(options)
      .on("response", cb)
      .on("error", err => reject(err))
    req.write(JSON.stringify(graphql))
    req.end()
  })

const main = async () => console.log(util.inspect(JSON.parse(await api()), true, 12, true))

main()

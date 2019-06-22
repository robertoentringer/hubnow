import { request } from "https"
import util from "util"

const query = `query repo($first: Int) {
  viewer {
    login
    name
    repositories(first: $first, isFork: false) {
      nodes {
        name
        sshUrl
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
const variables = { first: 2 }
const graphql = { query, variables }
const accessToken = "a43970caa5668b1418d7bdd3da5a10a1cc55ba49"
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

const main = async () => {
  const data = await api()
  const obj = JSON.parse(data)
  const {
    data: {
      viewer: {
        repositories: { nodes: repos }
      }
    }
  } = obj
  const search = (needle, haystack, found = []) => {
    Object.keys(haystack).forEach(key => {
      if (typeof haystack[key] === "object") search(needle, haystack[key], found)
      else if (key === needle) {
        found.push(haystack[key])
        return found
      }
    })
    return found
  }
  let names = []
  JSON.parse(data, (key, value) => {
    if (key === "name") names.push(value)
    return value
  })
  console.log(search("name", obj))
  console.log(names)
  console.log(util.inspect(obj, true, 12, true))
  console.log(repos)
}

main()

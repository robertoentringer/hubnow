#!/usr/bin/env node

const { spawnSync } = require('child_process')
const inquirer = require('inquirer')
const { request } = require('https')
const { homedir } = require('os')
const path = require('path')
const fs = require('fs')

const home = path.join(homedir(), '.hubnow')
const auth = path.join(home, 'auth.json')

const getRepos = async (opts) => {
  const query = `query repo {
    viewer {
      repositories(first: 100, isFork: ${opts.isFork}, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          nameWithOwner
          ${opts.url}
        }
      }
    }
  }`
  const token = await getToken()
  const variables = { first: 100 }
  const graphql = { query, variables }
  const headers = { Authorization: `Bearer ${token}`, 'user-agent': 'node.js' }
  const options = { hostname: 'api.github.com', path: '/graphql', method: 'POST', headers }

  const fetch = () =>
    new Promise((resolve, reject) => {
      const cb = (resp, data = '') => {
        resp.on('data', (chunk) => (data += chunk))
        resp.on('end', () => resolve(data))
      }
      const req = request(options)
        .on('response', cb)
        .on('error', (err) => reject(err))
      req.write(JSON.stringify(graphql))
      req.end()
    })

  let repos
  const data = await fetch()
  const resp = JSON.parse(data, (key, val) => (key === 'nodes' && (repos = val), val))

  if (repos) return repos.map((repo) => ({ name: repo.nameWithOwner, value: repo[opts.url] }))

  if (resp.message === 'Bad credentials') {
    await inputToken()
    return getRepos(opts)
  }

  console.error('ERROR:', resp.errors[0].message)
  process.exit()
}

const inputsOptions = async () => {
  const { isFork } = await inquirer.prompt([
    {
      name: 'isFork',
      type: 'confirm',
      message: 'Include forked repos in the list of available repositories ?',
      default: false
    }
  ])
  const { url } = await inquirer.prompt([
    {
      name: 'url',
      type: 'list',
      message: 'Cloning with SSH or HTTPS URLs ( see https://git.io/fjPs1 ) ? ',
      choices: [
        { name: 'SSH', value: 'sshUrl' },
        { name: 'HTTPS ', value: 'url' }
      ]
    }
  ])
  const { repo } = await inquirer.prompt([
    {
      name: 'repo',
      type: 'list',
      message: 'Select a repo to clone :',
      choices: await getRepos({ isFork, url })
    }
  ])
  const { folder } = await inquirer.prompt([
    {
      name: 'folder',
      type: 'input',
      message: 'Clone the repo into :',
      default: path.basename(repo, '.git')
    }
  ])
  return { isFork, url, repo, folder }
}

const inputToken = async () => {
  const validate = (input) => (input ? true : 'Token is required!')
  const name = 'token'
  const message = 'Enter your github token ( see https://git.io/fjrf3 ) :'
  const { token } = await inquirer.prompt([{ type: 'input', name, message, validate }])
  saveToken(token)
  return token
}

const saveToken = (token) => {
  if (!fs.existsSync(home)) fs.mkdirSync(home)
  const helptext = "This is your github credentials file. DON'T SHARE! More: https://git.io/fjrf3"
  const filecontent = JSON.stringify({ helptext, token }, null, 2)
  fs.writeFileSync(auth, filecontent)
}

const getToken = async () => {
  try {
    return JSON.parse(fs.readFileSync(auth)).token
  } catch (err) {
    return await inputToken()
  }
}

const main = async () => {
  await getToken()
  const opts = await inputsOptions()
  spawnSync('git', ['clone', opts.repo, opts.folder], { stdio: 'inherit' })
}

main()

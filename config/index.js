// export default {
module.exports = {
  // dbPath: 'mongodb://localhost/graphql'
  mongodb: {
    host: 'mongodb://localhost',
    database: '/quiz',
    opt: {
      useMongoClient: true,
      autoReconnect: true // 自动重连
    }
  }
}



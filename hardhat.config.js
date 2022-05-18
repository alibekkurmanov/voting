require('@nomiclabs/hardhat-waffle');
require("dotenv").config({ path: ".env" });
require('solidity-coverage');

module.exports = {
  solidity: '0.8.1',
  networks: {
    rinkeby: {
      url: process.env.ALCHEMY_API_KEY_URL,
      accounts: [process.env.RINKEBY_PRIVATE_KEY],
    },
  },
};
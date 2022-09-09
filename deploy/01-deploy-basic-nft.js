const {network} = require("hardhat")
const {developmentChains} = require("../helper-hardhat-config.js")
const {verify} = require("../utils/verify")

//  start the script now
module.exports = async function ({getNamedAccounts, deployments}) {     // get auto-pulled from hre, hence, all-time available
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()

    console.log("-----Deploying BasicNFT Smart Contract----------")
    console.log(`Deployer: ${deployer}`)

    //  1. Deploy
    const args = []
    const basicNft = await deploy("BasicNft", {                         //  imp. of await here, contract won't be deployed and control will pass over to next lo()
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,      //  After adding Network info in config.js, we've put in the variable, not a specific value, unless needed for giving more time to wait.
    })
    console.log("------Deployed BasicNFT!!---------")
    
    //  2. Verify on Etherscan, if it's Rinkeby
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying on Etherscan...")
        await verify(basicNft.address, args)
        //  it takes address and args of the S/C as parameters
        log("-------------------------------")
    }
}

module.exports.tags = ["all", "basicNft"]
// removed "all" from the above tag for Unit-testing RandomIpfsNft.sol (and Mock)
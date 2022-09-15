const {network, ethers} = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config.js")
const {verify} = require("../utils/verify")
const fs = require("fs")

//  start the script now
module.exports = async function ({getNamedAccounts, deployments}) {     // get auto-pulled from hre, hence, all-time available
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    
    const chainId = network.config.chainId

    if(developmentChains.includes(network.name)) {
        const EthUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = EthUsdAggregator.address 
    }
    else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }
    // after importing both svg files, read those in this script for deployment
    // <svg>...</svg> tags: string is read into these 2 vars
    const lowSvg = await fs.readFileSync("./images/DynamicSvgNft/frown.svg", {encoding: "utf8"})
    const highSvg = await fs.readFileSync("./images/DynamicSvgNft/happy.svg", {encoding: "utf8"})

    // all args populated
    const args = [ethUsdPriceFeedAddress, lowSvg, highSvg]
    // deploy now
    console.log("------Deploying DynamicSvgNft.sol--------")
    const dynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1, 
    })
    console.log("------DynamicSvgNft.sol deployed!!--------")

    // Now, verifying...
    // Verify on Etherscan, if it's Rinkeby
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying on Etherscan...")
        await verify(dynamicSvgNft.address, args)
        //  it takes address and args of the S/C as parameters
        log("-----------Verified---------------")
    }
}

module.exports.tags = ["all", "dynamicsvgnft", "main"]

/* explanation of fs.readFileSync(path[, options])
path <string- "within quotes"> <buffer>
options:
    encoding <string>
Returns: <string> | <Buffer>
Returns the contents of the path.
If the encoding option is specified then this function returns a string. 
Otherwise it returns a buffer and we need <string> = contents of both the svg files
*/
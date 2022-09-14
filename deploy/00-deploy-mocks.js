const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

// 2 args to be passed to the VRFCoodV2Mock
const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 ETH is the "Premium". Patrick said 0.25 LINK - I doubt???
//log(`BASE_FEE value set: ${BASE_FEE}`)
const GAS_PRICE_LINK = 1e9 //1 * 10 ** 9 = 1000000000 = 1Gwei. Details mentioned on notebook @ Aug 03.

// 2 args to be passed to MockV3Aggregator
const DECIMALS = 18
const INITIAL_ANSWER = 2000

module.exports = async function ({getNamedAccounts, deployments}) {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    
    // supplying args to both the Mocks
    const argsVRF = [BASE_FEE, GAS_PRICE_LINK]           // both args inside module.exports, then assigned to args below.
    const argsPriceFeed = [DECIMALS, INITIAL_ANSWER]

if (developmentChains.includes(network.name)){
    console.log("Local / Development network detected, deploying both the mocks...")

    // deploy Mock - VRF Coordinator for this
    console.log("-----Deploying VRFCoordinatorV2Mock.sol-------")
    await deploy("VRFCoordinatorV2Mock", {
        from: deployer,
        log: true,
        args: argsVRF,
    })
    console.log("-----VRFCoordinatorV2Mock deployed!-------")

    // deploy Mock - V3 Aggregator for this
    console.log("-----Deploying MockV3Aggregator.sol-------")
    await deploy("MockV3Aggregator", {
        from: deployer,
        log: true,
        args: argsPriceFeed,
    })
    console.log("-----MockV3Aggregator also deployed!-------")

}
    
}

module.exports.tags = ["all", "mocks"]
